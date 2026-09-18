import { ReleaseStatus, RELEASE_STATUS_LABELS, RELEASE_STATUS_COLORS } from '../../types';

interface Props {
  status: ReleaseStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const colors = RELEASE_STATUS_COLORS[status];
  const label = RELEASE_STATUS_LABELS[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r border font-medium ${colors} ${
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    }`}>
      {label}
    </span>
  );
}
