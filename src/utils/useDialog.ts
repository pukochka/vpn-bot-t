import { Dialog } from 'quasar';

export function useDialog(
  message?: string,
  cancel?: boolean,
  title?: string | number,
  className?: string,
) {
  const cancelButton = cancel
    ? {
        unelevated: true,
        noCaps: true,
        label: 'Отмена',
        color: 'red',
        class: 'rounded',
      }
    : false;

  return Dialog.create({
    title: (title || '').toString() || 'Уведомление',
    message: message || '',
    class: 'rounded no-shadow ' + (className || ''),
    html: true,
    ok: {
      unelevated: true,
      noCaps: true,
      class: 'rounded',
      color: 'primary',
    },
    cancel: cancelButton,
  });
}
