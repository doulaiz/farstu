import { initDesigner } from './designer.js';

try {
  initDesigner();
} catch (error) {
  console.error('Farstu Designer failed to start.', error);
  const status = document.getElementById('app-error');
  if (status) {
    status.hidden = false;
    status.textContent = `The designer could not start: ${error instanceof Error ? error.message : String(error)}`;
  }
}
