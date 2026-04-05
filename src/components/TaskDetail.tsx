"use client";

import { type SiteTask } from "@/lib/supabase";
import {
  formatCurrency,
  formatDate,
  formatTime,
  getCategoryLabel,
  getCategoryColor,
  getStatusLabel,
  getPriorityIndicator,
} from "@/lib/format";

type Props = {
  task: SiteTask;
  onClose: () => void;
};

export default function TaskDetail({ task, onClose }: Props) {
  const priorityIcon = getPriorityIndicator(task.priority);
  const isExpense = task.category === "expense";

  return (
    <div className="fixed inset-0 z-50 bg-background" data-testid="task-detail">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={onClose}
          className="p-1 -ml-1 text-muted hover:text-foreground"
          aria-label="Cerrar"
          data-testid="close-detail"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span
          className={`px-2.5 py-1 text-xs font-medium rounded-full ${getCategoryColor(task.category)}`}
        >
          {getCategoryLabel(task.category)}
        </span>
        <span className="text-xs text-muted ml-auto">
          {getStatusLabel(task.status)}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 56px)" }}>
        {/* Title */}
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {priorityIcon && <span className="mr-1">{priorityIcon}</span>}
            {task.title}
          </h1>
          <p className="text-xs text-muted mt-1">
            {formatDate(task.created_at)} a las {formatTime(task.created_at)}
          </p>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-foreground/80">{task.description}</p>
        )}

        {/* Expense details */}
        {isExpense && task.expense_amount && (
          <div className="bg-green-50 rounded-xl p-4 space-y-3" data-testid="expense-detail">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Total</span>
              <span className="text-xl font-bold text-foreground">
                {formatCurrency(task.expense_amount)}
              </span>
            </div>

            {task.expense_vendor && (
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted">Proveedor</span>
                <span className="text-sm font-medium">{task.expense_vendor}</span>
              </div>
            )}

            {/* Itemized breakdown */}
            {task.expense_items && task.expense_items.length > 0 && (
              <div className="border-t border-green-200 pt-3">
                <p className="text-xs text-muted mb-2 font-medium">Desglose</p>
                <div className="space-y-1.5">
                  {task.expense_items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm" data-testid="expense-line-item">
                      <span>
                        {item.item}{" "}
                        <span className="text-muted">
                          x{item.quantity} @ {formatCurrency(item.unit_price)}
                        </span>
                      </span>
                      <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Photos */}
        {task.photos && task.photos.length > 0 && (
          <div data-testid="task-photos">
            <p className="text-xs text-muted mb-2 font-medium">Fotos</p>
            <div className="grid grid-cols-2 gap-2">
              {task.photos.map((url, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Receipt photo */}
        {task.receipt_url && (
          <div data-testid="receipt-photo">
            <p className="text-xs text-muted mb-2 font-medium">Recibo</p>
            <div className="rounded-lg overflow-hidden bg-gray-100">
              <img src={task.receipt_url} alt="Recibo" className="w-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
