const STORAGE_KEY = 'farstu-designer-settings-v1';

export function loadSettings() {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized === null) return { value: null, error: '' };
    const value = JSON.parse(serialized);
    if (!value || value.version !== 1 || typeof value.fields !== 'object' ||
      value.fields === null || Array.isArray(value.fields)) {
      return { value: null, error: 'Saved settings are not recognized; defaults were loaded.' };
    }
    return { value, error: '' };
  } catch (error) {
    console.error('Unable to load saved designer settings.', error);
    return { value: null, error: 'Saved settings could not be read; defaults were loaded.' };
  }
}

export function saveSettings(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    return '';
  } catch (error) {
    console.error('Unable to save designer settings.', error);
    return 'Settings could not be saved in this browser.';
  }
}

export function downloadSettings(value) {
  let url;
  let link;
  try {
    const file = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
    url = URL.createObjectURL(file);
    link = document.createElement('a');
    link.href = url;
    link.download = 'farstu-designer-settings.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return 'Settings exported as farstu-designer-settings.json.';
  } catch (error) {
    if (link?.isConnected) link.remove();
    if (url) URL.revokeObjectURL(url);
    console.error('Unable to export designer settings.', error);
    return 'Settings could not be exported in this browser.';
  }
}
