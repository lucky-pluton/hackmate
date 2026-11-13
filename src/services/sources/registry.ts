import type { Opportunity, IngestionLog, AdminReviewItem } from '../../types';
import type { OpportunitySourceAdapter } from './adapter.interface';
import {
  UnstopAdapter,
  DevfolioAdapter,
  DevpostAdapter,
  MLHAdapter,
  Hack2skillAdapter,
  HackerEarthAdapter,
  DoraHacksAdapter,
  HackClubAdapter,
  LablabAdapter,
  HackIndiaAdapter,
  HackalendarAdapter,
} from './adapters';
import { Validator } from '../pipeline/validator';
import { Deduplicator } from '../pipeline/deduplicator';

export class SourceAdapterRegistry {
  private static adapters: Map<string, OpportunitySourceAdapter> = new Map([
    ['unstop', UnstopAdapter],
    ['devfolio', DevfolioAdapter],
    ['devpost', DevpostAdapter],
    ['mlh', MLHAdapter],
    ['hack2skill', Hack2skillAdapter],
    ['hackerearth', HackerEarthAdapter],
    ['dorahacks', DoraHacksAdapter],
    ['hackclub', HackClubAdapter],
    ['lablab', LablabAdapter],
    ['hackindia', HackIndiaAdapter],
    ['hackalendar', HackalendarAdapter],
  ]);

  public static getAllAdapters(): OpportunitySourceAdapter[] {
    return Array.from(this.adapters.values());
  }

  public static getAdapter(id: string): OpportunitySourceAdapter | undefined {
    return this.adapters.get(id);
  }

  public static updateAdapterStatus(id: string, status: 'ACTIVE' | 'PAUSED' | 'PENDING_INTEGRATION') {
    const adapter = this.adapters.get(id);
    if (adapter) {
      adapter.metadata.status = status;
    }
  }

  /**
   * Ingests opportunities from all active adapters, executing validation,
   * deduplication, and logging.
   */
  public static async runIngestion(existingOpportunities: Opportunity[]): Promise<{
    mergedOpportunities: Opportunity[];
    logs: IngestionLog[];
    adminReviews: AdminReviewItem[];
  }> {
    const logs: IngestionLog[] = [];
    const adminReviews: AdminReviewItem[] = [];
    let currentPool = [...existingOpportunities];

    for (const adapter of this.adapters.values()) {
      if (adapter.metadata.status !== 'ACTIVE') {
        logs.push({
          id: `log-${adapter.metadata.id}-${Date.now()}`,
          source: adapter.metadata.name,
          status: 'WARNING',
          itemsFetched: 0,
          itemsAdded: 0,
          itemsUpdated: 0,
          itemsDuplicate: 0,
          errors: [`Source is currently marked as ${adapter.metadata.status}`],
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      try {
        const rawItems = await adapter.fetchOpportunities();
        let itemsAdded = 0;
        let itemsUpdated = 0;
        let itemsDuplicate = 0;
        const errors: string[] = [];

        for (const item of rawItems) {
          // 1. Deterministic validation
          const validation = Validator.validate(item);
          if (!validation.isValid) {
            errors.push(`Validation failed for "${item.title}": ${validation.errors.join('; ')}`);
            adminReviews.push({
              id: `review-${item.id}-${Date.now()}`,
              opportunityId: item.id,
              reason: 'UNCERTAIN_ELIGIBILITY',
              notes: `Errors: ${validation.errors.join(', ')}. Warnings: ${validation.warnings.join(', ')}`,
              status: 'PENDING',
              createdAt: new Date().toISOString(),
            });
            continue;
          }

          if (validation.requiresAdminReview) {
            adminReviews.push({
              id: `review-${item.id}-${Date.now()}`,
              opportunityId: item.id,
              reason: 'UNCERTAIN_ELIGIBILITY',
              notes: `Low extraction confidence (${validation.confidenceScore}%). Warnings: ${validation.warnings.join(', ')}`,
              status: 'PENDING',
              createdAt: new Date().toISOString(),
            });
          }

          // 2. Check for duplicate against currentPool
          const duplicate = Deduplicator.findDuplicate(item, currentPool);

          if (duplicate) {
            itemsDuplicate++;
            // Update existing record if candidate is fresher
            const existingIndex = currentPool.findIndex(o => o.id === duplicate.id);
            if (existingIndex !== -1) {
              currentPool[existingIndex] = {
                ...currentPool[existingIndex],
                lastVerifiedAt: new Date().toISOString(),
                // Keep the verified original details, preserve source
              };
              itemsUpdated++;
            }
          } else {
            // New unique opportunity
            currentPool.unshift({
              ...item,
              confidenceScore: validation.confidenceScore,
              lastVerifiedAt: new Date().toISOString(),
            });
            itemsAdded++;
          }
        }

        adapter.metadata.lastSyncAt = new Date().toISOString();

        logs.push({
          id: `log-${adapter.metadata.id}-${Date.now()}`,
          source: adapter.metadata.name,
          status: errors.length > 0 ? 'WARNING' : 'SUCCESS',
          itemsFetched: rawItems.length,
          itemsAdded,
          itemsUpdated,
          itemsDuplicate,
          errors: errors.length > 0 ? errors : undefined,
          timestamp: new Date().toISOString(),
        });

      } catch (err: any) {
        logs.push({
          id: `log-${adapter.metadata.id}-${Date.now()}`,
          source: adapter.metadata.name,
          status: 'ERROR',
          itemsFetched: 0,
          itemsAdded: 0,
          itemsUpdated: 0,
          itemsDuplicate: 0,
          errors: [err?.message || 'Network or parse error during ingestion.'],
          timestamp: new Date().toISOString(),
        });
      }
    }

    return {
      mergedOpportunities: currentPool,
      logs,
      adminReviews,
    };
  }
}

