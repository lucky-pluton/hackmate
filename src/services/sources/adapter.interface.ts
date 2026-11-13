import type { Opportunity } from '../../types';

export type AdapterStatus = 'ACTIVE' | 'PAUSED' | 'PENDING_INTEGRATION';

export interface SourceAdapterMetadata {
  id: string;
  name: string;
  baseUrl: string;
  description: string;
  status: AdapterStatus;
  supportsAutomatedSync: boolean;
  rateLimitPerMinute: number;
  lastSyncAt?: string;
}

export interface OpportunitySourceAdapter {
  metadata: SourceAdapterMetadata;
  fetchOpportunities(): Promise<Opportunity[]>;
  parseRawData?(rawData: any): Opportunity[];
}
