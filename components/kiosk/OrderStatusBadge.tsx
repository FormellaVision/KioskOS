import { OrderStatus } from '@/lib/kiosk-types';

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  new: { label: 'NEU', className: 'bg-red-50 text-red-600 border border-red-200' },
  confirmed: { label: 'BESTÄTIGT', className: 'bg-blue-50 text-blue-600 border border-blue-200' },
  ready: { label: 'BEREIT', className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  picked_up: { label: 'ABGEHOLT', className: 'bg-gray-100 text-gray-600 border border-border' },
  cancelled: { label: 'STORNIERT', className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  large?: boolean;
}

export default function OrderStatusBadge({ status, large = false }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-md font-bold tracking-wide ${config.className} ${
        large ? 'px-3 py-1.5 text-xs' : 'px-2 py-0.5 text-[10px]'
      }`}
    >
      {config.label}
    </span>
  );
}
