export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    spam: 'Spam',
    harassment: 'Harassment',
    hate_speech: 'Hate Speech',
    violence: 'Violence',
    nudity: 'Nudity',
    false_information: 'False Information',
    scam: 'Scam',
    intellectual_property: 'IP Violation',
    self_harm: 'Self Harm',
    other: 'Other',
  };
  return labels[reason] || reason;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'bg-amber-500/20 text-amber-400';
    case 'reviewing': return 'bg-blue-500/20 text-blue-400';
    case 'resolved': return 'bg-green-500/20 text-green-400';
    case 'dismissed': return 'bg-gray-500/20 text-gray-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
}

export function truncate(str: string, length: number): string {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}
