import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function getDaysRemaining(dateString: string): number {
  try {
    const target = new Date(dateString).getTime();
    const now = Date.now();
    const diff = target - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

export function formatDeadlineRelative(dateString: string): { label: string; isUrgent: boolean; isPast: boolean } {
  try {
    const target = new Date(dateString).getTime();
    const now = Date.now();
    const diffMs = target - now;
    
    if (diffMs <= 0) {
      return { label: 'Closed', isUrgent: false, isPast: true };
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 24) {
      return { label: `Closing in ${hours}h`, isUrgent: true, isPast: false };
    }
    if (days <= 3) {
      return { label: `Closing in ${days}d`, isUrgent: true, isPast: false };
    }
    if (days <= 7) {
      return { label: `${days} days left`, isUrgent: false, isPast: false };
    }
    return { label: `${days} days left`, isUrgent: false, isPast: false };
  } catch {
    return { label: 'Date pending', isUrgent: false, isPast: false };
  }
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (amount === 0) return 'Free';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Generate a Google Calendar template URL
 */
export function createGoogleCalendarUrl(
  title: string,
  description: string,
  startDateStr: string,
  endDateStr: string,
  location?: string
): string {
  try {
    const start = new Date(startDateStr).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = new Date(endDateStr).toISOString().replace(/-|:|\.\d\d\d/g, '');
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      details: description,
      dates: `${start}/${end}`,
      location: location || 'Online',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } catch {
    return '#';
  }
}

/**
 * Generate iCalendar (.ics) content for downloading
 */
export function generateIcsContent(
  title: string,
  description: string,
  startDateStr: string,
  endDateStr: string,
  url: string,
  location?: string
): string {
  const sanitize = (text: string) => text.replace(/\n/g, '\\n').replace(/,/g, '\\,');
  const formatDateToICS = (dateStr: string) => {
    return new Date(dateStr).toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const start = formatDateToICS(startDateStr);
  const end = formatDateToICS(endDateStr);
  const now = formatDateToICS(new Date().toISOString());

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HackMate//Hackathon Discovery//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@hackmate.app`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${sanitize(title)}`,
    `DESCRIPTION:${sanitize(description)}\\n\\nLink: ${url}`,
    `URL:${url}`,
    `LOCATION:${sanitize(location || 'Online')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcsFile(filename: string, icsContent: string) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
