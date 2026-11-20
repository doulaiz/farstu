export const roofMaterials = {
  tiles: {
    label: 'Benders concrete tiles',
    minimumPitch: 14
  },
  standingSeam: {
    label: 'Standing-seam metal',
    minimumPitch: 6
  }
};

export const tileSystems = {
  250: { label: 'Benders Exklusiv', width: 280, length: 420, waves: 1 },
  300: { label: 'Benders Palema', width: 330, length: 420, waves: 2 }
};

export function standingFlashing(model) {
   const { roofWidth, doorSideOverhang, rear, rafterDepth, slope, roofMaterial, tileRise, flashingHeight } = model;
   const coverRise = roofMaterial === 'tiles' ? tileRise : 8;
   const bottom = rear + rafterDepth * Math.hypot(1,slope) + coverRise + 2;
   return { left:-doorSideOverhang, right:roofWidth-doorSideOverhang, bottom, top:bottom+flashingHeight, coverRise };
}

export function tileGaugeLimit(pitch) {
  return pitch < 18 ? 320 : pitch < 22 ? 340 : 375;
}

export function roofWidthRange(width, doorSideOverhang, step, maxOverhang) {
  return {
    min: Math.ceil((width+doorSideOverhang)/step)*step,
    max: Math.floor((width+doorSideOverhang+maxOverhang)/step)*step
  };
}

export function roofPitchGuidance(material, pitch) {
  const system = roofMaterials[material];
  if (!system) return { valid: false, message: 'Choose a recognized roof covering.' };
  if (pitch < system.minimumPitch) {
    const message = material === 'tiles'
      ? 'Roof tiles need at least 14°. Choose standing-seam metal or increase the pitch.'
      : 'Standing-seam metal needs at least 6°. Increase the pitch.';
    return { valid: false, message };
  }
  if (material === 'tiles' && pitch < 22) {
    return {
      valid: true,
      message: '14°–22° tile roofs need a high-grade, fully sealed underlayment with taped or welded seams.'
    };
  }
  if (material === 'tiles') {
    return {
      valid: true,
      message: 'Use a continuous roof underlay beneath the tiles; keep the cavity ventilated and drain the underlay at the eaves.'
    };
  }
  if (material === 'standingSeam' && pitch < 14) {
    return {
      valid: true,
      message: 'Below 14°, specify double-seamed standing-seam metal over a continuous deck and sealed underlayment.'
    };
  }
  return {
    valid: true,
    message: 'Use a continuous waterproof underlayment on a solid deck beneath the metal covering.'
  };
}

export function buildRoofSchedule(model) {
  const { roofWidth: widthWithOverhang, length, frontOverhang, slope, pitch, roofMaterial } = model;
  const slopedRun = (length + frontOverhang) * Math.hypot(1, slope);
  const area = widthWithOverhang * slopedRun / 1e6;
  const edgeLength = widthWithOverhang / 1000;
  const vergeLength = 2 * slopedRun / 1000;
  const underlayment = roofMaterial === 'tiles' && pitch < 22
    ? 'High-grade sealed underlayment with taped or welded seams'
    : 'Continuous roof underlayment over solid sheathing';

  return [
    { id: `covering-${roofMaterial}`, role: `${roofMaterials[roofMaterial].label} covering`, quantity: area * 1.1, unit: 'm²', basis: 'Roof area plus 10\u00a0% laps / cuts' },
    { id: 'roof-deck', role: 'Solid roof deck / sheathing', quantity: area * 1.05, unit: 'm²', basis: 'Net roof area plus 5\u00a0% cuts' },
    { id: `underlayment-${roofMaterial}-${pitch < 22 ? 'sealed' : 'standard'}`, role: underlayment, quantity: area * 1.1, unit: 'm²', basis: 'Continuous secondary water barrier' },
    { id: 'roof-fasteners', role: 'Roofing fasteners, closures & seals', quantity: 1, unit: 'allowance', basis: 'System-specific; verify with supplier' },
    { id: 'eave-fascia', role: 'Eave fascia board', quantity: edgeLength, unit: 'm', basis: 'Across the front eave' },
    { id: 'eave-soffit', role: 'Vented eaves soffit / rafter-tail protection', quantity: widthWithOverhang * frontOverhang / 1e6, unit: 'm²', basis: 'Front overhang area; coordinate ventilation with the roof system' },
    { id: 'bargeboards-145', role: 'Bargeboards, 22 × 145 mm', quantity: vergeLength, unit: 'm', basis: 'Both sloping roof edges' },
    { id: 'bargeboards-120', role: 'Bargeboards, 22 × 120 mm', quantity: vergeLength, unit: 'm', basis: 'Second board on both roof edges' },
    { id: 'verge-flashing', role: 'Metal verge flashing', quantity: vergeLength, unit: 'm', basis: 'Both sloping roof edges' },
    { id: 'eave-flashing', role: 'Metal eave drip flashing', quantity: edgeLength, unit: 'm', basis: 'Directs water into the gutter' },
    { id: 'wall-abutment', role: 'Standing flashing (ståndskiva) at house wall', quantity: edgeLength, unit: 'm', basis: 'Sealed connection at the high roof edge' },
    { id: 'gutter', role: 'Half-round gutter', quantity: edgeLength, unit: 'm', basis: 'Front eave' },
    { id: 'downpipe', role: 'Downpipe and outlet', quantity: 1, unit: 'set', basis: 'One outlet at the right-hand end' },
    { id: 'fascia-fasteners', role: 'Corrosion-resistant trim fixings', quantity: 1, unit: 'allowance', basis: 'For fascia, bargeboards and flashings' }
  ];
}
