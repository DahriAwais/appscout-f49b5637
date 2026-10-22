import type { DesktopAPI } from '../electron/contracts';
declare global {
  interface Window {
    scout?: DesktopAPI;
  }
}
