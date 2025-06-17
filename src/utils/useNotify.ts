import { Notify } from 'quasar';

export function useNotify(
  message: string,
  position?: 'top' | 'bottom' | 'left' | 'right',
  timeout?: number,
) {
  return Notify.create({
    html: true,
    message: message,
    position: position || 'top',
    classes: 'rounded no-shadow',
    timeout: timeout || 1500,
  });
}
