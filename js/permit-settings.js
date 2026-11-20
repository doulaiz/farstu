export const permitFields = [
  { key: 'address', label: 'Site address', initial: '', maxLength: 65 },
  { key: 'propertyId', label: 'Property ID / Fastighetsbeteckning', initial: '', maxLength: 65 },
  { key: 'drawnBy', label: 'Drawn by', initial: '', maxLength: 32 },
  { key: 'frontDirection', label: 'Porch front faces', initial: 'south', options: ['south', 'west', 'north', 'east'] },
  ...['North', 'South', 'East', 'West'].map(label => ({
    key: label.toLowerCase(), label: `${label} boundary distance (mm, from slab edge)`, initial: 4500, min: 0, max: 100000
  })),
  { key: 'houseDepth', label: 'Existing house plan depth (mm)', initial: 8000, min: 1000, max: 30000 },
  { key: 'ridge', label: 'Existing house ridge height (mm above existing grade)', initial: 6500, min: 0, max: 20000 },
  { key: 'existingGrade', label: 'Existing ground offset (mm relative to FG)', initial: -140, min: -4000, max: 1000 },
  { key: 'newGrade', label: 'New ground offset (mm relative to FG)', initial: -140, min: -4000, max: 1000 },
  { key: 'frost', label: 'Frost depth (mm below new grade)', initial: 1100, min: 0, max: 4000 },
  { key: 'snow', label: 'Ground snow load (kN/m²; default Göteborg)', initial: 1.5, min: 0, max: 15, step: 0.1 }
];

export function permitSettings(values = {}, slabThickness = 140) {
  const defaults = [];
  const settings = {};
  for (const { key, initial, min, max, maxLength, options } of permitFields) {
    const value = values[key];
    if (options) {
      settings[key] = options.includes(value) ? value : initial;
      if (!options.includes(value)) defaults.push(key);
    } else if (typeof initial === 'string') {
      settings[key] = typeof value === 'string' ? value.trim().slice(0, maxLength) : initial;
    } else if (typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max) {
      settings[key] = value;
    } else {
      settings[key] = key === 'existingGrade' || key === 'newGrade' ? -slabThickness : initial;
      defaults.push(key);
    }
  }
  return { ...settings, defaults };
}
