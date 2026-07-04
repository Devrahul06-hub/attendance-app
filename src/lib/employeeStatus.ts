export const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  training: 'Training in process',
  backout: 'Back-out',
  resigned: 'Resigned',
  terminated: 'Terminated',
  absconded: 'Absconded',
  contract_ended: 'Contract Ended',
  relieved: 'Relieved',
};

export const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  training: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  backout: 'bg-red-50 text-red-600 border-red-200',
  resigned: 'bg-gray-50 text-gray-600 border-gray-200',
  terminated: 'bg-orange-50 text-orange-600 border-orange-200',
  absconded: 'bg-red-50 text-red-700 border-red-300',
  contract_ended: 'bg-gray-50 text-gray-600 border-gray-200',
  relieved: 'bg-blue-50 text-blue-600 border-blue-200',
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? 'bg-gray-50 text-gray-600 border-gray-200';
}
