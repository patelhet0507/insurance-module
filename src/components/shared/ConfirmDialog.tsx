import { useState } from "react";
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { notifyError, notifySuccess } from "@/components/ui/toast";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  destructive,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          Cancel
        </Button>
        <Button variant={destructive ? "destructive" : "default"} onClick={handleConfirm} disabled={loading}>
          {loading ? "Working…" : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}

export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    destructive?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const confirm = (opts: Omit<NonNullable<typeof state>, "open">) =>
    new Promise<boolean>((resolve) => {
      setState({
        ...opts,
        open: true,
        onConfirm: async () => {
          try {
            await opts.onConfirm();
            resolve(true);
          } catch (err) {
            notifyError(err instanceof Error ? err.message : "Something went wrong");
            resolve(false);
          }
        },
      });
    });

  const render = state && (
    <ConfirmDialog
      open={state.open}
      onOpenChange={(open) => {
        setState((s) => (s ? { ...s, open } : s));
        if (!open) setState(null);
      }}
      title={state.title}
      description={state.description}
      confirmLabel={state.confirmLabel}
      destructive={state.destructive}
      onConfirm={state.onConfirm}
    />
  );

  return { confirm, render };
}
