import { buildBom } from './bom.js';
import { catalogueDate } from './derome.js';
import { buildRoofSchedule } from './roofing.js';
import { createNumberFormat } from './number-format.js';

const storageKey = 'farstu-derome-quotes-v1';
const roofStorageKey = 'farstu-roof-quotes-v1';
const maxQuote = 10000000;
const validQuote = amount => amount === null || (Number.isFinite(amount) && amount >= 0 && amount <= maxQuote);
const number = createNumberFormat({ maximumFractionDigits: 3 });
const money = createNumberFormat({ minimumFractionDigits: 2, maximumFractionDigits: 2 });
const invalidQuoteMessage = `Enter a quote from 0 to ${number.format(maxQuote)} SEK or leave the field blank. The previous quote is unchanged.`;
const crossSection = item => `${item.width} × ${item.depth}`;

function cell(row, value, className) {
  const td = row.insertCell();
  td.textContent = value;
  if (className) td.className = className;
  return td;
}

function readQuotes(status) {
  try {
    const text = localStorage.getItem(storageKey);
    if (text === null) return new Map();
    const quotes = JSON.parse(text);
    if (!Array.isArray(quotes) || !quotes.every(entry => Array.isArray(entry) && entry.length === 2 &&
      typeof entry[0] === 'string' && ['piece','metre'].includes(entry[1]?.unit) &&
      validQuote(entry[1].amount))) {
      throw new Error('Unrecognized quote format.');
    }
    return new Map(quotes);
  } catch (error) {
    console.warn('Derome quotes could not be loaded.', error);
    status.textContent = 'Saved quotes could not be loaded. You can enter them again.';
    return new Map();
  }
}

function readRoofQuotes(status) {
  try {
    const text = localStorage.getItem(roofStorageKey);
    if (text === null) return new Map();
    const quotes = JSON.parse(text);
    if (!Array.isArray(quotes) || !quotes.every(entry => Array.isArray(entry) && entry.length === 2 &&
      typeof entry[0] === 'string' &&
      validQuote(entry[1]))) {
      throw new Error('Unrecognized roof quote format.');
    }
    return new Map(quotes);
  } catch (error) {
    console.warn('Roof quotes could not be loaded.', error);
    status.textContent = 'Saved roof quotes could not be loaded. You can enter them again.';
    return new Map();
  }
}

