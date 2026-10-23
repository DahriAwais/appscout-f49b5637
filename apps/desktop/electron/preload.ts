import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopAPI, Result, FeedEvent } from './contracts';
async function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  const result = (await ipcRenderer.invoke(channel, ...args)) as Result<T>;
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
const api: DesktopAPI = {
  feed: (category, token) => invoke('scout:feed', category, token),
  onFeed: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, event: FeedEvent) => callback(event);
    ipcRenderer.on('scout:feed-event', handler);
    return () => ipcRenderer.removeListener('scout:feed-event', handler);
  },
  keywords: (term) => invoke('scout:keywords', term),
  search: (term) => invoke('scout:search', term),
  developer: (id) => invoke('scout:developer', id),
  detail: (id) => invoke('scout:detail', id),
  reviews: (id) => invoke('scout:reviews', id),
  similar: (id) => invoke('scout:similar', id),
  history: (id) => invoke('scout:history', id),
  state: () => invoke('scout:state'),
  completeOnboarding: () => invoke('scout:onboarding-complete'),
  showBetaInfo: () => invoke('scout:beta-info'),
  watch: (id, saved) => invoke('scout:watch', id, saved),
  scenario: (id, value) => invoke('scout:scenario', id, value),
  settings: (value) => invoke('scout:settings', value),
  exportCSV: (ids) => invoke('scout:csv', ids),
  exportPDF: () => invoke('scout:pdf'),
  window: (action) => invoke('scout:window', action),
  openStore: (id) => invoke('scout:store', id),
  checkUpdate: () => invoke('scout:update'),
  installUpdate: () => invoke('scout:install-update'),
  onUpdate: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, message: string) => callback(message);
    ipcRenderer.on('scout:update-event', handler);
    return () => ipcRenderer.removeListener('scout:update-event', handler);
  },
};
contextBridge.exposeInMainWorld('scout', api);
