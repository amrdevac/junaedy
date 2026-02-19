import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClassName?: string;
  cancelButtonClassName?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  autoFocusConfirm?: boolean;
  variant?: "default" | "overlay";
}

const ConfirmModal: React.FC<ConfirmModalProps> = (props) => {
  const isOpen = props.isOpen;
  const title = props.title || "Confirm";
  const message = props.message || "Are you sure?";
  const confirmText = props.confirmText || "Confirm";
  const cancelText = props.cancelText || "Cancel";
  const confirmButtonClassName = props.confirmButtonClassName;
  const cancelButtonClassName = props.cancelButtonClassName;
  const onConfirm = props.onConfirm;
  const onCancel = props.onCancel;
  const autoFocusConfirm = props.autoFocusConfirm || false;
  const variant = props.variant || "default";
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmClick = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    if (loading) return;
    await handleConfirm();
    handleClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  const handleClose = () => {
    if (!loading) {
      onCancel();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent
        className={cn(
          "w-full max-w-md rounded-[28px] border-2 border-base-200 bg-base-100 p-6 text-center shadow-2xl",
          variant === "overlay" ? "bg-base-100" : null
        )}
      >
        <AlertDialogHeader className="text-center">
          <AlertDialogMedia className="bg-error/10 text-error mb-3 rounded-full">
            <AlertTriangle className="size-8" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-2xl font-semibold text-primary">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-base-content/70">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <AlertDialogCancel
            className={cn(
              "h-11 w-full rounded-xl border-base-200 text-base-content/70 hover:bg-base-200 sm:w-[200px]",
              cancelButtonClassName
            )}
            disabled={loading}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmClick}
            autoFocus={autoFocusConfirm}
            className={cn(
              "h-11 w-full rounded-xl bg-error text-white shadow-sm hover:bg-error/90 sm:w-[200px]",
              confirmButtonClassName
            )}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : null}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmModal;
