const api = window.scout;
if (!api)
  throw new Error(
    'Open AppScout using Electron. The desktop data bridge is not available in a browser.',
  );
export const desktop = api;
