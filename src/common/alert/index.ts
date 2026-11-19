import Swal, { SweetAlertIcon } from 'sweetalert2';
import i18n from '@/i18n';
import './alert.css';

const tr = (key: string) => String(i18n.t(key));

// Confirmations, errors and success messages of the administration (SweetAlert2), in the
// colours of the application.
const base = Swal.mixin({
  buttonsStyling: false,
  reverseButtons: true,
  customClass: {
    popup: 'cd-swal',
    confirmButton: 'cd-swal-btn cd-swal-btn-primary',
    cancelButton: 'cd-swal-btn cd-swal-btn-ghost',
    denyButton: 'cd-swal-btn cd-swal-btn-danger',
  },
});

const notify = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: { popup: 'cd-swal-toast' },
  didOpen: (popup) => {
    popup.addEventListener('mouseenter', Swal.stopTimer);
    popup.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

const show = (icon: SweetAlertIcon) => (title: string, text?: string) => notify.fire({ icon, title, text });

export const toast = {
  success: show('success'),
  error: show('error'),
  info: show('info'),
  warning: show('warning'),
};

type ConfirmOptions = {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  icon?: SweetAlertIcon;
  // Runs while the dialog shows a loader; an error keeps the dialog open with its message
  onConfirm?: () => Promise<unknown>;
};

export const confirm = async ({
  title,
  text,
  confirmText,
  cancelText,
  danger,
  icon = danger ? 'warning' : 'question',
  onConfirm,
}: ConfirmOptions): Promise<boolean> => {
  // Opened once the click that asked for it is over, so that a menu closing under the
  // pointer does not count as a click outside the dialog
  await new Promise((resolve) => setTimeout(resolve, 0));
  const result = await base.fire({
    icon,
    title,
    text,
    showCancelButton: true,
    focusCancel: !!danger,
    confirmButtonText: confirmText || tr('common.confirm'),
    cancelButtonText: cancelText || tr('common.cancel'),
    customClass: {
      popup: 'cd-swal',
      confirmButton: `cd-swal-btn ${danger ? 'cd-swal-btn-danger' : 'cd-swal-btn-primary'}`,
      cancelButton: 'cd-swal-btn cd-swal-btn-ghost',
    },
    showLoaderOnConfirm: !!onConfirm,
    allowOutsideClick: () => !Swal.isLoading(),
    preConfirm: onConfirm
      ? async () => {
          try {
            await onConfirm();
            return true;
          } catch (error) {
            Swal.showValidationMessage(errorMessage(error));
            return false;
          }
        }
      : undefined,
  });
  return result.isConfirmed;
};

export const alertError = (error: unknown, title = tr('common.error-title')) =>
  base.fire({ icon: 'error', title, text: errorMessage(error), confirmButtonText: tr('common.close') });

export const alertSuccess = (title: string, text?: string) =>
  base.fire({ icon: 'success', title, text, confirmButtonText: tr('common.close') });

// Message sent by the server, or a general one
export const errorMessage = (error: unknown): string => {
  const data = (error as any)?.response?.data;
  if (data?.message && typeof data.message === 'string') return data.message;
  if ((error as any)?.response?.status === 403) return tr('common.forbidden');
  if ((error as any)?.message === 'Network Error') return tr('common.network-error');
  if (error instanceof Error && !(error as any).isAxiosError && error.message) return error.message;
  return tr('common.error-description');
};
