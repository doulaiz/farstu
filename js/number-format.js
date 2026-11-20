export function createNumberFormat(options) {
  const formatter = new Intl.NumberFormat('en', options);
  return {
    format(value) {
      return formatter.formatToParts(value).map(part => {
        if (part.type === 'group') return '\u202f';
        if (part.type === 'percentSign') return `\u00a0${part.value}`;
        return part.value;
      }).join('');
    }
  };
}
