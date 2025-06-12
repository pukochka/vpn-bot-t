import { Notify } from 'quasar';

export function useNotify(
  message: string,
  position?: 'top' | 'bottom' | 'left' | 'right',
  timeout?: number,
) {
  return Notify.create({
    html: true,
    position: position || 'top',
    message: message,
    classes: 'rounded no-shadow',
    timeout: timeout || 1500,
  });
}
