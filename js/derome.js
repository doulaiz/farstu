export const catalogueDate = '2026-11-18';
const productRoot = 'https://www.derome.se/handla-online/produkter/traeprodukter/';

function product(family, path, name, width, depth, prefix, variants) {
  return { family, name, width, depth, stock: variants.map(code => {
    const sku = prefix + code;
    return { sku, length: (Number(code)-100)*100, url: `${productRoot}${path}/${sku}` };
  }) };
}

const structural = (width, depth, prefix, variants) => product('frame',
  'plank-reglar/konstruktionsvirke-c24', 'Spruce C24M', width, depth, prefix, variants);
const panel = (width, prefix, variants) => product('panel',
  'ytterpanel/ytterpanelbraeda', 'Spruce exterior board', width, 22, prefix, variants);
const batten = (width, prefix, variants) => product('batten',
  'braedor/laekt', 'Spruce batten VI+', width, 25, prefix, variants);

export const deromeCatalogue = [
  structural(45,70,'104507024000',[130,136,142,148,151,154]),
  structural(45,95,'104509524000',[130,136,139,142,145,148,151,154]),
  structural(45,120,'104512024000',[130,136,139,142,145,148,151,154]),
  structural(45,145,'104514524000',[130,136,139,142,145,148,151,154]),
  structural(45,170,'104517024000',[130,136,139,142,145,148,151,154]),
  structural(45,195,'104519524000',[130,136,139,142,145,148,151,154]),
  structural(45,220,'104522024000',[130,136,139,142,145,148,151,154]),
  structural(45,245,'104524524000',[130,136,142,148,151,154]),
  structural(70,70,'107007024000',[136,142,148]),
  panel(70,'102207004000',[130,136,142,148,154]),
  panel(95,'102209504000',[130,133,136,139,142,145,148,151,154]),
  panel(120,'102212004000',[130,133,136,139,142,145,148,151,154]),
  panel(145,'102214504000',[130,133,136,142,148,151,154]),
  panel(170,'102217004000',[130,136,139,142,145,148,151,154]),
  panel(195,'102219504000',[136,142,148,151,154]),
  // Use the variant table's dimensions where the product title differs.
  batten(36,'102503607000',[136,142,145,148]),
  batten(48,'102504807000',[136,142,148]),
  product('service','braedor/glespanel','Spruce spacing board VI+',70,28,'102807007000',
    [130,136,142,145,148,151,154])
];