export function createBomView($) {
  const bom = $('bom-view');
  const status = $('bom-status'), priceStatus = $('bom-price-status'), total = $('bom-total');
  const body = $('bom-rows');
  const time = $('bom-catalogue-date');
  const roofBody = $('roof-rows');
  const roofTotal = $('roof-total');
  const roofPriceStatus = $('roof-price-status');
  time.dateTime = time.textContent = catalogueDate;
  const quotes = readQuotes(priceStatus);
  const roofQuotes = readRoofQuotes(roofPriceStatus);
  let quoteError = priceStatus.textContent, roofQuoteError = roofPriceStatus.textContent;
  let latest, rendered, valid;

  function showPriceStatus(status, fields, error) {
    const invalid = fields.some(({input}) => input?.hasAttribute('aria-invalid'));
    status.textContent = [invalid ? invalidQuoteMessage : '',error].filter(Boolean).join(' ');
  }

  function render() {
    if (!latest) {
      status.textContent = 'No valid design is available.';
      return;
    }
    status.textContent = valid ? '' : 'Showing the last valid design. Fix the highlighted parameters in Designer to update this estimate.';
    if (latest === rendered) return;
    const rows = buildBom(latest);
    const roofRows = buildRoofSchedule(latest);
    const fragment = document.createDocumentFragment();
    const roofFragment = document.createDocumentFragment();
    const priceFields = [];
    const roofPriceFields = [];

    function refreshTotals(changedSku) {
      let subtotal = 0, priced = 0, unpriced = 0, unmatched = 0;
      for (const {row,output,input,unit} of priceFields) {
        if (!row.stock) {
          unmatched += row.cuts.length;
          continue;
        }
        const quote = quotes.get(row.stock.sku);
        const amount = quote?.amount;
        if (row.stock.sku === changedSku || !input.hasAttribute('aria-invalid')) {
          if (input !== document.activeElement) input.value = amount ?? '';
          unit.value = quote?.unit ?? 'piece';
          input.removeAttribute('aria-invalid');
        }
        if (amount == null) {
          output.textContent = 'Quote needed';
          unpriced++;
        } else {
          const factor = quote.unit === 'metre' ? row.stock.length*row.count/1000 : row.count;
          const cost = Math.round(amount*factor*100)/100;
          output.textContent = money.format(cost);
          subtotal += cost;
          priced++;
        }
      }
      const partial = unpriced || unmatched;
      total.textContent = `${partial ? 'Quoted subtotal' : 'Estimated lumber total'}: ${
        priced ? `${money.format(subtotal)} SEK` : 'not yet priced'}${unpriced ? ` · ${unpriced} unpriced rows` : ''}${
        unmatched ? ` · ${unmatched} cuts without a stock match` : ''}`;
      showPriceStatus(priceStatus,priceFields,quoteError);
    }

    function refreshRoofTotals(changedId) {
      let subtotal = 0, priced = 0, unpriced = 0;
      for (const {row,output,input} of roofPriceFields) {
        const amount = roofQuotes.get(row.id);
        if (row.id === changedId || !input.hasAttribute('aria-invalid')) {
          if (input !== document.activeElement) input.value = amount ?? '';
          input.removeAttribute('aria-invalid');
        }
        if (amount == null) {
          output.textContent = 'Quote needed';
          unpriced++;
        } else {
          const cost = Math.round(amount*row.quantity*100)/100;
          output.textContent = money.format(cost);
          subtotal += cost;
          priced++;
        }
      }
      roofTotal.textContent = `${unpriced ? 'Quoted roof subtotal' : 'Estimated roof total'}: ${
        priced ? `${money.format(subtotal)} SEK` : 'not yet priced'}${unpriced ? ` · ${unpriced} unpriced rows` : ''}`;
      showPriceStatus(roofPriceStatus,roofPriceFields,roofQuoteError);
    }

    for (const row of rows) {
      const tr = document.createElement('tr');
      fragment.append(tr);
      const role = document.createElement('th');
      role.scope = 'row';
      role.textContent = row.role;
      tr.append(role);
      cell(tr,crossSection(row),'numeric');
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = `${row.cuts.length} cuts`;
      const counts = new Map();
      for (const length of row.cuts) counts.set(length,(counts.get(length) ?? 0)+1);
      const lengths = document.createElement('div');
      lengths.textContent = [...counts].sort(([a],[b]) => b-a).map(([mm,count]) => `${number.format(count)} × ${number.format(mm)}`).join('; ');
      details.append(summary,lengths);
      cell(tr,'').append(details);
      const article = cell(tr,row.product ? `${row.product.name} ${crossSection(row.product)}` : 'No product');
      if (row.stock) {
        const link = document.createElement('a');
        link.href = row.stock.url;
        link.textContent = row.stock.sku;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        article.append(document.createElement('br'),link);
      }
      const undersize = row.product && (row.product.width < row.width || row.product.depth < row.depth);
      const match = row.stock ? row.substitution ? undersize ? 'Substitute · smaller dimension' : 'Substitute · larger section' : 'Exact section' :
        row.product ? 'No listed length fits' : 'No catalogue match';
      cell(tr,match,!row.stock || row.substitution ? 'bom-flag' : '');
      cell(tr,row.stock ? number.format(row.stock.length) : '—','numeric');
      cell(tr,row.count || '—','numeric');
      cell(tr,row.stock ? number.format(row.count*row.stock.length/1000) : '—','numeric');
      const quoteCell = cell(tr,'—');
      const output = cell(tr,'—','numeric');
      if (!row.stock) {
        priceFields.push({row,output});
        continue;
      }
      quoteCell.textContent = '';
      const controls = document.createElement('div');
      controls.className = 'bom-quote';
      const input = document.createElement('input');
      Object.assign(input,{type:'number',step:'any',min:'0',max:String(maxQuote),inputMode:'decimal'});
      input.setAttribute('aria-label',`Quoted SEK for ${row.role}, ${row.stock.sku}`);
      const unit = document.createElement('select');
      unit.setAttribute('aria-label',`Quote unit for ${row.role}, ${row.stock.sku}`);
      unit.add(new Option('per piece','piece'));
      unit.add(new Option('per metre','metre'));
      controls.append(input,unit);
      quoteCell.append(controls);
      priceFields.push({row,output,input,unit});
      function saveQuote() {
        if (!input.validity.valid) {
          input.setAttribute('aria-invalid','true');
          showPriceStatus(priceStatus,priceFields,quoteError);
          return;
        }
        input.removeAttribute('aria-invalid');
        quoteError = '';
        quotes.set(row.stock.sku,{amount:input.value === '' ? null : input.valueAsNumber, unit:unit.value});
        try {
          localStorage.setItem(storageKey,JSON.stringify([...quotes]));
        } catch (error) {
          console.warn('Derome quotes could not be saved.', error);
          quoteError = 'Your quote was applied but could not be saved in this browser.';
        }
        refreshTotals(row.stock.sku);
      }
      input.addEventListener('change',saveQuote);
      unit.addEventListener('change',saveQuote);
    }
    for (const item of roofRows) {
      const tr = document.createElement('tr');
      roofFragment.append(tr);
      const role = document.createElement('th');
      role.scope = 'row';
      role.textContent = item.role;
      tr.append(role);
      cell(tr,number.format(item.quantity),'numeric');
      cell(tr,item.unit);
      const quoteCell = cell(tr,'');
      const input = document.createElement('input');
      Object.assign(input,{type:'number',step:'any',min:'0',max:String(maxQuote),inputMode:'decimal'});
      input.setAttribute('aria-label',`Quoted SEK per ${item.unit} for ${item.role}`);
      quoteCell.append(input);
      const output = cell(tr,'—','numeric');
      cell(tr,item.basis);
      roofPriceFields.push({row:item,output,input});
      input.addEventListener('change',() => {
        if (!input.validity.valid) {
          input.setAttribute('aria-invalid','true');
          showPriceStatus(roofPriceStatus,roofPriceFields,roofQuoteError);
          return;
        }
        input.removeAttribute('aria-invalid');
        roofQuoteError = '';
        roofQuotes.set(item.id,input.value === '' ? null : input.valueAsNumber);
        try {
          localStorage.setItem(roofStorageKey,JSON.stringify([...roofQuotes]));
        } catch (error) {
          console.warn('Roof quotes could not be saved.', error);
          roofQuoteError = 'Your roof quote was applied but could not be saved in this browser.';
        }
        refreshRoofTotals(item.id);
      });
    }
    body.replaceChildren(fragment);
    roofBody.replaceChildren(roofFragment);
    refreshTotals();
    refreshRoofTotals();
    rendered = latest;
  }

  return { render, update(model, isValid) {
    latest = model;
    valid = isValid;
    if (!bom.hidden) render();
  } };
}
