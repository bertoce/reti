"use client";

import { useState } from "react";
import { type SiteTask, type TaskCategory, type TaskPriority } from "@/lib/supabase";
import AgentChat from "./AgentChat";
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
  projectId: string;
  onClose: () => void;
  onUpdate?: (taskId: string, updates: Partial<SiteTask>) => void;
  onDelete?: (taskId: string) => void;
};

export default function TaskDetail({ task, projectId, onClose, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [category, setCategory] = useState<TaskCategory>(task.category);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);

  const priorityIcon = getPriorityIndicator(task.priority);
  const isExpense = task.category === "expense";

  const handleSave = () => {
    if (!title.trim()) return;
    onUpdate?.(task.id, {
      title: title.trim(),
      description: description.trim() || null,
      category,
      priority,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setTitle(task.title);
    setDescription(task.description || "");
    setCategory(task.category);
    setPriority(task.priority);
    setEditing(false);
  };

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
          className={`px-2.5 py-1 text-xs font-medium rounded ${getCategoryColor(task.category)}`}
        >
          {getCategoryLabel(task.category)}
        </span>
        <span className="text-xs text-muted ml-auto">
          {getStatusLabel(task.status)}
        </span>

        {/* Edit toggle */}
        {onUpdate && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="p-1 text-muted hover:text-accent"
            data-testid="edit-toggle"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 text-muted hover:text-danger"
            data-testid="delete-task"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 56px)" }}>
        {editing ? (
          /* Edit mode */
          <div className="space-y-3" data-testid="edit-mode">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-semibold text-foreground border-b border-border py-1 bg-transparent focus:border-accent focus:outline-none"
              data-testid="edit-title"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción (opcional)"
              className="w-full text-sm text-foreground border border-border rounded p-2 bg-transparent focus:border-accent focus:outline-none resize-none"
              rows={3}
              data-testid="edit-description"
            />

            {/* Category select */}
            <div className="flex flex-wrap gap-2">
              {(["progress", "issue", "material", "inspection", "expense", "general"] as TaskCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2 py-1 text-xs rounded border ${
                    category === cat ? "bg-accent text-white border-accent" : "border-border text-muted"
                  }`}
                >
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>

            {/* Priority select */}
            <div className="flex flex-wrap gap-2">
              {(["low", "normal", "high", "urgent"] as TaskPriority[]).map((pri) => (
                <button
                  key={pri}
                  type="button"
                  onClick={() => setPriority(pri)}
                  className={`px-2 py-1 text-xs rounded border ${
                    priority === pri ? "bg-accent text-white border-accent" : "border-border text-muted"
                  }`}
                >
                  {pri}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={handleSave} className="btn-primary text-sm py-2 px-4" data-testid="save-edit">
                Guardar
              </button>
              <button onClick={handleCancel} className="btn-ghost text-sm" data-testid="cancel-edit">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          /* View mode */
          <>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {priorityIcon && <span className="mr-1">{priorityIcon}</span>}
                {task.title}
              </h1>
              <p className="text-xs text-muted mt-1">
                {formatDate(task.created_at)} a las {formatTime(task.created_at)}
              </p>
            </div>

            {task.description && (
              <p className="text-sm text-foreground/80">{task.description}</p>
            )}
          </>
        )}

        {/* Expense details */}
        {isExpense && task.expense_amount && (
          <div className="bg-success-light rounded-lg p-4 space-y-3" data-testid="expense-detail">
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

            {task.expense_items && task.expense_items.length > 0 && (
              <div className="border-t border-border pt-3">
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
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-[#F0F0EE]">
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
            <div className="rounded-lg overflow-hidden bg-[#F0F0EE]">
              <img src={task.receipt_url} alt="Recibo" className="w-full" />
            </div>
          </div>
        )}

        {/* Agent chat */}
        <AgentChat projectId={projectId} task={task} />
      </div>
    </div>
  );
}
