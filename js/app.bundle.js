(() => {
  // js/windows.js
  var muntinPatterns = {
    none: { label: "No muntins", columns: 1, rows: 1 },
    vertical: { label: "Two lights", columns: 2, rows: 1 },
    cross: { label: "Four lights", columns: 2, rows: 2 },
    six: { label: "Six lights", columns: 2, rows: 3 }
  };
  var sillProjection = 35;
  var sillExtension = (width) => Math.min(25, width * 0.1);
  function windowProfile(op, wallThickness) {
    const size = Math.min(op.end - op.start, op.top - op.bottom);
    const gap = Math.min(12, size * 0.08);
    const setBack = Math.min(26, wallThickness * 0.25, size * 0.2);
    const jamb = Math.min(70, wallThickness - setBack);
    const rim = Math.min(58, size * 0.16);
    const glassDepth = setBack + Math.min(4, wallThickness * 0.05);
    return { gap, setBack, jamb, rim, glassDepth };
  }
  function drawWindow(face, section2, op, wall, options) {
    const { key, pattern, thickness, trim, trimColour, flashing = true } = options;
    const { gap, setBack, rim, glassDepth } = windowProfile(op, thickness);
    const { start: a, end: b, bottom: c, top: d } = op;
    const l = a + gap, r = b - gap, s = c + gap, h = d - gap;
    const x = l + rim, y = r - rim, bottom = s + rim, top = h - rim;
    const draw = (points, fill, part) => face(points.map((point) => section2(...point)), fill, {
      class: `window-detail window-${part}`,
      "data-window": key,
      "data-window-part": part
    });
    const rect = (u, v, z, t, depth, fill, part) => {
      if (v > u && t > z) draw([[u, depth, z], [v, depth, z], [v, depth, t], [u, depth, t]], fill, part);
    };
    draw([[a, 0, c], [a, 0, d], [l, setBack, h], [l, setBack, s]], "#767a71", "reveal");
    draw([[b, 0, c], [r, setBack, s], [r, setBack, h], [b, 0, d]], "#969b8d", "reveal");
    draw([[a, 0, d], [b, 0, d], [r, setBack, h], [l, setBack, h]], "#59625c", "reveal");
    draw([[a, 0, c], [l, setBack, s], [r, setBack, s], [b, 0, c]], "#c5c6b8", "reveal");
    rect(l, x, s, h, setBack, "#ecebe0", "frame");
    rect(y, r, s, h, setBack, "#d7dcd2", "frame");
    rect(x, y, s, bottom, setBack, "#d8ddd3", "frame");
    rect(x, y, top, h, setBack, "#f8f6ea", "frame");
    rect(x, y, bottom, top, glassDepth, "#729ca7", "glass");
    draw([
      [x, glassDepth, top],
      [y, glassDepth, top],
      [y, glassDepth, top - (top - bottom) * 0.22],
      [x, glassDepth, top - (top - bottom) * 0.52]
    ], "#9cc1c6", "reflection");
    const { columns, rows } = muntinPatterns[pattern];
    const half = Math.min(10, rim * 0.23);
    const barDepth = Math.max(setBack, glassDepth - 0.5);
    for (let i = 1; i < columns; i++) {
      const u = x + (y - x) * i / columns;
      rect(u - half, u + half, bottom, top, barDepth, "#eaece1", "muntin");
    }
    for (let i = 1; i < rows; i++) {
      const z = bottom + (top - bottom) * i / rows;
      rect(x, y, z - half, z + half, barDepth, "#eaece1", "muntin");
    }
    function casing(u, v, z, t) {
      u = Math.max(wall.start, u);
      v = Math.min(wall.end, v);
      if (v <= u || t <= z || wall.top(u) <= z) return;
      if (wall.top(v) < z) v = u + (v - u) * (wall.top(u) - z) / (wall.top(u) - wall.top(v));
      const corners = [[u, -22, z], [v, -22, z], [v, -22, Math.min(t, wall.top(v))]];
      if (wall.top(u) > t && wall.top(v) < t) {
        corners.push([u + (v - u) * (wall.top(u) - t) / (wall.top(u) - wall.top(v)), -22, t]);
      }
      corners.push([u, -22, Math.min(t, wall.top(u))]);
      draw(corners, trimColour, "casing");
    }
    if (trim > 0) {
      casing(a - trim, a, c, d);
      casing(b, b + trim, c, d);
      casing(a - trim, b + trim, d, d + trim);
    }
    if (!flashing) return;
    const extension = sillExtension(b - a);
    const sillA = Math.max(wall.start, a - extension), sillB = Math.min(wall.end, b + extension);
    const fall = Math.min(16, (d - c) * 0.1);
    const lip = Math.min(9, fall);
    const drip = c - fall;
    draw([[sillA, setBack, c], [sillB, setBack, c], [sillB, -sillProjection, drip], [sillA, -sillProjection, drip]], "#aebec1", "sill");
    rect(sillA, sillB, drip - lip, drip, -sillProjection, "#687d83", "drip");
    for (const u of [sillA, sillB]) {
      draw([[u, setBack, c], [u, -sillProjection, drip], [u, -sillProjection, drip + lip], [u, setBack, c + lip]], "#83989b", "end-dam");
    }
    const headA = Math.max(wall.start, a - trim - 8), headB = Math.min(wall.end, b + trim + 8);
    const head = Math.min(d + trim + 12, wall.top(headB));
    if (headB > headA && head >= d + trim + 10) {
      draw([[headA, 0, head], [headB, 0, head], [headB, -sillProjection, head - 3], [headA, -sillProjection, head - 3]], "#bccacc", "head");
      rect(headA, headB, head - 10, head - 3, -sillProjection, "#76898e", "head");
    }
  }

  // js/derome.js
  var catalogueDate = "2026-11-18";
  var productRoot = "https://www.derome.se/handla-online/produkter/traeprodukter/";
  function product(family, path, name, width, depth, prefix, variants) {
    return { family, name, width, depth, stock: variants.map((code) => {
      const sku = prefix + code;
      return { sku, length: (Number(code) - 100) * 100, url: `${productRoot}${path}/${sku}` };
    }) };
  }
  var structural = (width, depth, prefix, variants) => product(
    "frame",
    "plank-reglar/konstruktionsvirke-c24",
    "Spruce C24M",
    width,
    depth,
    prefix,
    variants
  );
  var panel = (width, prefix, variants) => product(
    "panel",
    "ytterpanel/ytterpanelbraeda",
    "Spruce exterior board",
    width,
    22,
    prefix,
    variants
  );
  var batten = (width, prefix, variants) => product(
    "batten",
    "braedor/laekt",
    "Spruce batten VI+",
    width,
    25,
    prefix,
    variants
  );
  var deromeCatalogue = [
    structural(45, 70, "104507024000", [130, 136, 142, 148, 151, 154]),
    structural(45, 95, "104509524000", [130, 136, 139, 142, 145, 148, 151, 154]),
    structural(45, 120, "104512024000", [130, 136, 139, 142, 145, 148, 151, 154]),
    structural(45, 145, "104514524000", [130, 136, 139, 142, 145, 148, 151, 154]),
    structural(45, 170, "104517024000", [130, 136, 139, 142, 145, 148, 151, 154]),
    structural(45, 195, "104519524000", [130, 136, 139, 142, 145, 148, 151, 154]),
    structural(45, 220, "104522024000", [130, 136, 139, 142, 145, 148, 151, 154]),
    structural(45, 245, "104524524000", [130, 136, 142, 148, 151, 154]),
    structural(70, 70, "107007024000", [136, 142, 148]),
    panel(70, "102207004000", [130, 136, 142, 148, 154]),
    panel(95, "102209504000", [130, 133, 136, 139, 142, 145, 148, 151, 154]),
    panel(120, "102212004000", [130, 133, 136, 139, 142, 145, 148, 151, 154]),
    panel(145, "102214504000", [130, 133, 136, 142, 148, 151, 154]),
    panel(170, "102217004000", [130, 136, 139, 142, 145, 148, 151, 154]),
    panel(195, "102219504000", [136, 142, 148, 151, 154]),
    // Use the variant table's dimensions where the product title differs.
    batten(36, "102503607000", [136, 142, 145, 148]),
    batten(48, "102504807000", [136, 142, 148]),
    product(
      "service",
      "braedor/glespanel",
      "Spruce spacing board VI+",
      70,
      28,
      "102807007000",
      [130, 136, 142, 145, 148, 151, 154]
    )
  ];

  // js/roofing.js
  var roofMaterials = {
    tiles: {
      label: "Benders concrete tiles",
      minimumPitch: 14
    },
    standingSeam: {
      label: "Standing-seam metal",
      minimumPitch: 6
    }
  };
  var tileSystems = {
    250: { label: "Benders Exklusiv", width: 280, length: 420, waves: 1 },
    300: { label: "Benders Palema", width: 330, length: 420, waves: 2 }
  };
  function roofRearOffset({ houseBaseHeight, houseBaseRecession }) {
    return houseBaseHeight > 0 ? houseBaseRecession : 0;
  }
  function roofRun(model) {
    return model.length + model.frontOverhang - roofRearOffset(model);
  }
  function standingFlashing(model) {
    const { roofWidth, doorSideOverhang, rear, rafterDepth, slope, roofMaterial, tileRise, flashingHeight } = model;
    const coverRise = roofMaterial === "tiles" ? tileRise : 8;
    const bottom = rear + rafterDepth * Math.hypot(1, slope) + coverRise + 2;
    return { left: -doorSideOverhang, right: roofWidth - doorSideOverhang, bottom, top: bottom + flashingHeight, coverRise };
  }
  function tileGaugeLimit(pitch) {
    return pitch < 18 ? 320 : pitch < 22 ? 340 : 375;
  }
  function roofWidthRange(width, doorSideOverhang, step, maxOverhang) {
    return {
      min: Math.ceil((width + doorSideOverhang) / step) * step,
      max: Math.floor((width + doorSideOverhang + maxOverhang) / step) * step
    };
  }
  function roofPitchGuidance(material, pitch) {
    const system = roofMaterials[material];
    if (!system) return { valid: false, message: "Choose a recognized roof covering." };
    if (pitch < system.minimumPitch) {
      const message = material === "tiles" ? "Roof tiles need at least 14\xB0. Choose standing-seam metal or increase the pitch." : "Standing-seam metal needs at least 6\xB0. Increase the pitch.";
      return { valid: false, message };
    }
    if (material === "tiles" && pitch < 22) {
      return {
        valid: true,
        message: "14\xB0\u201322\xB0 tile roofs need a high-grade, fully sealed underlayment with taped or welded seams."
      };
    }
    if (material === "tiles") {
      return {
        valid: true,
        message: "Use a continuous roof underlay beneath the tiles; keep the cavity ventilated and drain the underlay at the eaves."
      };
    }
    if (material === "standingSeam" && pitch < 14) {
      return {
        valid: true,
        message: "Below 14\xB0, specify double-seamed standing-seam metal over a continuous deck and sealed underlayment."
      };
    }
    return {
      valid: true,
      message: "Use a continuous waterproof underlayment on a solid deck beneath the metal covering."
    };
  }
  function buildRoofSchedule(model) {
    const { roofWidth: widthWithOverhang, frontOverhang, slope, pitch, roofMaterial } = model;
    const slopedRun = roofRun(model) * Math.hypot(1, slope);
    const area = widthWithOverhang * slopedRun / 1e6;
    const edgeLength = widthWithOverhang / 1e3;
    const vergeLength = 2 * slopedRun / 1e3;
    const underlayment = roofMaterial === "tiles" && pitch < 22 ? "High-grade sealed underlayment with taped or welded seams" : "Continuous roof underlayment over solid sheathing";
    return [
      { id: `covering-${roofMaterial}`, role: `${roofMaterials[roofMaterial].label} covering`, quantity: area * 1.1, unit: "m\xB2", basis: "Roof area plus 10\xA0% laps / cuts" },
      { id: "roof-deck", role: "Solid roof deck / sheathing", quantity: area * 1.05, unit: "m\xB2", basis: "Net roof area plus 5\xA0% cuts" },
      { id: `underlayment-${roofMaterial}-${pitch < 22 ? "sealed" : "standard"}`, role: underlayment, quantity: area * 1.1, unit: "m\xB2", basis: "Continuous secondary water barrier" },
      { id: "roof-fasteners", role: "Roofing fasteners, closures & seals", quantity: 1, unit: "allowance", basis: "System-specific; verify with supplier" },
      { id: "eave-fascia", role: "Eave fascia board", quantity: edgeLength, unit: "m", basis: "Across the front eave" },
      { id: "eave-soffit", role: "Vented eaves soffit / rafter-tail protection", quantity: widthWithOverhang * frontOverhang / 1e6, unit: "m\xB2", basis: "Front overhang area; coordinate ventilation with the roof system" },
      { id: "bargeboards-145", role: "Bargeboards, 22 \xD7 145 mm", quantity: vergeLength, unit: "m", basis: "Both sloping roof edges" },
      { id: "bargeboards-120", role: "Bargeboards, 22 \xD7 120 mm", quantity: vergeLength, unit: "m", basis: "Second board on both roof edges" },
      { id: "verge-flashing", role: "Metal verge flashing", quantity: vergeLength, unit: "m", basis: "Both sloping roof edges" },
      { id: "eave-flashing", role: "Metal eave drip flashing", quantity: edgeLength, unit: "m", basis: "Directs water into the gutter" },
      { id: "wall-abutment", role: "Standing flashing (st\xE5ndskiva) at house wall", quantity: edgeLength, unit: "m", basis: "Sealed connection at the high roof edge" },
      { id: "gutter", role: "Half-round gutter", quantity: edgeLength, unit: "m", basis: "Front eave" },
      { id: "downpipe", role: "Downpipe and outlet", quantity: 1, unit: "set", basis: "One outlet at the right-hand end" },
      { id: "fascia-fasteners", role: "Corrosion-resistant trim fixings", quantity: 1, unit: "allowance", basis: "For fascia, bargeboards and flashings" }
    ];
  }

  // js/number-format.js
  function createNumberFormat(options) {
    const formatter = new Intl.NumberFormat("en", options);
    return {
      format(value) {
        return formatter.formatToParts(value).map((part) => {
          if (part.type === "group") return "\u202F";
          if (part.type === "percentSign") return `\xA0${part.value}`;
          return part.value;
        }).join("");
      }
    };
  }

  // js/controls.js
  var dimension = createNumberFormat({ maximumFractionDigits: 0 });
  var windowSizeStep = 100;
  var timberSections = deromeCatalogue.filter((item) => item.family === "frame");
  var timberWidths = [...new Set(timberSections.map((item) => item.width))];
  var timberDepths = [...new Set(timberSections.map((item) => item.depth))].sort((a, b) => a - b);
  var trimWidths = [0, ...deromeCatalogue.filter((item) => item.family === "panel").map((item) => item.width)];
  var boardWidths = trimWidths.filter((value) => value > 0);
  var windowModules = Array.from({ length: 11 }, (_, i) => 500 + i * windowSizeStep);
  function createControls($) {
    const layerMenu = $("wall-layers");
    const roofDisplay = $("roof-display");
    const roofMaterial = $("roof-material");
    const roofFinish = $("roof-finish");
    const footingLayout = $("footing-layout");
    const layerOptions = layerMenu.querySelector(".layer-options");
    if (!layerOptions) throw new Error("The wall layer controls are missing.");
    const wallLayers = [
      ["trim", "Opening trim", "#f7f8ee"],
      ["cover", "Cover boards", "var(--porch-color)"],
      ["base", "Base boards", "var(--porch-base-color)"],
      ["nailers", "Horizontal nailers", "#a87147"],
      ["counter", "Vertical counter-battens", "#ba8f61"],
      ["wind", "Wind barrier", "#739489"],
      ["exterior", "Exterior insulation (optional)", "#c1ad79", false],
      ["studs", "Studs, plates & headers", "#d9ab76"],
      ["cavity", "Stud-bay insulation", "#efd382"],
      ["vapour", "Vapour control", "#8ba8c9"],
      ["service", "Service battens", "#c49b71"],
      ["serviceFill", "Service insulation", "#dbc08f"],
      ["osb", "OSB / plywood", "#bd986d"],
      ["gypsum", "Gypsum lining", "#ecebe3"]
    ];
    const layerInputs = Object.fromEntries(wallLayers.map(([key, label, colour, checked = true]) => {
      const row = document.createElement("label");
      row.className = "view-toggle";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.wallLayer = key;
      input.defaultChecked = checked;
      input.setAttribute("aria-controls", "drawing");
      const swatch = document.createElement("i");
      swatch.className = "swatch";
      swatch.style.background = colour;
      swatch.setAttribute("aria-hidden", "true");
      row.append(input, swatch, label);
      layerOptions.append(row);
      return [key, input];
    }));
    const doorButton = $("toggle-door");
    const groundButton = $("toggle-ground");
    const doorHanding = $("door-handing");
    const doorWindow = $("door-window");
    const fields = {};
    const windowSides = ["front", "right"];
    const windowMuntins = {};
    const houseWindows = {
      houseLeft: { label: "Left house window", sill: 1390, width: 1300, height: 1100 },
      houseExtraLeft: { label: "Additional left house window", offset: 2700, sill: 1390, width: 700, height: 1100 },
      houseUpper: { label: "Upper house window", offset: 4894, sill: 3490, width: 700, height: 500 },
      houseExtraRight: { label: "Additional right house window", offset: 6800, sill: 1390, width: 700, height: 1100 },
      houseRight: { label: "Right house window", sill: 1390, width: 1300, height: 1100 }
    };
    const houseBasementWindows = {
      houseBasementLeft: { label: "Left basement window", offset: 650, sill: 150, width: 900, height: 300 },
      houseBasementExtraLeft: { label: "Additional left basement window", offset: 2700, sill: 150, width: 700, height: 300 },
      houseBasementExtraRight: { label: "Additional right basement window", offset: 6800, sill: 150, width: 700, height: 300 },
      houseBasementRight: { label: "Right basement window", offset: 9138, sill: 150, width: 900, height: 300 }
    };
    function makeField(group, [key, title, initial, min = 0, unit = "mm", max = 5e4, step = unit === "mm" ? 1 : "any", choices]) {
      const label = document.createElement("label");
      label.textContent = title;
      const box = document.createElement("span");
      box.className = "number";
      const input = document.createElement(choices ? "select" : "input");
      Object.assign(input, { name: key, id: key, required: true });
      input.dataset.initial = initial;
      if (choices) {
        for (const value of choices) input.add(new Option(`${dimension.format(value)} ${unit}`, value, value === initial, value === initial));
      } else {
        Object.assign(input, {
          type: "number",
          min,
          max,
          step,
          defaultValue: initial,
          inputMode: unit === "mm" ? "numeric" : "decimal"
        });
      }
      const fieldTitle = windowSides.includes(group) ? `${group} window: ${title.toLowerCase().replace(/^window /, "")}` : Object.hasOwn(houseWindows, group) ? `${houseWindows[group].label}: ${title.toLowerCase()}` : Object.hasOwn(houseBasementWindows, group) ? `${houseBasementWindows[group].label}: ${title.toLowerCase()}` : group === "houseCladding" ? `Existing house: ${title.toLowerCase()}` : title;
      input.setAttribute("aria-label", unit ? `${fieldTitle} (${unit === "mm" ? "millimetres" : "degrees"})` : fieldTitle);
      const suffix = document.createElement("span");
      suffix.className = "unit";
      suffix.textContent = unit;
      suffix.setAttribute("aria-hidden", "true");
      box.append(input);
      if (!choices) box.append(suffix);
      label.append(box);
      fields[key] = input;
      return label;
    }
    function addFields(group, specs) {
      for (const spec of specs) {
        $(group).append(makeField(group, spec));
      }
    }
    const stockSize = (key, title, initial, choices) => [key, title, initial, Math.min(...choices), "mm", Math.max(...choices), 1, choices];
    const windowSize = (key, title, initial) => stockSize(key, title, initial, windowModules);
    const measuredWindowSize = (key, title, initial, max) => [key, title, initial, 100, "mm", max, 1];
    addFields("slab", [
      ["width", "Slab width", 2800, 1200, "mm", 6e3, 1],
      ["length", "Slab length", 2200, 1200, "mm", 6e3, 1],
      ["slabThickness", "Slab thickness", 140, 80, "mm", 400, 1]
    ]);
    addFields("footings", [
      stockSize("footingDiameter", "Pier diameter", 251, [150, 190, 251, 302, 403]),
      ["footingDepth", "Pier depth", 400, 300, "mm", 3e3, 1]
    ]);
    addFields("door", [
      stockSize("doorWidth", "Door opening width", 1e3, [800, 900, 1e3, 1100]),
      stockSize("doorHeight", "Door opening height", 2100, [2e3, 2100, 2200]),
      ["doorThickness", "Door leaf thickness", 70, 40, "mm", 100, 1],
      ["offset", "Offset from house", 550, 0, "mm", 5e3, 1]
    ]);
    for (const side of windowSides) {
      addFields(side, [
        windowSize(side + "Width", "Window width", 900),
        windowSize(side + "Height", "Window height", 1e3),
        [side + "Bottom", "Bottom clearance", 900, 0, "mm", 2e4],
        [side + "Left", "Left clearance", side === "front" ? 805 : 528, 0, "mm", 6e3]
      ]);
      const label = document.createElement("label");
      label.textContent = "Muntins (spr\xF6js)";
      const select = document.createElement("select");
      select.id = `${side}-muntins`;
      select.setAttribute("aria-label", `${side} window muntins`);
      for (const [value, { label: option }] of Object.entries(muntinPatterns)) {
        select.add(new Option(option, value, value === "cross", value === "cross"));
      }
      label.append(select);
      $(side).append(label);
      windowMuntins[side] = select;
    }
    addFields("trims", [stockSize("trimWidth", "Trim width", 95, trimWidths)]);
    const trimLabel = document.createElement("label");
    trimLabel.textContent = "Trim colour";
    const trimColour = document.createElement("input");
    Object.assign(trimColour, { id: "trim-colour", type: "color", defaultValue: "#f5efe1" });
    trimColour.setAttribute("aria-label", "Opening trim colour");
    trimLabel.append(trimColour);
    $("trims").append(trimLabel);
    addFields("walls", [
      ["wallThickness", "Wall thickness", 145, 120, "mm", 600, 1],
      ["claddingSpacing", "Cover-board spacing", 200, 150, "mm", 300, 1],
      stockSize("baseBoardWidth", "Base-board width", 145, boardWidths),
      stockSize("coverBoardWidth", "Cover-board width", 120, boardWidths),
      ["frontWallHeight", "Front wall height", 2350, 2e3, "mm", 3500, 1]
    ]);
    addFields("roof", [
      ["pitch", "Roof angle", 14, 0, "\xB0", 60],
      ["frontOverhang", "Front overhang", 350, 0, "mm", 1e3, 1],
      ["roofWidth", "Total roof width", 3160, 1200, "mm", 8e3, 1],
      ["doorSideOverhang", "Door-side overhang (left)", 180, 0, "mm", 1e3, 1],
      ["flashingHeight", "Standing flashing height", 150, 50, "mm", 500, 1]
    ]);
    addFields("roofTiles", [
      stockSize("tileWidth", "Tile covering width", 300, Object.keys(tileSystems).map(Number)),
      ["tileLength", "Exposed tile length / batten gauge", 310, 310, "mm", 375, 1],
      ["tileRise", "Tile profile rise", 55, 15, "mm", 100, 1]
    ]);
    addFields("studs", [
      ["studSpacing", "Stud spacing", 600, 300, "mm", 600, 1],
      stockSize("studWidth", "Stud width", 45, timberWidths),
      stockSize("studDepth", "Stud depth", 95, timberDepths)
    ]);
    addFields("rafters", [
      ["rafterSpacing", "Rafter spacing", 600, 300, "mm", 1200, 1],
      stockSize("rafterWidth", "Rafter width", 45, timberWidths),
      stockSize("rafterDepth", "Rafter depth", 170, timberDepths)
    ]);
    addFields("housePosition", [
      ["slabOriginOffset", "Origin to slab left edge", 3494, -4e4, "mm", 4e4, 1],
      ["houseWindowGap", "Gap between main windows", 7188, -4e4, "mm", 4e4, 1]
    ]);
    function addWindowRows(table, windows, basement) {
      for (const [key, values] of Object.entries(windows)) {
        const row = document.createElement("tr");
        row.dataset.window = key;
        const heading = document.createElement("th");
        heading.scope = "row";
        heading.textContent = values.label.replace(/ (house|basement) window$/, "");
        row.append(heading);
        const specs = [
          measuredWindowSize(key + "Width", "Width", values.width, basement ? 3e3 : 4e3),
          measuredWindowSize(key + "Height", "Height", values.height, basement ? 1500 : 3e3),
          values.offset === void 0 ? null : [key + "Offset", "Centre from origin", values.offset, -4e4, "mm", 4e4, 1],
          [key + "Sill", basement ? "Sill height above base bottom" : "Sill height above ground", values.sill, 0, "mm", basement ? 3e3 : 12400, 1]
        ];
        for (const spec of specs) {
          const cell2 = document.createElement("td");
          if (spec) {
            makeField(key, spec);
            const input = fields[spec[0]];
            cell2.append(input);
          } else {
            const output = document.createElement("output");
            output.dataset.windowCentre = key;
            cell2.append(output);
          }
          row.append(cell2);
        }
        $(table).append(row);
      }
    }
    addWindowRows("house-window-rows", houseWindows, false);
    addWindowRows("basement-window-rows", houseBasementWindows, true);
    addFields("houseWall", [
      ["houseWallLeft", "Wall left edge from origin", -505, -4e4, "mm", 4e4, 1],
      ["houseWallWidth", "House wall width", 10798, 3e3, "mm", 3e4, 1],
      ["houseWallHeight", "House wall height above ground", 4540, 2500, "mm", 12400, 1],
      ["houseBaseHeight", "Concrete base height", 600, 0, "mm", 3e3, 1],
      ["houseBaseRecession", "Basement recession", 100, 0, "mm", 500, 1]
    ]);
    addFields("houseCladding", [
      ["houseBaseBoardWidth", "Base-board width", 145, 20, "mm", 500, 1],
      ["houseBaseBoardThickness", "Base-board thickness", 22, 1, "mm", 100, 1],
      ["houseCoverBoardWidth", "Cover-board width", 120, 20, "mm", 500, 1],
      ["houseCoverBoardThickness", "Cover-board thickness", 22, 1, "mm", 100, 1]
    ]);
    addFields("houseEntry", [
      ["houseEntryWidth", "Entry width", 2e3, 400, "mm", 1e4, 1],
      ["houseEntryDepth", "Entry depth", 1200, 200, "mm", 1e4, 1],
      ["houseEntryOffset", "Entry centre from origin", 4894, -4e4, "mm", 4e4, 1]
    ]);
    addFields("hedge", [
      ["hedgeDistance", "Distance from house", 3500, 500, "mm", 2e4, 1],
      ["hedgeHeight", "Hedge height", 1500, 300, "mm", 5e3, 1]
    ]);
    addFields("propertyLine", [
      ["propertyLineDistance", "Distance from house", 3500, 0, "mm", 2e4, 1]
    ]);
    function syncTimberSizes() {
      for (const prefix of ["stud", "rafter"]) {
        const depth = fields[prefix + "Depth"];
        const previous = Number(depth.value);
        const choices = timberSections.filter((item) => item.width === Number(fields[prefix + "Width"].value)).map((item) => item.depth);
        const next = choices.reduce((best, value) => Math.abs(value - previous) < Math.abs(best - previous) ? value : best);
        depth.replaceChildren(...choices.map((value) => new Option(`${value} mm`, value, String(value) === depth.dataset.initial, value === next)));
      }
    }
    syncTimberSizes();
    return {
      layerMenu,
      roofDisplay,
      footingLayout,
      wallLayers,
      layerInputs,
      doorButton,
      groundButton,
      doorHanding,
      doorWindow,
      roofMaterial,
      roofFinish,
      fields,
      windowSides,
      trimColour,
      houseWindows,
      houseBasementWindows,
      windowMuntins,
      syncTimberSizes
    };
  }

  // js/framing.js
  function wallPosts(start, end, op, studWidth, studSpacing) {
    const posts = [];
    function add(a, b) {
      if (b > a && !posts.some(([l, r]) => a < r && b > l)) posts.push([a, b]);
    }
    add(start, Math.min(start + studWidth, op.start));
    add(Math.max(end - studWidth, op.end), end);
    add(Math.max(start, op.start - studWidth), op.start);
    add(op.end, Math.min(end, op.end + studWidth));
    for (let a = start + studSpacing; a + studWidth <= end; a += studSpacing) {
      const b = a + studWidth;
      if (a < op.start && b > op.start || a < op.end && b > op.end) continue;
      add(a, b);
    }
    return posts.sort(([a], [b]) => a - b);
  }
  function wallMembers(start, end, top, op, studWidth, studSpacing, isWindow = false) {
    const members = [];
    function member(a, b, low, high, kind) {
      if (b > a) members.push({ a, b, low, high, kind });
    }
    const constant = (z) => () => z;
    const plateTop = (u) => top(u) - studWidth;
    const zero = constant(0), plate = constant(studWidth);
    const sillStuds = isWindow ? [
      [op.start, op.start + studWidth],
      [op.start + studWidth, op.start + 2 * studWidth],
      [op.end - 2 * studWidth, op.end - studWidth],
      [op.end - studWidth, op.end]
    ] : [];
    for (const [a, b] of wallPosts(start, end, op, studWidth, studSpacing)) {
      if (a >= op.start && b <= op.end) {
        if (!sillStuds.some(([left, right]) => a < right && b > left)) {
          member(a, b, plate, constant(op.bottom - studWidth), "stud");
        }
        member(a, b, constant(op.top + studWidth), plateTop, "stud");
      } else {
        member(a, b, plate, plateTop, "stud");
      }
    }
    for (const [a, b] of sillStuds) member(a, b, plate, constant(op.bottom - studWidth), "stud");
    for (const [a, b] of [[start, op.start], [op.end, end]]) member(a, b, zero, plate, "wall-plate");
    member(op.start, op.end, zero, constant(Math.min(studWidth, op.bottom)), "wall-plate");
    member(start, op.start, plateTop, top, "wall-plate");
    member(op.end, end, plateTop, top, "wall-plate");
    member(op.start, op.end, (u) => Math.max(plateTop(u), op.top), top, "wall-plate");
    member(op.start, op.end, constant(Math.max(studWidth, op.bottom - studWidth)), constant(op.bottom), "window-sill");
    member(op.start, op.end, constant(op.top), (u) => Math.min(op.top + studWidth, Math.max(op.top, plateTop(u))), "opening-header");
    return members;
  }
  var clippedHeight = (top, fn, u) => Math.max(0, Math.min(top(u), fn(u)));
  function rafterStarts(roofWidth, overhang, rafterWidth, spacing) {
    const rightEdge = roofWidth - overhang - rafterWidth;
    const starts = [-overhang];
    for (let x = -overhang + spacing; x + rafterWidth <= rightEdge; x += spacing) starts.push(x);
    return [...starts, rightEdge];
  }
  function wallCourses(key, end, claddingSpacing, baseBoardWidth, coverBoardWidth) {
    const [width, phase, pitch] = key === "cover" ? [coverBoardWidth, 0, claddingSpacing] : key === "base" ? [baseBoardWidth, 0.5, claddingSpacing] : [48, 0, 600];
    const half = width / 2;
    const spans = [];
    for (let centre2 = phase * pitch; centre2 - half < end; centre2 += pitch) {
      spans.push([Math.max(0, centre2 - half), Math.min(end, centre2 + half)]);
    }
    return spans;
  }

  // js/bom.js
  var kerf = 3;
  var roles = {
    stud: "Studs",
    "wall-plate": "Wall plates",
    "window-sill": "Window sills",
    "opening-header": "Opening headers"
  };
  function takeoff(model) {
    const {
      width,
      length,
      wallThickness,
      studWidth,
      studDepth,
      studSpacing,
      frontWallHeight,
      rear,
      slope,
      windows,
      offset,
      doorWidth,
      doorHeight,
      rafterWidth,
      rafterDepth,
      rafterSpacing,
      roofWidth,
      doorSideOverhang,
      slabThickness,
      claddingSpacing,
      baseBoardWidth,
      coverBoardWidth
    } = model;
    const factor = Math.hypot(1, slope);
    const groups = /* @__PURE__ */ new Map();
    function add(role, family, width2, depth, length2) {
      if (length2 <= 0) return;
      const key = `${role}:${width2}:${depth}`;
      if (!groups.has(key)) groups.set(key, { role, family, width: width2, depth, cuts: [] });
      groups.get(key).cuts.push(Math.ceil(length2 - 1e-8));
    }
    const start = roofRearOffset(model);
    const door = { start: start + offset, end: start + offset + doorWidth, bottom: 0, top: doorHeight };
    const sideTop = (u) => rear + slope * (start - u);
    const walls = [
      { key: "door", end: length - wallThickness, face: length, top: sideTop, op: door },
      { key: "front", end: width, face: width, top: () => frontWallHeight, op: windows.front },
      { key: "right", end: length - wallThickness, face: length, top: sideTop, op: windows.right }
    ];
    for (const { key, end, face, top, op } of walls) {
      for (const { a, b, low, high, kind } of wallMembers(0, end, top, op, studWidth, studSpacing, key !== "door")) {
        const height = (u) => clippedHeight(top, high, u) - clippedHeight(top, low, u);
        if (Math.max(height(a), height(b)) <= 0) continue;
        const cut = kind === "stud" ? Math.max(height(a), height(b)) : high(a) === top(a) && high(b) === top(b) && kind === "wall-plate" ? Math.hypot(b - a, top(b) - top(a)) : b - a;
        add(roles[kind], "frame", studWidth, studDepth, cut);
      }
      const drip = Math.max(0, 200 - slabThickness);
      for (const [layer, role, stockWidth, depth] of [
        ["base", "Base cladding boards", baseBoardWidth, 22],
        ["cover", "Cover cladding boards", coverBoardWidth, 22],
        ["counter", "Vertical counter-battens", 48, 25]
      ]) {
        const base = layer === "counter" ? 0 : drip;
        const spans = wallCourses(layer, face, claddingSpacing, baseBoardWidth, coverBoardWidth);
        if (layer === "base") spans.push([0, claddingSpacing * 0.19], [face - claddingSpacing * 0.19, face]);
        for (const [a, b] of spans) {
          const head = top(Math.max(0, a));
          const put = (cut) => add(role, layer === "counter" ? "batten" : "panel", stockWidth, depth, cut);
          if (a >= op.start && b <= op.end) {
            put(Math.min(head, op.bottom) - base);
            put(head - Math.max(base, op.top));
          } else put(head - base);
        }
      }
      for (const [role, family, stockWidth, depth] of [
        ["Horizontal nailers", "batten", 48, 25],
        ["Service battens", "service", 70, 28]
      ]) {
        for (let z = 0; z < top(0); z += 600) {
          const run = slope && key !== "front" ? Math.min(face, start + (rear - z) / slope) : face;
          if (z >= op.bottom && z + stockWidth <= op.top && run > op.start) {
            add(role, family, stockWidth, depth, op.start);
            add(role, family, stockWidth, depth, run - op.end);
          } else add(role, family, stockWidth, depth, run);
        }
      }
      const trimWidth = model.trimWidth;
      if (trimWidth > 0) {
        for (const u of [op.start, op.end]) add("Opening trim", "panel", trimWidth, 22, Math.min(top(u), op.top) - op.bottom);
        const span = Math.min(face, op.end + trimWidth) - Math.max(0, op.start - trimWidth);
        add("Opening trim", "panel", trimWidth, 22, span);
      }
    }
    for (const _ of rafterStarts(roofWidth, doorSideOverhang, rafterWidth, rafterSpacing)) {
      add("Rafters", "frame", rafterWidth, rafterDepth, roofRun(model) * factor);
    }
    return [...groups.values()];
  }
  function matchLumber(group, catalogue = deromeCatalogue) {
    function compare(a, b) {
      const distance = (item) => Math.hypot(item.width - group.width, item.depth - group.depth);
      const undersize = (item) => Number(item.width < group.width || item.depth < group.depth);
      return distance(a) - distance(b) || undersize(a) - undersize(b) || a.width - b.width || a.depth - b.depth;
    }
    return catalogue.filter((item) => item.family === group.family).sort(compare)[0];
  }
  function allocate(cuts, variants) {
    const boards = [];
    const missing = [];
    for (const cut of [...cuts].sort((a, b) => b - a)) {
      const usable = (board) => board.left === cut || board.left >= cut + kerf;
      let best;
      for (const board of boards) {
        if (usable(board) && (!best || board.left < best.left)) best = board;
      }
      if (!best) {
        const stock = variants.find((item) => usable({ left: item.length }));
        if (!stock) {
          missing.push(cut);
          continue;
        }
        best = { stock, left: stock.length, cuts: [] };
        boards.push(best);
      }
      best.left = Math.max(0, best.left - cut - kerf);
      best.cuts.push(cut);
    }
    return { boards, missing };
  }
  function buildBom(model) {
    return takeoff(model).flatMap((group) => {
      const product2 = matchLumber(group);
      const { boards, missing } = allocate(group.cuts, product2?.stock ?? []);
      const substitution = product2 && (product2.width !== group.width || product2.depth !== group.depth);
      const rows = /* @__PURE__ */ new Map();
      for (const { stock, cuts } of boards) {
        if (!rows.has(stock.sku)) rows.set(stock.sku, { ...group, product: product2, substitution, stock, cuts: [], count: 0 });
        const row = rows.get(stock.sku);
        row.cuts.push(...cuts);
        row.count++;
      }
      if (missing.length) rows.set("missing", { ...group, product: product2, substitution, cuts: missing, count: 0 });
      return [...rows.values()];
    });
  }

  // js/bom-view.js
  var storageKey = "farstu-derome-quotes-v1";
  var roofStorageKey = "farstu-roof-quotes-v1";
  var maxQuote = 1e7;
  var validQuote = (amount) => amount === null || Number.isFinite(amount) && amount >= 0 && amount <= maxQuote;
  var number = createNumberFormat({ maximumFractionDigits: 3 });
  var money = createNumberFormat({ minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var invalidQuoteMessage = `Enter a quote from 0 to ${number.format(maxQuote)} SEK or leave the field blank. The previous quote is unchanged.`;
  var crossSection = (item) => `${item.width} \xD7 ${item.depth}`;
  function cell(row, value, className) {
    const td = row.insertCell();
    td.textContent = value;
    if (className) td.className = className;
    return td;
  }
  function readQuotes(status) {
    try {
      const text = localStorage.getItem(storageKey);
      if (text === null) return /* @__PURE__ */ new Map();
      const quotes = JSON.parse(text);
      if (!Array.isArray(quotes) || !quotes.every((entry) => Array.isArray(entry) && entry.length === 2 && typeof entry[0] === "string" && ["piece", "metre"].includes(entry[1]?.unit) && validQuote(entry[1].amount))) {
        throw new Error("Unrecognized quote format.");
      }
      return new Map(quotes);
    } catch (error) {
      console.warn("Derome quotes could not be loaded.", error);
      status.textContent = "Saved quotes could not be loaded. You can enter them again.";
      return /* @__PURE__ */ new Map();
    }
  }
  function readRoofQuotes(status) {
    try {
      const text = localStorage.getItem(roofStorageKey);
      if (text === null) return /* @__PURE__ */ new Map();
      const quotes = JSON.parse(text);
      if (!Array.isArray(quotes) || !quotes.every((entry) => Array.isArray(entry) && entry.length === 2 && typeof entry[0] === "string" && validQuote(entry[1]))) {
        throw new Error("Unrecognized roof quote format.");
      }
      return new Map(quotes);
    } catch (error) {
      console.warn("Roof quotes could not be loaded.", error);
      status.textContent = "Saved roof quotes could not be loaded. You can enter them again.";
      return /* @__PURE__ */ new Map();
    }
  }
  function createBomView($) {
    const bom = $("bom-view");
    const status = $("bom-status"), priceStatus = $("bom-price-status"), total = $("bom-total");
    const body = $("bom-rows");
    const time = $("bom-catalogue-date");
    const roofBody = $("roof-rows");
    const roofTotal = $("roof-total");
    const roofPriceStatus = $("roof-price-status");
    time.dateTime = time.textContent = catalogueDate;
    const quotes = readQuotes(priceStatus);
    const roofQuotes = readRoofQuotes(roofPriceStatus);
    let quoteError = priceStatus.textContent, roofQuoteError = roofPriceStatus.textContent;
    let latest, rendered, valid;
    function showPriceStatus(status2, fields, error) {
      const invalid = fields.some(({ input }) => input?.hasAttribute("aria-invalid"));
      status2.textContent = [invalid ? invalidQuoteMessage : "", error].filter(Boolean).join(" ");
    }
    function render() {
      if (!latest) {
        status.textContent = "No valid design is available.";
        return;
      }
      status.textContent = valid ? "" : "Showing the last valid design. Fix the highlighted parameters in Designer to update this estimate.";
      if (latest === rendered) return;
      const rows = buildBom(latest);
      const roofRows = buildRoofSchedule(latest);
      const fragment = document.createDocumentFragment();
      const roofFragment = document.createDocumentFragment();
      const priceFields = [];
      const roofPriceFields = [];
      function refreshTotals(changedSku) {
        let subtotal = 0, priced = 0, unpriced = 0, unmatched = 0;
        for (const { row, output, input, unit } of priceFields) {
          if (!row.stock) {
            unmatched += row.cuts.length;
            continue;
          }
          const quote = quotes.get(row.stock.sku);
          const amount = quote?.amount;
          if (row.stock.sku === changedSku || !input.hasAttribute("aria-invalid")) {
            if (input !== document.activeElement) input.value = amount ?? "";
            unit.value = quote?.unit ?? "piece";
            input.removeAttribute("aria-invalid");
          }
          if (amount == null) {
            output.textContent = "Quote needed";
            unpriced++;
          } else {
            const factor = quote.unit === "metre" ? row.stock.length * row.count / 1e3 : row.count;
            const cost = Math.round(amount * factor * 100) / 100;
            output.textContent = money.format(cost);
            subtotal += cost;
            priced++;
          }
        }
        const partial = unpriced || unmatched;
        total.textContent = `${partial ? "Quoted subtotal" : "Estimated lumber total"}: ${priced ? `${money.format(subtotal)} SEK` : "not yet priced"}${unpriced ? ` \xB7 ${unpriced} unpriced rows` : ""}${unmatched ? ` \xB7 ${unmatched} cuts without a stock match` : ""}`;
        showPriceStatus(priceStatus, priceFields, quoteError);
      }
      function refreshRoofTotals(changedId) {
        let subtotal = 0, priced = 0, unpriced = 0;
        for (const { row, output, input } of roofPriceFields) {
          const amount = roofQuotes.get(row.id);
          if (row.id === changedId || !input.hasAttribute("aria-invalid")) {
            if (input !== document.activeElement) input.value = amount ?? "";
            input.removeAttribute("aria-invalid");
          }
          if (amount == null) {
            output.textContent = "Quote needed";
            unpriced++;
          } else {
            const cost = Math.round(amount * row.quantity * 100) / 100;
            output.textContent = money.format(cost);
            subtotal += cost;
            priced++;
          }
        }
        roofTotal.textContent = `${unpriced ? "Quoted roof subtotal" : "Estimated roof total"}: ${priced ? `${money.format(subtotal)} SEK` : "not yet priced"}${unpriced ? ` \xB7 ${unpriced} unpriced rows` : ""}`;
        showPriceStatus(roofPriceStatus, roofPriceFields, roofQuoteError);
      }
      for (const row of rows) {
        let saveQuote = function() {
          if (!input.validity.valid) {
            input.setAttribute("aria-invalid", "true");
            showPriceStatus(priceStatus, priceFields, quoteError);
            return;
          }
          input.removeAttribute("aria-invalid");
          quoteError = "";
          quotes.set(row.stock.sku, { amount: input.value === "" ? null : input.valueAsNumber, unit: unit.value });
          try {
            localStorage.setItem(storageKey, JSON.stringify([...quotes]));
          } catch (error) {
            console.warn("Derome quotes could not be saved.", error);
            quoteError = "Your quote was applied but could not be saved in this browser.";
          }
          refreshTotals(row.stock.sku);
        };
        const tr = document.createElement("tr");
        fragment.append(tr);
        const role = document.createElement("th");
        role.scope = "row";
        role.textContent = row.role;
        tr.append(role);
        cell(tr, crossSection(row), "numeric");
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = `${row.cuts.length} cuts`;
        const counts = /* @__PURE__ */ new Map();
        for (const length of row.cuts) counts.set(length, (counts.get(length) ?? 0) + 1);
        const lengths = document.createElement("div");
        lengths.textContent = [...counts].sort(([a], [b]) => b - a).map(([mm2, count]) => `${number.format(count)} \xD7 ${number.format(mm2)}`).join("; ");
        details.append(summary, lengths);
        cell(tr, "").append(details);
        const article = cell(tr, row.product ? `${row.product.name} ${crossSection(row.product)}` : "No product");
        if (row.stock) {
          const link = document.createElement("a");
          link.href = row.stock.url;
          link.textContent = row.stock.sku;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          article.append(document.createElement("br"), link);
        }
        const undersize = row.product && (row.product.width < row.width || row.product.depth < row.depth);
        const match = row.stock ? row.substitution ? undersize ? "Substitute \xB7 smaller dimension" : "Substitute \xB7 larger section" : "Exact section" : row.product ? "No listed length fits" : "No catalogue match";
        cell(tr, match, !row.stock || row.substitution ? "bom-flag" : "");
        cell(tr, row.stock ? number.format(row.stock.length) : "\u2014", "numeric");
        cell(tr, row.count || "\u2014", "numeric");
        cell(tr, row.stock ? number.format(row.count * row.stock.length / 1e3) : "\u2014", "numeric");
        const quoteCell = cell(tr, "\u2014");
        const output = cell(tr, "\u2014", "numeric");
        if (!row.stock) {
          priceFields.push({ row, output });
          continue;
        }
        quoteCell.textContent = "";
        const controls = document.createElement("div");
        controls.className = "bom-quote";
        const input = document.createElement("input");
        Object.assign(input, { type: "number", step: "any", min: "0", max: String(maxQuote), inputMode: "decimal" });
        input.setAttribute("aria-label", `Quoted SEK for ${row.role}, ${row.stock.sku}`);
        const unit = document.createElement("select");
        unit.setAttribute("aria-label", `Quote unit for ${row.role}, ${row.stock.sku}`);
        unit.add(new Option("per piece", "piece"));
        unit.add(new Option("per metre", "metre"));
        controls.append(input, unit);
        quoteCell.append(controls);
        priceFields.push({ row, output, input, unit });
        input.addEventListener("change", saveQuote);
        unit.addEventListener("change", saveQuote);
      }
      for (const item of roofRows) {
        const tr = document.createElement("tr");
        roofFragment.append(tr);
        const role = document.createElement("th");
        role.scope = "row";
        role.textContent = item.role;
        tr.append(role);
        cell(tr, number.format(item.quantity), "numeric");
        cell(tr, item.unit);
        const quoteCell = cell(tr, "");
        const input = document.createElement("input");
        Object.assign(input, { type: "number", step: "any", min: "0", max: String(maxQuote), inputMode: "decimal" });
        input.setAttribute("aria-label", `Quoted SEK per ${item.unit} for ${item.role}`);
        quoteCell.append(input);
        const output = cell(tr, "\u2014", "numeric");
        cell(tr, item.basis);
        roofPriceFields.push({ row: item, output, input });
        input.addEventListener("change", () => {
          if (!input.validity.valid) {
            input.setAttribute("aria-invalid", "true");
            showPriceStatus(roofPriceStatus, roofPriceFields, roofQuoteError);
            return;
          }
          input.removeAttribute("aria-invalid");
          roofQuoteError = "";
          roofQuotes.set(item.id, input.value === "" ? null : input.valueAsNumber);
          try {
            localStorage.setItem(roofStorageKey, JSON.stringify([...roofQuotes]));
          } catch (error) {
            console.warn("Roof quotes could not be saved.", error);
            roofQuoteError = "Your roof quote was applied but could not be saved in this browser.";
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

  // js/drawing-svg.js
  var layers = {
    WALLS_EXISTING: 'fill="none" stroke="#647078" stroke-width=".28"',
    HIDDEN_FOUNDATION: 'fill="none" stroke="#56616a" stroke-width=".24" stroke-dasharray="1.5 .8"',
    STRUCTURE_NEW: 'fill="none" stroke="#17252e" stroke-width=".42"',
    CENTERLINES: 'fill="none" stroke="#56616a" stroke-width=".18" stroke-dasharray="2 .6 .35 .6"',
    DIMENSIONS: 'fill="none" stroke="#25343d" stroke-width=".19"',
    ANNOTATIONS: 'fill="none" stroke="#25343d" stroke-width=".25"',
    VERIFICATION_FLAGS: 'fill="none" stroke="#9e3227" stroke-width=".4"',
    TITLE_BLOCK: 'fill="none" stroke="#25343d" stroke-width=".28"'
  };
  var n = (value) => Number(value.toFixed(3));
  var esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;"
  })[char]);
  var integer = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });
  var mm = integer.format;
  var decimal = (value, places = 1) => value.toLocaleString("sv-SE", {
    minimumFractionDigits: places,
    maximumFractionDigits: places
  });
  var level = (z) => `${z < 0 ? "\u2212" : "+"}${(Math.abs(z) / 1e3).toFixed(3)}`;
  function createSheet(id, title, scales, site, date) {
    const content = Object.fromEntries(Object.keys(layers).map((key) => [key, []]));
    const clips = [];
    const add = (layer, shape) => content[layer].push(shape);
    const line = (layer, x1, y1, x2, y2, attrs = "") => add(layer, `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" ${attrs}/>`);
    const rect = (layer, x, y, w, h, attrs = "") => add(layer, `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" ${attrs}/>`);
    const poly = (layer, points, attrs = "", close = false) => {
      const tag = close ? "polygon" : "polyline";
      add(layer, `<${tag} points="${points.map(([x, y]) => `${n(x)},${n(y)}`).join(" ")}" ${attrs}/>`);
    };
    const text = (layer, x, y, label, { size = 2.8, weight = 400, anchor = "start", rotate = 0 } = {}) => {
      const color = layer === "VERIFICATION_FLAGS" ? "#9e3227" : "#17252e";
      add(layer, `<text x="${n(x)}" y="${n(y)}" fill="${color}" stroke="none" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}"${rotate ? ` transform="rotate(${rotate} ${n(x)} ${n(y)})"` : ""}>${esc(label)}</text>`);
    };
    const note = (x, y, rows, size = 2.8) => rows.forEach((row, i) => text("ANNOTATIONS", x, y + i * 4.7, row, { size }));
    const heading = (x, y, label) => text("ANNOTATIONS", x, y, label, { size: 3.6, weight: 700 });
    const cloud = (x, y, w, label) => {
      const h = 8, count = Math.ceil(w / 6), step = w / count;
      const horizontal = Array(count).fill(`q ${step / 2} -2.6 ${step} 0`).join(" ");
      const back = Array(count).fill(`q ${-step / 2} 2.6 ${-step} 0`).join(" ");
      add("VERIFICATION_FLAGS", `<path d="M ${x} ${y} ${horizontal} q 3.6 4 0 ${h} ${back} q -3.6 -4 0 ${-h} Z" fill="#fff"/>`);
      text("VERIFICATION_FLAGS", x + w / 2, y + 5.2, label, { size: 2.75, weight: 700, anchor: "middle" });
    };
    const pending = (rows, x = 14, y = 228) => {
      text("VERIFICATION_FLAGS", x, y, "Pending Verification / Komplettering", { weight: 700 });
      note(x, y + 4.5, rows, 2.6);
    };
    const scaleBar = (x, y, scale, length) => {
      const w = length / scale;
      rect("ANNOTATIONS", x, y, w / 2, 1.5, 'fill="#25343d"');
      rect("ANNOTATIONS", x + w / 2, y, w / 2, 1.5);
      text("ANNOTATIONS", x + w + 2, y + 1.6, `${decimal(length / 1e3, length % 1e3 ? 1 : 0)} m`, { size: 2.5 });
    };
    const view = (ox, oy, scale) => {
      const pt = (u, v) => [ox + u / scale, oy - v / scale];
      const dimension2 = (a, b, offset, label, vertical) => {
        const [x1, y1] = pt(...a), [x2, y2] = pt(...b);
        const q = vertical ? x1 + offset : y1 + offset;
        const p1 = vertical ? [q, y1] : [x1, q], p2 = vertical ? [q, y2] : [x2, q];
        const layer = "DIMENSIONS";
        line(layer, x1, y1, ...p1);
        line(layer, x2, y2, ...p2);
        line(layer, ...p1, ...p2);
        for (const [x3, y3] of [p1, p2]) line(layer, x3 - 0.9, y3 + 0.9, x3 + 0.9, y3 - 0.9);
        const [x, y] = vertical ? [q - 1.3, (y1 + y2) / 2] : [(x1 + x2) / 2, q - 1.3];
        text(layer, x, y, label, { size: 2.6, anchor: "middle", rotate: vertical ? -90 : 0 });
      };
      return {
        line: (layer, u, v, a, b, attrs) => line(layer, ...pt(u, v), ...pt(a, b), attrs),
        rect: (layer, u, v, w, h, attrs) => rect(layer, ...pt(u, v + h), w / scale, h / scale, attrs),
        poly: (layer, points, attrs, close) => poly(layer, points.map((point) => pt(...point)), attrs, close),
        circle(layer, u, v, r) {
          const [x, y] = pt(u, v);
          add(layer, `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r / scale)}"/>`);
        },
        label: (layer, u, v, label, opts) => text(layer, ...pt(u, v), label, opts),
        horizontal: (u, a, v, offset, label = mm(Math.abs(a - u))) => dimension2([u, v], [a, v], offset, label, false),
        vertical: (v, b, u, offset, label = mm(Math.abs(b - v))) => dimension2([u, v], [u, b], offset, label, true),
        pt
      };
    };
    const t = "TITLE_BLOCK";
    rect(t, 7, 7, 406, 283);
    line(t, 7, 25, 413, 25);
    line(t, 7, 251, 413, 251);
    line(t, 7, 275, 413, 275);
    line(t, 270, 251, 270, 275);
    line(t, 371, 251, 371, 275);
    text(t, 14, 19, title, { size: 6, weight: 700 });
    text(t, 406, 18, "FARSTU  /  ANM\xC4LAN", { size: 3.2, weight: 700, anchor: "end" });
    text(t, 14, 257, `NY FARSTU  \xB7  ${site.address || "Adress ej angiven"}`, { size: 3.5, weight: 700 });
    text(t, 14, 263, `Fastighetsbeteckning: ${site.propertyId || "ej angiven"}`);
    text(t, 14, 270, "M\xE5tt i mm, niv\xE5er i m relativt FG. B\xE4rverk, inf\xE4stning och grundl\xE4ggning verifieras.");
    text(t, 275, 257, `Skala (A3): ${scales}`, { weight: 700 });
    text(t, 275, 263, `Datum: ${date}`);
    text(t, 275, 270, `Ritad av: ${site.drawnBy || "Farstu Designer"}`);
    text(t, 392, 266, id, { size: 8, weight: 700, anchor: "middle" });
    text(t, 14, 284, "F\xD6RHANDSKOPIA / UNDERLAG F\xD6R ANM\xC4LAN \u2013 EJ F\xC4RDIGKONSTRUERAD", { size: 3.7, weight: 700 });
    text(t, 406, 284, "ISO A3", { anchor: "end" });
    return {
      line,
      rect,
      poly,
      text,
      note,
      heading,
      cloud,
      pending,
      scaleBar,
      view,
      viewport(label, x, y, w, h, draw) {
        const clipId = `${id}-clip-${clips.length}`;
        clips.push(`<clipPath id="${clipId}" data-zoom-viewport="" data-zoom-label="${esc(label)}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`);
        const starts = Object.entries(content).map(([key, shapes]) => [key, shapes.length]);
        draw();
        for (const [key, start] of starts) {
          const shapes = content[key].splice(start);
          if (shapes.length) add(key, `<g clip-path="url(#${clipId})"><g data-zoom-view="${clipId}">${shapes.join("")}</g></g>`);
        }
      },
      hatch: `fill="url(#${id}-hatch)"`,
      svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="420mm" height="297mm" viewBox="0 0 420 297" role="img" aria-label="${esc(`${id} ${title}`)}" font-family="Arial, sans-serif">
<title>${esc(`${id} ${title}`)}</title>
<defs><pattern id="${id}-hatch" width="2.5" height="2.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V2.5" stroke="#7b858b" stroke-width=".24"/></pattern>${clips.join("")}</defs>
<rect width="420" height="297" fill="#fff"/>
${Object.entries(layers).map(([key, attrs]) => `<g id="${id}-${key}" data-layer="${key}" ${attrs}>${content[key].join("")}</g>`).join("\n")}
</svg>`
    };
  }

  // js/permit-settings.js
  var permitFields = [
    { key: "address", label: "Site address", initial: "", maxLength: 65 },
    { key: "propertyId", label: "Property ID / Fastighetsbeteckning", initial: "", maxLength: 65 },
    { key: "drawnBy", label: "Drawn by", initial: "", maxLength: 32 },
    { key: "frontDirection", label: "Porch front faces", initial: "south", options: ["south", "west", "north", "east"] },
    ...["North", "South", "East", "West"].map((label) => ({
      key: label.toLowerCase(),
      label: `${label} boundary distance (mm, from slab edge)`,
      initial: 4500,
      min: 0,
      max: 1e5
    })),
    { key: "houseDepth", label: "Existing house plan depth (mm)", initial: 8e3, min: 1e3, max: 3e4 },
    { key: "ridge", label: "Existing house ridge height (mm above existing grade)", initial: 6500, min: 0, max: 2e4 },
    { key: "existingGrade", label: "Existing ground offset (mm relative to FG)", initial: -140, min: -4e3, max: 1e3 },
    { key: "newGrade", label: "New ground offset (mm relative to FG)", initial: -140, min: -4e3, max: 1e3 },
    { key: "frost", label: "Frost depth (mm below new grade)", initial: 1100, min: 0, max: 4e3 },
    { key: "snow", label: "Ground snow load (kN/m\xB2; default G\xF6teborg)", initial: 1.5, min: 0, max: 15, step: 0.1 }
  ];
  function permitSettings(values = {}, slabThickness = 140) {
    const defaults = [];
    const settings = {};
    for (const { key, initial, min, max, maxLength, options } of permitFields) {
      const value = values[key];
      if (options) {
        settings[key] = options.includes(value) ? value : initial;
        if (!options.includes(value)) defaults.push(key);
      } else if (typeof initial === "string") {
        settings[key] = typeof value === "string" ? value.trim().slice(0, maxLength) : initial;
      } else if (typeof value === "number" && Number.isFinite(value) && value >= min && value <= max) {
        settings[key] = value;
      } else {
        settings[key] = key === "existingGrade" || key === "newGrade" ? -slabThickness : initial;
        defaults.push(key);
      }
    }
    return { ...settings, defaults };
  }

  // js/foundation.js
  function pierLayout({ width, length, footingColumns, footingRows, footingDiameter }) {
    const radius = footingDiameter / 2;
    const inset = radius + Math.min(
      100,
      (width - footingColumns * footingDiameter) / 4,
      (length - footingRows * footingDiameter) / 4
    );
    const axis = (span, count) => Array.from({ length: count }, (_, i) => inset + i * (span - 2 * inset) / (count - 1));
    return { radius, columns: axis(width, footingColumns), rows: axis(length, footingRows) };
  }

  // js/drawings.js
  var existing = "WALLS_EXISTING";
  var structure = "STRUCTURE_NEW";
  var hidden = "HIDDEN_FOUNDATION";
  var centre = "CENTERLINES";
  var labels = "ANNOTATIONS";
  var gray = 'fill="#e8ebec"';
  var glass = 'fill="#e8f4f7"';
  var dashed = 'stroke-dasharray="2 1"';
  var roofFill = { terracotta: "#bd7960", classicRed: "#a65b55", darkGray: "#797d80", matteBlack: "#5e6165" };
  var roofColor = { terracotta: "terrakotta", classicRed: "klassiskt r\xF6d", darkGray: "m\xF6rkgr\xE5", matteBlack: "mattsvart" };
  var directions = ["south", "west", "north", "east"];
  var swedishDirection = { north: "norr", south: "s\xF6der", east: "\xF6ster", west: "v\xE4ster" };
  var orientation = (site) => {
    const i = directions.indexOf(site.frontDirection);
    return { front: directions[i], left: directions[(i + 1) % 4], rear: directions[(i + 2) % 4], right: directions[(i + 3) % 4] };
  };
  var grossArea = (area) => decimal(area, area !== 15 && Math.abs(area - 15) < 5e-3 ? 4 : 2);
  var crosshair = (v, x, y, r) => {
    v.line(centre, x - r, y, x + r, y);
    v.line(centre, x, y - r, x, y + r);
  };
  function drawingModel(m, site) {
    const face = roofRearOffset(m), flashing = standingFlashing(m);
    const door = { start: face + m.offset, end: face + m.offset + m.doorWidth, bottom: 0, top: m.doorHeight };
    const entry = m.houseEntryOffset - m.slabOriginOffset;
    return {
      ...m,
      face,
      flashing,
      door,
      entry,
      roofTop: flashing.bottom - 2,
      roofFront: flashing.bottom - 2 - m.slope * (m.length + m.frontOverhang - face),
      area: m.width * m.length / 1e6,
      pier: pierLayout(m),
      pierBottom: -m.slabThickness - m.footingDepth,
      frostLevel: site.newGrade - site.frost,
      ridge: site.existingGrade + site.ridge,
      tread: { x: -300, start: Math.max(0, door.start - 100), end: Math.min(m.length, door.end + 100), z: -m.slabThickness / 2 }
    };
  }
  function sitePlan(m, site, date) {
    const s = createSheet("A-1", "Situationsplan", "1:400", site, date);
    const { width: w, length: l, houseA, houseB, face } = m;
    const dir = orientation(site);
    const west = -site[dir.left], east = w + site[dir.right], north = site[dir.rear], south = -l - site[dir.front];
    const left = Math.min(west, houseA), right = Math.max(east, houseB);
    const top = Math.max(north, site.houseDepth - face), bottom = south;
    const fits = right - left <= 99200 && top - bottom <= 64e3;
    const v = fits ? s.view(143 - (left + right) / 800, 127 + (top + bottom) / 800, 400) : s.view(143 - w / 800, 140, 400);
    const frame = fits ? { west, east, north, south } : {
      west: Math.max(west, w / 2 - 49e3),
      east: Math.min(east, w / 2 + 49e3),
      north: Math.min(north, 39e3),
      south: Math.max(south, -27e3)
    };
    const edges = [
      [west === frame.west, frame.west, frame.south, frame.west, frame.north],
      [east === frame.east, frame.east, frame.south, frame.east, frame.north],
      [north === frame.north, frame.west, frame.north, frame.east, frame.north],
      [south === frame.south, frame.west, frame.south, frame.east, frame.south]
    ];
    s.viewport("Situationsplan", 14, 40, 275, 184, () => {
      v.rect(existing, houseA, -face, houseB - houseA, site.houseDepth, gray);
      v.rect(structure, 0, -l, w, l, s.hatch);
      for (const [visible, x, y, a, b] of edges) if (visible) v.line(centre, x, y, a, b);
      if (north === frame.north) v.label(labels, frame.west, north + 900, "Tomtgr\xE4ns");
      if (north === frame.north && north !== 0) v.vertical(0, north, w * 0.65, 3);
      if (south === frame.south && site[dir.front]) v.vertical(-l, south, w * 0.65, 3);
      if (west === frame.west && site[dir.left]) v.horizontal(west, 0, -l * 0.55, 5);
      if (east === frame.east && site[dir.right]) v.horizontal(w, east, -l * 0.55, 5);
    });
    s.heading(14, 35, "1:400  /  Schematisk tomt");
    s.scaleBar(14, 41, 400, 1e4);
    const rotation = 90 * directions.indexOf(dir.front);
    const compass = `transform="rotate(${rotation} 275 54)"`;
    s.text(labels, 275, 41, "N", { weight: 700, anchor: "middle" });
    s.poly(labels, [[275, 46], [272, 57], [275, 54], [278, 57]], `fill="#25343d" ${compass}`, true);
    s.line(labels, 275, 53, 275, 62, compass);
    s.rect(labels, 295, 35, 109, 93);
    s.heading(300, 43, "Ytor och avst\xE5nd");
    s.note(300, 51, [
      `BTA ny farstu (modell): ${grossArea(m.area)} m\xB2`,
      `\xD6A ny farstu: ${decimal(0, 2)} m\xB2 (sluten farstu)`,
      "BTA ber\xE4knad fr\xE5n plattans ytterm\xE5tt.",
      "Befintlig byggnads BTA ing\xE5r inte.",
      "",
      `Norr ${mm(site.north)} \xB7 S\xF6der ${mm(site.south)}`,
      `\xD6ster ${mm(site.east)} \xB7 V\xE4ster ${mm(site.west)}`,
      "Avst\xE5nd fr\xE5n plattans ytterkant (mm)."
    ]);
    s.rect(existing, 300, 97, 8, 4, gray);
    s.text(labels, 311, 100, "Befintlig byggnad");
    s.rect(structure, 300, 106, 8, 4, s.hatch);
    s.text(labels, 311, 109, "Ny farstu");
    s.line(centre, 300, 118, 308, 118);
    s.text(labels, 311, 119, "Tomtgr\xE4ns");
    s.cloud(296, 136, 107, "KONTROLLERAS MOT NYBYGGNADSKARTA");
    const close = Math.min(site.north, site.south, site.east, site.west) < 4500;
    if (close) s.cloud(296, 150, 107, "OBS: TOMTGR\xC4NS N\xC4RMARE \xC4N 4,5 m");
    if (m.area > 15) s.cloud(296, 164, 107, "OBS: BTA > 15,0 m\xB2 \u2013 PR\xD6VA \xC5TG\xC4RDEN");
    const crosses = houseA < west || houseB > east || site.houseDepth - face > north;
    if (crosses) s.cloud(296, 178, 107, "BEFINTLIG BYGGNAD KORSAR SKISSGR\xC4NS");
    if (close) s.note(296, 199, ["Avst\xE5nd till tomtgr\xE4ns < 4,5 m \u2013", "skriftligt grannemedgivande bifogas", "Bilaga ej skapad; kontrollera om medgivande \xE4r m\xF6jligt."], 2.6);
    s.pending([
      `Ers\xE4tt skissgr\xE4nser och huskontur med kommunens kartunderlag. Front mot ${swedishDirection[dir.front]}${site.defaults.includes("frontDirection") ? " (antaget)" : ""}.`,
      `${site.defaults.some((key) => ["north", "south", "west", "east", "houseDepth"].includes(key)) ? "Schablonm\xE5tt anv\xE4nds. " : ""}${!site.address || !site.propertyId ? "Adress och fastighetsbeteckning kompletteras. " : ""}${fits ? "Kontrollera utspr\xE5ng, avst\xE5nd och aream\xE4tning." : "Gr\xE4nser utanf\xF6r ritf\xE4lt visas bara som m\xE5tt i tabell."}`,
      "Kontrollera anm\xE4lnings-/lovplikt och till\xE4mplig areagr\xE4ns med byggnadsn\xE4mnden; 15,0 m\xB2 \xE4r en kontrollsignal."
    ]);
    return s.svg();
  }
  function floorPlan(m, site, date) {
    const s = createSheet("A-2", "Planritning & grundplan", "1:100 / 1:50", site, date);
    const { width: w, length: l, wallThickness: t, face, door, windows, tread } = m;
    const v = s.view(105 - w / 200, 104 - l / 200, 100);
    const f = s.view(297 - w / 100, 133 - l / 100, 50);
    s.heading(14, 35, "01  Planritning  /  1:100");
    s.heading(181, 35, m.pier.columns.length ? "02  Platta, stomlinjer & plintar  /  1:50" : "02  Platta & stomlinjer  /  1:50");
    s.scaleBar(14, 41, 100, 2e3);
    s.scaleBar(181, 41, 50, 2e3);
    const rear = (view, showEntry = false) => {
      const a = Math.max(m.houseA, -500), b = Math.min(m.houseB, w + 500);
      if (b <= a) return;
      const e1 = Math.max(a, m.entry - m.houseEntryWidth / 2), e2 = Math.min(b, m.entry + m.houseEntryWidth / 2);
      for (const [x, end] of showEntry && e1 < e2 ? [[a, e1], [e2, b]] : [[a, b]]) {
        if (end > x) view.rect(existing, x, -face, end - x, t + face, gray);
      }
      if (showEntry && e1 < e2) {
        const depth = Math.min(m.houseEntryDepth, 1800);
        view.poly(existing, [[e1, -face], [e1, depth - face], [e2, depth - face], [e2, -face]]);
      }
    };
    s.viewport("Planritning", 14, 46, 161, 110, () => {
      v.rect(structure, 0, -l, w, l);
      rear(v, true);
      const walls = [
        { start: face, end: l - t, opening: door, outline: (a, b, d, attr) => v.rect(structure, 0, -b, d, b - a, attr) },
        { start: face, end: l - t, opening: windows.right, outline: (a, b, d, attr) => v.rect(structure, w - d, -b, d, b - a, attr) },
        {
          start: 0,
          end: w,
          framingStart: t,
          framingEnd: w - t,
          opening: windows.front,
          outline: (a, b, d, attr) => v.rect(structure, a, -l, b - a, d, attr)
        }
      ];
      for (const { start, end, framingStart = start, framingEnd = end, opening, outline } of walls) {
        outline(start, opening.start, t, s.hatch);
        outline(opening.end, end, t, s.hatch);
        if (opening !== door) outline(opening.start, opening.end, t * 0.46, glass);
        for (const [a, b] of wallPosts(framingStart, framingEnd, opening, m.studWidth, m.studSpacing)) {
          if (b <= opening.start || a >= opening.end) outline(a, b, m.studDepth, 'fill="#7a807d" stroke-width=".13"');
        }
      }
      const rtl = m.doorHanding === "rtl";
      const hinge = -(rtl ? door.end : door.start), direction = rtl ? 1 : -1;
      v.rect(structure, tread.x, -tread.end, -tread.x, tread.end - tread.start, gray);
      v.line(structure, 0, hinge, -m.doorWidth, hinge);
      v.poly(structure, Array.from({ length: 25 }, (_, i) => {
        const angle = i * Math.PI / 48;
        return [-m.doorWidth * Math.sin(angle), hinge + direction * m.doorWidth * Math.cos(angle)];
      }), 'stroke-width=".23"');
      v.rect(centre, -m.doorSideOverhang, -l - m.frontOverhang, m.roofWidth, l + m.frontOverhang - face);
      v.line(centre, w / 2, 150, w / 2, -l - m.frontOverhang - 130);
      v.label(labels, w / 2, -l - m.frontOverhang - 470, "A", { anchor: "middle", weight: 700 });
      v.label(labels, w / 2, 490, "A", { anchor: "middle", weight: 700 });
      v.horizontal(0, w, -l, 15);
      v.vertical(0, -l, w, 17);
      v.label(labels, w * 0.5, -l * 0.51, `BTA ${grossArea(m.area)} m\xB2`, { anchor: "middle", size: 2.3 });
      v.label(labels, w * 0.5, -l * 0.51 - 320, "\xD6A 0,00 m\xB2", { anchor: "middle", size: 2.3 });
    });
    const { columns, rows } = m.pier;
    s.viewport("Grundplan", 181, 46, 222, 158, () => {
      f.rect(structure, 0, -l, w, l);
      rear(f);
      f.line(structure, 0, -face, w, -face, 'stroke-width=".75"');
      f.label(labels, w / 2, -face + 450, "Anslutningslinje mot hus", { anchor: "middle" });
      for (const x of columns) for (const y of rows) {
        f.circle(structure, x, -y, m.pier.radius);
        crosshair(f, x, -y, m.pier.radius + 100);
      }
      for (let i = 1; i < columns.length; i++) f.horizontal(columns[i - 1], columns[i], -l, 9);
      for (let i = 1; i < rows.length; i++) f.vertical(-rows[i - 1], -rows[i], w, 10);
      f.rect(structure, tread.x, -tread.end, -tread.x, tread.end - tread.start, gray);
      f.label(labels, tread.x - 150, -(tread.start + tread.end) / 2, "Trappsteg", { anchor: "end", size: 2.6 });
    });
    s.note(14, 160, ["Gr\xE5 v\xE4gg: befintlig byggnad (utsnitt).", "Streckad kontur: takutspr\xE5ng. A\u2013A: sektion.", "Fyllda markeringar: modellens v\xE4ggreglar."]);
    const outsideRise = tread.z - site.newGrade;
    s.note(181, 207, [
      `Platta ${mm(m.slabThickness)} mm \xB7 ${columns.length ? `${columns.length} \xD7 ${rows.length} plintar \xD8${mm(m.footingDiameter)}` : "inga plintar i modellen"} \xB7 modellens entr\xE9steg, stegdjup 300 mm.`,
      `Stegh\xF6jd: ${mm(outsideRise)} mm (mark till steg) / ${mm(-tread.z)} mm (steg till FG).`
    ], 2.6);
    s.cloud(14, 185, 143, "OBS: VERIFIERA SP\xC4NNVIDDER, B\xC4RLINA OCH INF\xC4STNING");
    s.pending([
      columns.length ? "Modellen har betongplatta p\xE5 plintar; golvbj\xE4lkar (riktning/c/c) \xE4r inte modellerade eller f\xF6reskrivna." : "Inga plintar i modellen; grundl\xE4ggning projekteras. Golvbj\xE4lkar \xE4r inte modellerade eller f\xF6reskrivna.",
      columns.length ? "Takets bakre upplag (b\xE4rlina eller balk), plattans armering, sp\xE4nnvidder och plintreaktioner dimensioneras separat." : "Takets bakre upplag, plattans armering, sp\xE4nnvidder och grundl\xE4ggning dimensioneras separat.",
      `${outsideRise <= 0 ? "Ny mark ligger i eller \xF6ver modellsteget. " : ""}Kontrollera trappans geometri, tillg\xE4nglighet, niv\xE5skillnader och fasts\xE4ttning p\xE5 plats.`
    ]);
    return s.svg();
  }
  function groundLines(v, site, a, b) {
    v.line(hidden, a, site.existingGrade, b, site.existingGrade);
    v.line(labels, a, site.newGrade, site.newGrade === site.existingGrade ? (a + b) / 2 : b, site.newGrade, 'stroke-width=".42"');
    v.line(centre, a, 0, b, 0);
    v.label(labels, b, 200, "+0.000 / FG", { anchor: "end", size: 2.45 });
  }
  function piersInElevation(v, m, positions, bottom) {
    for (const u of positions) {
      v.rect(hidden, u - m.pier.radius, m.pierBottom, m.footingDiameter, m.footingDepth);
      if (bottom < m.pierBottom) {
        v.rect(hidden, u - m.pier.radius, bottom, m.footingDiameter, m.pierBottom - bottom, 'stroke-dasharray=".5 .8"');
      }
    }
  }
  function elevations(m, site, date) {
    const s = createSheet("A-3", "Fasadritningar \u2013 ber\xF6rda fasader", "1:100", site, date);
    const { width: w, length: l, face, door, windows, ridge } = m;
    const dir = orientation(site);
    const roof = `fill="${roofFill[m.roofFinish] || "#92989c"}"`;
    const houseTop = m.houseWallHeight - m.slabThickness;
    const baseTop = m.houseBaseHeight - m.slabThickness;
    const min = Math.min(m.houseA, -m.doorSideOverhang), max = Math.max(m.houseB, w + m.rightOverhang);
    const front = s.view(203 - (min + max) / 200, 125, 100);
    const frontMin = Math.min(
      site.existingGrade,
      site.newGrade,
      ...m.pier.columns.length ? [m.frostLevel, m.pierBottom] : []
    );
    const cropped = Math.max(ridge, m.roofTop, m.flashing.top, houseTop) > 8100 || frontMin < -2400 || max - min > 33800;
    const frontWindow = (v, op) => {
      v.rect(structure, op.start, op.bottom, op.end - op.start, op.top - op.bottom, glass);
      v.line(structure, (op.start + op.end) / 2, op.bottom, (op.start + op.end) / 2, op.top, 'stroke-width=".19"');
    };
    s.heading(14, 35, `01  Fasad mot ${swedishDirection[dir.front]} / front`);
    s.heading(14, 155, `02  Fasad mot ${swedishDirection[dir.left]} / d\xF6rrsida`);
    s.heading(208, 155, `03  Fasad mot ${swedishDirection[dir.right]}`);
    s.scaleBar(350, 34, 100, 5e3);
    s.viewport("Fasad / front", 13, 39, 394, 112, () => {
      front.rect(existing, m.houseA, baseTop, m.houseB - m.houseA, houseTop - baseTop, 'fill="#f0f0ef"');
      if (m.houseBaseHeight) front.rect(existing, m.houseA, -m.slabThickness, m.houseB - m.houseA, m.houseBaseHeight, gray);
      if (ridge > houseTop) {
        front.poly(existing, [[m.houseA, houseTop], [(m.houseA + m.houseB) / 2, ridge], [m.houseB, houseTop]], dashed);
      }
      for (const { left, right, sill, head } of m.houseOpenings) {
        front.rect(existing, left, sill, right - left, head - sill, glass);
      }
      if (m.houseBaseHeight) for (const { left, right, sill, head } of m.basementOpenings) {
        front.rect(existing, left, sill - m.slabThickness, right - left, head - sill, glass);
      }
      piersInElevation(front, m, m.pier.columns, m.frostLevel);
      front.rect(structure, 0, -m.slabThickness, w, m.slabThickness, gray);
      front.rect(structure, 0, 0, w, m.frontWallHeight, 'fill="#f8f6ec"');
      front.rect(structure, -m.doorSideOverhang, m.eave, m.roofWidth, m.roofTop - m.eave, roof);
      frontWindow(front, windows.front);
      groundLines(front, site, min - 700, max + 700);
      if (ridge) front.vertical(site.existingGrade, ridge, min, -13, `Bef. nock ${mm(site.ridge)} \xF6ver mark`);
      front.vertical(0, m.roofTop, max, 12, `Ny takanslutning ${level(m.roofTop)}`);
    });
    for (const [east, x] of [[false, 101], [true, 300]]) {
      const sign = east ? -1 : 1, e = l + m.frontOverhang;
      const v = s.view(x - sign * e / 200, 201, 100);
      const span = (a2, b2) => [Math.min(sign * a2, sign * b2), b2 - a2];
      const a = Math.min(sign * -850, sign * (e + 700)), b = Math.max(sign * -850, sign * (e + 700));
      s.viewport(east ? "Fasad / right" : "Fasad / door side", east ? 207 : 13, 156.5, 191, 63.5, () => {
        v.poly(existing, [[0, -m.slabThickness], [0, baseTop], [sign * face, baseTop], [sign * face, houseTop]]);
        piersInElevation(v, m, m.pier.rows.map((y) => sign * y), m.frostLevel);
        const [slabStart, slabWidth] = span(0, l);
        v.rect(structure, slabStart, -m.slabThickness, slabWidth, m.slabThickness, gray);
        v.poly(structure, [[sign * face, 0], [sign * l, 0], [sign * l, m.frontWallHeight], [sign * face, m.rear]], 'fill="#f8f6ec"', true);
        v.poly(structure, [[sign * face, m.rear], [sign * e, m.eave], [sign * e, m.roofFront], [sign * face, m.roofTop]], roof, true);
        v.line(structure, sign * face, m.flashing.bottom, sign * face, m.flashing.top, 'stroke-width=".65"');
        const op = east ? windows.right : door;
        const [start, width] = span(op.start, op.end);
        if (east) frontWindow(v, { ...op, start, end: start + width });
        else {
          v.rect(structure, start, 0, width, op.top, 'fill="#e1e4dc"');
          if (m.doorWindow !== "none") v.rect(structure, start + width * 0.23, op.top * 0.49, width * 0.54, op.top * 0.39, glass);
          v.rect(structure, treadSide(m.tread, sign), -m.slabThickness, m.tread.end - m.tread.start, m.slabThickness / 2, gray);
        }
        groundLines(v, site, a, b);
        v.vertical(0, m.roofFront, sign * e, east ? -5 : 6, `Takfot ${level(m.roofFront)}`);
      });
    }
    s.note(15, 221, [m.pier.columns.length ? "Befintlig marklinje: streckad  \xB7  Ny marklinje: heldragen  \xB7  Plintar under mark: streckade; prickat visar bed\xF6mt tj\xE4ldjup." : "Befintlig marklinje: streckad  \xB7  Ny marklinje: heldragen  \xB7  Inga plintar i modellen."], 2.55);
    s.note(211, 228, [
      `Taklutning ${decimal(m.pitch, Number.isInteger(m.pitch) ? 0 : 1)}\xB0 \xB7 ${m.roofMaterial === "tiles" ? "betongpannor" : "bandt\xE4ckt pl\xE5t"}, ${roofColor[m.roofFinish] || "kul\xF6r ej angiven"}.`,
      "St\xE5ende tr\xE4panel, kul\xF6r och s\xE4kerhetsglas verifieras."
    ], 2.6);
    s.cloud(274, 141, 130, "KONTROLLERAS: MARK, HUSNOCK OCH V\xC4DERSTRECK");
    if (cropped || Math.max(houseTop, m.flashing.top) > 4400 || frontMin < -1850) {
      s.cloud(14, 141, 111, "H\xD6GA / DJUPA PARTIER KAPAS I RITF\xC4LT");
    }
    s.pending([
      `Befintlig mark ${level(site.existingGrade)} \xB7 Ny mark ${level(site.newGrade)} \xB7 Befintlig nock ${level(ridge)} (takprofil schematisk).`,
      "Verifiera niv\xE5er, fasadkul\xF6r (NCS) och behov av h\xE4rdat/laminerat s\xE4kerhetsglas."
    ]);
    return s.svg();
  }
  var treadSide = ({ start, end }, sign) => Math.min(sign * start, sign * end);
  function sectionDetails(s, m) {
    const a = s.view(229, 106, 20);
    s.heading(213, 35, "D1  Upplag mot befintlig v\xE4gg  /  1:20");
    const run = 610, fall = m.slope * run, depth = m.rafterDepth * Math.hypot(1, m.slope);
    s.viewport("D1 / wall connection", 213, 40, 54, 75, () => {
      a.rect(existing, -180, -260, 180, 680, gray);
      a.poly(structure, [[0, 0], [run, -fall], [run, -fall + depth], [0, depth]], s.hatch, true);
      a.poly(structure, [
        [0, depth + m.flashing.coverRise + m.flashingHeight],
        [0, depth + m.flashing.coverRise],
        [170, depth + m.flashing.coverRise - m.slope * 170]
      ], 'stroke-width=".7"');
      a.rect(hidden, 0, -130, 45, 130);
    });
    s.note(269, 54, [
      "Anslutningspl\xE5t / st\xE5ndskiva bakom panel.",
      `Pl\xE5th\xF6jd i modell: ${mm(m.flashingHeight)} mm.`,
      "Vattenavledning ut p\xE5 takt\xE4ckning.",
      `Takregel ${mm(m.rafterWidth)} \xD7 ${mm(m.rafterDepth)} mm (modell).`,
      "Bakre upplag och inf\xE4stning projekteras."
    ]);
    if (!m.pier.columns.length) {
      s.note(213, 124, [
        "Inga plintar i modellen. Grundl\xE4ggning projekteras.",
        "Konstruktionsvirke: C24 (f\xF6rslag, verifieras).",
        "NTR/A vid markkontakt; NTR/AB ovan mark",
        "d\xE4r tr\xE4skydd beh\xF6vs. Fuktskydd projekteras."
      ], 2.6);
      s.scaleBar(269, 173, 20, 500);
      return;
    }
    const b = s.view(229, 174, 20);
    s.heading(213, 119, "D2  Platta / plint och princip f\xF6r plintj\xE4rn  /  1:20");
    s.viewport("D2 / footing", 213, 124, 54, 89, () => {
      b.rect(structure, -160, -m.slabThickness, 640, m.slabThickness, s.hatch);
      b.rect(structure, (m.studDepth - m.footingDiameter) / 2, -m.slabThickness - 360, m.footingDiameter, 360, gray);
      b.rect(structure, 0, 0, m.studDepth, 180, s.hatch);
      b.poly(hidden, [[-20, -45], [-20, 85], [m.studDepth + 20, 85], [m.studDepth + 20, -45]]);
    });
    s.note(269, 142, [
      `Betongplatta ${mm(m.slabThickness)} mm, plint \xD8${mm(m.footingDiameter)} mm.`,
      "Streckat: plintj\xE4rn f\xF6r ev. separat stolpe.",
      "Inte modellerat; inte ett utf\xF6randebeslag.",
      "Konstruktionsvirke: C24 (f\xF6rslag, verifieras).",
      "NTR/A vid markkontakt; NTR/AB ovan mark",
      "d\xE4r tr\xE4skydd beh\xF6vs. Fuktskydd projekteras."
    ]);
    s.scaleBar(269, 173, 20, 500);
  }
  function section(m, site, date) {
    const s = createSheet("A-4", "Sektionsritning & konstruktionsdetaljer", "1:50 / 1:20", site, date);
    const v = s.view(101 - m.length / 100, 153, 50);
    const e = m.length + m.frontOverhang;
    s.heading(14, 35, "A\u2013A  Sektion genom farstu och husanslutning  /  1:50");
    s.scaleBar(14, 41, 50, 2e3);
    s.viewport("Section A\u2013A", 12, 47, 190, 148, () => {
      const baseTop = m.houseBaseHeight - m.slabThickness;
      const wallTop = m.houseWallHeight - m.slabThickness;
      if (m.houseBaseHeight > 0) v.rect(existing, -400, -m.slabThickness, 400, m.houseBaseHeight, gray);
      v.rect(existing, -400, baseTop, 400 + m.face, wallTop - baseTop, gray);
      v.rect(structure, 0, -m.slabThickness, m.length, m.slabThickness, s.hatch);
      const window2 = m.windows.front;
      const cutsWindow = window2.start <= m.width / 2 && m.width / 2 <= window2.end;
      const front = m.length - m.wallThickness;
      if (cutsWindow) {
        v.rect(structure, front, 0, m.wallThickness, window2.bottom, s.hatch);
        v.rect(structure, front, window2.top, m.wallThickness, m.frontWallHeight - window2.top, s.hatch);
        v.line(structure, front + m.wallThickness / 2, window2.bottom, front + m.wallThickness / 2, window2.top);
      } else v.rect(structure, front, 0, m.wallThickness, m.frontWallHeight, s.hatch);
      v.poly(structure, [[m.face, m.rear], [e, m.eave], [e, m.roofFront], [m.face, m.roofTop]], s.hatch, true);
      v.line(structure, m.face, m.flashing.bottom, m.face, m.flashing.top, 'stroke-width=".75"');
      const cutPier = m.pier.columns.some((x) => Math.abs(x - m.width / 2) <= m.pier.radius);
      piersInElevation(v, m, m.pier.rows, m.frostLevel);
      if (cutPier) for (const y of m.pier.rows) {
        v.rect(structure, y - m.pier.radius, m.pierBottom, m.footingDiameter, m.footingDepth, s.hatch);
      }
      groundLines(v, site, -650, e + 250);
      v.vertical(0, m.frontWallHeight, m.length - m.wallThickness, -9, `Rumsh\xF6jd ca ${mm(m.frontWallHeight)} till takregel`);
      v.label(labels, m.face + 120, m.roofTop + 220, "D1", { weight: 700 });
      if (m.pier.rows.length) v.label(labels, m.pier.rows[0] - 120, -m.slabThickness - 160, "D2", { weight: 700, anchor: "end" });
    });
    s.note(14, 198, [
      m.pier.columns.length ? `Modell: betongplatta ${mm(m.slabThickness)} mm; plintbotten ${level(m.pierBottom)}.` : `Modell: betongplatta ${mm(m.slabThickness)} mm; inga plintar. Grundl\xE4ggning projekteras.`,
      `Tj\xE4lfritt djup (underlag): ${mm(site.frost)} mm under ny mark, niv\xE5 ${level(m.frostLevel)}.`,
      `Takreglar ${rafterStarts(m.roofWidth, m.doorSideOverhang, m.rafterWidth, m.rafterSpacing).length} st. \xB7 ${mm(m.rafterWidth)} \xD7 ${mm(m.rafterDepth)} \xB7 nominellt c/c ${mm(m.rafterSpacing)} mm.`
    ], 2.65);
    sectionDetails(s, m);
    if (m.pier.columns.length && m.frostLevel < m.pierBottom) s.cloud(13, 215, 160, "KONTROLLERAS: PLINTBOTTEN \xD6VER ANTAGET TJ\xC4LDJUP");
    s.cloud(213, 215, 189, `OBS: VERIFIERA DIMENSIONERING / SN\xD6ZON ${decimal(site.snow)} kN/m\xB2`);
    s.pending([
      "Verifiera sn\xF6, vind, sp\xE4nnvidder, jord/b\xE4righet, armering, frost, fuktskydd och alla inf\xE4stningar.",
      "R\xE4cke ej modellerat. Verifiera fallh\xF6jd och krav; 1 100 mm \xE4r ett kontrollm\xE5tt d\xE4r till\xE4mpligt.",
      "Fastst\xE4ll g\xE4llande byggregler med kommunen (BBR/EKS d\xE4r till\xE4mpligt); tr\xE4 enligt SS-EN 1995."
    ]);
    if (Math.max(m.flashing.top, m.houseWallHeight - m.slabThickness) > 5200 || m.pier.columns.length && Math.min(m.frostLevel, m.pierBottom) < -2050 || m.slope * 610 > 180 || m.flashingHeight + m.rafterDepth * Math.hypot(1, m.slope) > 1150) {
      s.note(213, 209, ["Geometri utanf\xF6r ritf\xE4lt kapas; angivna skalor bibeh\xE5lls."], 2.55);
    }
    return s.svg();
  }
  var sheets = [sitePlan, floorPlan, elevations, section];
  function compileDrawings(model, values = {}, date = (/* @__PURE__ */ new Date()).toLocaleDateString("sv-SE")) {
    const site = permitSettings(values, model.slabThickness);
    const drawing = drawingModel(model, site);
    return sheets.map((generate, i) => ({ id: `A-${i + 1}`, svg: generate(drawing, site, date) }));
  }

  // js/wheel-zoom.js
  function wheelZoom(event, scale) {
    const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? 240 : 1;
    return Math.max(1, Math.min(4, scale * Math.exp(-event.deltaY * unit * 2e-3)));
  }

  // js/drawings-view.js
  var storageKey2 = "farstu-permit-settings-v1";
  function createDrawingsView($) {
    const panel2 = $("drawings-view"), host = $("permit-sheets"), selector = $("permit-sheet");
    const status = $("drawings-status"), print = $("print-permit-sheets"), download = $("download-permit-svgs");
    const viewportSelector = $("permit-viewport"), zoomLevel = $("permit-zoom-level");
    const dialog = $("permit-dialog"), form = $("permit-form"), fieldset = $("permit-fields");
    const zoomByViewport = /* @__PURE__ */ new WeakMap();
    const selectedBySheet = /* @__PURE__ */ new Map();
    let values = {}, model, valid = false, renderedModel, renderedValues, storageStatus = "", exportStatus = "";
    let compiledSheets = [], gesture;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey2));
      if (saved && typeof saved === "object" && !Array.isArray(saved)) values = saved;
    } catch (error) {
      console.error("Unable to load site and permit settings.", error);
      storageStatus = "Site settings could not be read; drawing defaults are in use.";
    }
    const fields = permitFields.map((spec) => {
      const field = document.createElement("label");
      const input = document.createElement(spec.options ? "select" : "input");
      input.name = spec.key;
      if (spec.options) {
        input.add(new Option("South (assumed)", ""));
        for (const direction of spec.options) input.add(new Option(direction[0].toUpperCase() + direction.slice(1), direction));
      } else if (typeof spec.initial === "number") {
        Object.assign(input, { type: "number", min: spec.min, max: spec.max, step: spec.step || 1 });
      } else {
        input.maxLength = spec.maxLength;
      }
      field.append(spec.label, input);
      fieldset.append(field);
      return { spec, input };
    });
    function showSelectedSheet() {
      for (const sheet of host.children) sheet.hidden = sheet.dataset.sheet !== selector.value;
      const viewports = currentViewports();
      viewportSelector.replaceChildren(...viewports.map((viewport) => new Option(viewport.dataset.zoomLabel, viewport.id)));
      const selected = selectedBySheet.get(selector.value);
      if (viewports.some((viewport) => viewport.id === selected)) viewportSelector.value = selected;
      updateZoomLevel();
    }
    function render() {
      print.disabled = download.disabled = !valid;
      status.textContent = [
        model ? valid ? "" : "Designer has invalid values. Showing the last valid model; correct the errors to export." : "No valid Designer model is available yet.",
        storageStatus,
        exportStatus
      ].filter(Boolean).join(" ");
      if (!model || model === renderedModel && values === renderedValues) return;
      compiledSheets = compileDrawings(model, values);
      const sheets2 = compiledSheets.map(({ id, svg }) => {
        const sheet = document.createElement("div");
        sheet.className = "permit-sheet";
        sheet.dataset.sheet = id;
        sheet.innerHTML = svg;
        return sheet;
      });
      gesture = void 0;
      host.replaceChildren(...sheets2);
      renderedModel = model;
      renderedValues = values;
      showSelectedSheet();
    }
    function currentViewports() {
      return [...host.querySelector(".permit-sheet:not([hidden])")?.querySelectorAll("[data-zoom-viewport]") || []];
    }
    function activeViewport() {
      return currentViewports().find((viewport) => viewport.id === viewportSelector.value);
    }
    function selectViewport(viewport) {
      viewportSelector.value = viewport.id;
      selectedBySheet.set(selector.value, viewport.id);
      updateZoomLevel();
    }
    function state(viewport) {
      return zoomByViewport.get(viewport) || { scale: 1, x: 0, y: 0 };
    }
    function bounds(viewport) {
      const rect = viewport.firstElementChild;
      return {
        x: rect.x.baseVal.value,
        y: rect.y.baseVal.value,
        width: rect.width.baseVal.value,
        height: rect.height.baseVal.value
      };
    }
    function updateZoomLevel() {
      const viewport = activeViewport();
      zoomLevel.textContent = `${Math.round((viewport ? state(viewport).scale : 1) * 100)}%`;
    }
    function transformViewport(viewport, next) {
      const box = bounds(viewport), scale = Math.max(1, Math.min(4, next.scale));
      const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
      const x = clamp(
        next.x,
        box.x - scale * (box.x + box.width) + box.width * 0.2,
        box.x + box.width * 0.8 - scale * box.x
      );
      const y = clamp(
        next.y,
        box.y - scale * (box.y + box.height) + box.height * 0.2,
        box.y + box.height * 0.8 - scale * box.y
      );
      const groups = viewport.ownerSVGElement.querySelectorAll(`[data-zoom-view="${viewport.id}"]`);
      if (scale === 1 && x === 0 && y === 0) {
        zoomByViewport.delete(viewport);
        for (const group of groups) group.removeAttribute("transform");
      } else {
        zoomByViewport.set(viewport, { scale, x, y });
        for (const group of groups) group.setAttribute("transform", `translate(${x} ${y}) scale(${scale})`);
      }
      if (viewport === activeViewport()) updateZoomLevel();
    }
    function zoomAt(viewport, scale, point) {
      const previous = state(viewport);
      scale = Math.max(1, Math.min(4, scale));
      if (scale === previous.scale) return;
      if (scale === 1) {
        transformViewport(viewport, { scale: 1, x: 0, y: 0 });
        return;
      }
      const ratio = scale / previous.scale;
      transformViewport(viewport, {
        scale,
        x: point.x - (point.x - previous.x) * ratio,
        y: point.y - (point.y - previous.y) * ratio
      });
    }
    function zoomSelected(factor) {
      const viewport = activeViewport();
      if (!viewport) return;
      const box = bounds(viewport);
      zoomAt(viewport, state(viewport).scale * factor, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    }
    function panSelected(dx, dy) {
      const viewport = activeViewport();
      if (!viewport) return;
      const previous = state(viewport), box = bounds(viewport);
      transformViewport(viewport, {
        ...previous,
        x: previous.x + dx * box.width * 0.05,
        y: previous.y + dy * box.height * 0.05
      });
    }
    function sheetPoint(svg, event) {
      const matrix = svg.getScreenCTM();
      if (!matrix) return;
      return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    }
    function viewportAt(svg, point) {
      return [...svg.querySelectorAll("[data-zoom-viewport]")].find((viewport) => {
        const box = bounds(viewport);
        return point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;
      });
    }
    selector.addEventListener("change", () => {
      gesture = void 0;
      showSelectedSheet();
    });
    viewportSelector.addEventListener("change", () => {
      gesture = void 0;
      selectedBySheet.set(selector.value, viewportSelector.value);
      updateZoomLevel();
    });
    $("permit-zoom-in").addEventListener("click", () => zoomSelected(1.25));
    $("permit-zoom-out").addEventListener("click", () => zoomSelected(1 / 1.25));
    for (const [direction, dx, dy] of [["left", -1, 0], ["right", 1, 0], ["up", 0, -1], ["down", 0, 1]]) {
      $(`permit-pan-${direction}`).addEventListener("click", () => panSelected(dx, dy));
    }
    host.addEventListener("keydown", (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const actions = {
        "+": () => zoomSelected(1.25),
        "=": () => zoomSelected(1.25),
        "-": () => zoomSelected(1 / 1.25),
        ArrowLeft: () => panSelected(-1, 0),
        ArrowRight: () => panSelected(1, 0),
        ArrowUp: () => panSelected(0, -1),
        ArrowDown: () => panSelected(0, 1)
      };
      if (!actions[event.key]) return;
      event.preventDefault();
      actions[event.key]();
    });
    host.addEventListener("wheel", (event) => {
      if (!event.altKey || !event.deltaY) return;
      const svg = event.target.closest("svg");
      const point = svg && sheetPoint(svg, event);
      const viewport = point && viewportAt(svg, point);
      if (!viewport) return;
      event.preventDefault();
      selectViewport(viewport);
      zoomAt(viewport, wheelZoom(event, state(viewport).scale), point);
    }, { passive: false });
    host.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const svg = event.target.closest("svg");
      const point = svg && sheetPoint(svg, event);
      const viewport = point && viewportAt(svg, point);
      if (!viewport || gesture && (gesture.svg !== svg || gesture.viewport !== viewport || gesture.points.size >= 2)) return;
      if (!gesture) gesture = { svg, viewport, points: /* @__PURE__ */ new Map() };
      gesture.points.set(event.pointerId, point);
      selectViewport(viewport);
      svg.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    host.addEventListener("pointermove", (event) => {
      if (!gesture?.points.has(event.pointerId)) return;
      const point = sheetPoint(gesture.svg, event);
      if (!point) return;
      const before = [...gesture.points.values()];
      gesture.points.set(event.pointerId, point);
      const after = [...gesture.points.values()], previous = state(gesture.viewport);
      if (after.length === 1) {
        transformViewport(gesture.viewport, {
          ...previous,
          x: previous.x + after[0].x - before[0].x,
          y: previous.y + after[0].y - before[0].y
        });
      } else {
        const centre2 = (points) => ({ x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 });
        const distance = (points) => Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        const oldDistance = distance(before);
        if (!oldDistance) return;
        const a = centre2(before), b = centre2(after);
        const scale = Math.max(1, Math.min(4, previous.scale * distance(after) / oldDistance));
        const ratio = scale / previous.scale;
        transformViewport(gesture.viewport, {
          scale,
          x: b.x - (a.x - previous.x) * ratio,
          y: b.y - (a.y - previous.y) * ratio
        });
      }
      event.preventDefault();
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
      host.addEventListener(type, (event) => {
        if (!gesture?.points.delete(event.pointerId)) return;
        if (!gesture.points.size) gesture = void 0;
      });
    }
    $("reset-permit-zoom").addEventListener("click", () => {
      const sheet = host.querySelector(".permit-sheet:not([hidden])");
      for (const viewport of sheet?.querySelectorAll("[data-zoom-viewport]") || []) zoomByViewport.delete(viewport);
      for (const group of sheet?.querySelectorAll("[data-zoom-view][transform]") || []) group.removeAttribute("transform");
      updateZoomLevel();
    });
    $("show-permit-dialog").addEventListener("click", () => {
      const site = permitSettings(values, model?.slabThickness);
      for (const { spec, input } of fields) {
        const assumed = site.defaults.includes(spec.key);
        input.value = assumed ? "" : site[spec.key];
        if (!spec.options) input.placeholder = assumed ? String(site[spec.key]) : "";
      }
      dialog.showModal();
    });
    $("cancel-permit").addEventListener("click", () => dialog.close());
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      values = Object.fromEntries(fields.filter(({ input }) => input.value.trim() !== "").map(({ spec, input }) => [spec.key, input.type === "number" ? input.valueAsNumber : input.value.trim()]));
      try {
        localStorage.setItem(storageKey2, JSON.stringify(values));
        storageStatus = "";
      } catch (error) {
        console.error("Unable to save site and permit settings.", error);
        storageStatus = "Site settings updated for this visit but could not be saved in this browser.";
      }
      dialog.close();
      render();
    });
    print.addEventListener("click", () => {
      if (!valid) return;
      document.body.classList.add("printing-permit");
      window.print();
    });
    window.addEventListener("afterprint", () => document.body.classList.remove("printing-permit"));
    download.addEventListener("click", () => {
      if (!valid) return;
      const urls = [];
      let link;
      try {
        for (const { id, svg } of compiledSheets) {
          const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
          urls.push(url);
          link = document.createElement("a");
          link.href = url;
          link.download = `farstu-${id}.svg`;
          document.body.append(link);
          link.click();
          link.remove();
        }
        setTimeout(() => urls.forEach((url) => URL.revokeObjectURL(url)), 1e3);
        exportStatus = "";
      } catch (error) {
        if (link?.isConnected) link.remove();
        urls.forEach((url) => URL.revokeObjectURL(url));
        console.error("Unable to export SVG drawings.", error);
        exportStatus = "SVG drawings could not be exported in this browser.";
      }
      render();
    });
    return {
      render,
      update(next, isValid) {
        if (isValid) model = next;
        valid = isValid;
        if (!panel2.hidden) render();
      }
    };
  }

  // js/workspace-tabs.js
  function createWorkspaceTabs($, views) {
    const entries = views.map(({ button, panel: panel2, onShow }) => ({ button: $(button), panel: $(panel2), onShow }));
    function show(active) {
      for (const entry of entries) {
        const open = entry === active;
        entry.panel.hidden = !open;
        entry.button.setAttribute("aria-pressed", String(open));
      }
      active.onShow?.();
    }
    for (const entry of entries) entry.button.addEventListener("click", () => show(entry));
  }

  // js/storage.js
  var STORAGE_KEY = "farstu-designer-settings-v1";
  function loadSettings() {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized === null) return { value: null, error: "" };
      const value = JSON.parse(serialized);
      if (!value || value.version !== 1 || typeof value.fields !== "object" || value.fields === null || Array.isArray(value.fields)) {
        return { value: null, error: "Saved settings are not recognized; defaults were loaded." };
      }
      return { value, error: "" };
    } catch (error) {
      console.error("Unable to load saved designer settings.", error);
      return { value: null, error: "Saved settings could not be read; defaults were loaded." };
    }
  }
  function saveSettings(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      return "";
    } catch (error) {
      console.error("Unable to save designer settings.", error);
      return "Settings could not be saved in this browser.";
    }
  }
  function downloadSettings(value) {
    let url;
    let link;
    try {
      const file = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
      url = URL.createObjectURL(file);
      link = document.createElement("a");
      link.href = url;
      link.download = "farstu-designer-settings.json";
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1e3);
      return "Settings exported as farstu-designer-settings.json.";
    } catch (error) {
      if (link?.isConnected) link.remove();
      if (url) URL.revokeObjectURL(url);
      console.error("Unable to export designer settings.", error);
      return "Settings could not be exported in this browser.";
    }
  }

  // js/designer.js
  var houseTrim = 95;
  function initDesigner() {
    const $ = (id) => {
      const element = document.getElementById(id);
      if (!element) throw new Error(`Required page element "#${id}" is missing.`);
      return element;
    };
    const form = $("settings");
    const svg = $("drawing");
    const { width: drawingWidth, height: drawingHeight } = svg.viewBox.baseVal;
    const {
      layerMenu,
      roofDisplay,
      footingLayout,
      wallLayers,
      layerInputs,
      doorButton,
      groundButton,
      doorHanding,
      doorWindow,
      roofMaterial,
      roofFinish,
      fields,
      windowSides,
      trimColour,
      houseWindows,
      houseBasementWindows,
      windowMuntins,
      syncTimberSizes
    } = createControls($);
    const legacyBasementFields = new Set(Object.keys(houseBasementWindows).flatMap((key) => ["Width", "Height", "Offset", "Sill"].map((suffix) => key + suffix)));
    const roofGuidance = $("roof-guidance");
    const tileLayoutGuidance = $("tile-layout-guidance");
    const roofLayoutGuidance = $("roof-layout-guidance");
    const storageStatus = $("storage-status");
    const exportButton = $("export-settings");
    const bom = createBomView($);
    const drawings = createDrawingsView($);
    createWorkspaceTabs($, [
      { button: "show-designer", panel: "designer-view" },
      { button: "show-bom", panel: "bom-view", onShow: bom.render },
      { button: "show-drawings", panel: "drawings-view", onShow: drawings.render }
    ]);
    const dimensions = createNumberFormat({ maximumFractionDigits: 2 });
    const millimetres = createNumberFormat({ maximumFractionDigits: 0 });
    const fmt = (n2) => dimensions.format(n2);
    const mm2 = (n2) => `${millimetres.format(n2)} mm`;
    const houseColor = "var(--house-color)";
    const glassColor = "#80a9b0";
    const footingColor = "#8c88a5";
    let latest;
    let view = "3d";
    let groundHidden = false;
    let persistenceEnabled = true;
    let settingsValid = false;
    let onlySillClearanceErrors = false;
    let doorAngle = 0;
    let doorOpen = false;
    let doorAnimation = 0;
    let paintDoor;
    const activeSection = () => form.querySelector(".parameter-group[open] .parameter-section[open] .fields")?.id;
    let guideSection = activeSection();
    let guideField;
    let guideTimer;
    let paintMeasurements;
    let drawingLayer;
    let zoom = 1, zoomX = 0, zoomY = 0;
    function applyZoom() {
      drawingLayer?.setAttribute("transform", `translate(${zoomX} ${zoomY}) scale(${zoom})`);
    }
    function setZoom(next, x, y) {
      const ratio = next / zoom;
      zoomX = Math.max(drawingWidth * (1 - next), Math.min(0, x - (x - zoomX) * ratio));
      zoomY = Math.max(drawingHeight * (1 - next), Math.min(0, y - (y - zoomY) * ratio));
      zoom = next;
      applyZoom();
      paintMeasurements?.();
    }
    function showMeasurements(field) {
      clearTimeout(guideTimer);
      guideField = field;
      guideTimer = guideSection ? setTimeout(() => {
        guideTimer = void 0;
        paintMeasurements?.();
      }, 6e3) : void 0;
      paintMeasurements?.();
    }
    function setDoor(open, animate = true) {
      cancelAnimationFrame(doorAnimation);
      doorOpen = open;
      doorButton.textContent = open ? "Close door" : "Open door";
      const start = doorAngle;
      const end = open ? Math.PI / 2 : 0;
      const duration = 550 * Math.abs(end - start) / (Math.PI / 2);
      if (!animate || duration === 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) {
        doorAngle = end;
        paintDoor?.();
        return;
      }
      const started = performance.now();
      const frame = (now) => {
        const t = Math.max(0, Math.min(1, (now - started) / duration));
        doorAngle = start + (end - start) * (t * t * (3 - 2 * t));
        paintDoor?.();
        if (t < 1) doorAnimation = requestAnimationFrame(frame);
      };
      doorAnimation = requestAnimationFrame(frame);
    }
    const adjustedStockSizes = [];
    let adjustedRoofSettings = false;
    let adjustedTrims = false;
    let migratedHouseReference = false;
    let addedHouseWindows = false;
    let migratedWindowClearances = false;
    let roundedMillimetres = false;
    function restoreSettings(saved2) {
      if (!saved2 || saved2.version !== 1 || !saved2.fields || !saved2.layers) return false;
      const hasOption = (select, value) => [...select.options].some((option) => option.value === value);
      const savedRoofMaterial = saved2.roofMaterial && hasOption(roofMaterial, saved2.roofMaterial) ? saved2.roofMaterial : Number(saved2.fields.pitch) < 14 ? "standingSeam" : roofMaterial.value;
      const savedRoofFinish = saved2.roofFinish ?? roofFinish.value;
      const savedFields = { ...saved2.fields };
      if (savedFields.slabOriginOffset === void 0 && savedFields.houseWindowGap === void 0 && savedFields.houseWallLeft === void 0) {
        const oldValue = (key, fallback) => {
          const value = savedFields[key] === void 0 ? fallback : savedFields[key];
          return typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : NaN;
        };
        const width = oldValue("width"), leftWidth = oldValue("houseLeftWidth");
        const leftOffset = oldValue("houseLeftOffset"), rightOffset = oldValue("houseRightOffset");
        const rightWidth = oldValue("houseRightWidth"), wallWidth = oldValue("houseWallWidth");
        const slabThickness = oldValue("slabThickness");
        const origin = width / 2 + leftOffset - leftWidth / 2;
        const converted = {
          slabOriginOffset: -origin,
          houseWindowGap: width / 2 + rightOffset - rightWidth / 2 - origin - leftWidth,
          houseWallLeft: (width - wallWidth) / 2 - origin,
          houseUpperOffset: width / 2 + oldValue("houseUpperOffset") - origin,
          houseBasementLeftOffset: width / 2 + oldValue("houseBasementLeftOffset", "-4244") - origin,
          houseBasementRightOffset: width / 2 + oldValue("houseBasementRightOffset", "4244") - origin,
          houseWallHeight: oldValue("houseWallHeight") + slabThickness
        };
        for (const key of ["houseLeft", "houseRight", "houseUpper"]) converted[key + "Sill"] = oldValue(key + "Sill") + slabThickness;
        if (Object.values(converted).some((value) => !Number.isFinite(value))) return false;
        for (const [key, value] of Object.entries(converted)) savedFields[key] = String(value);
        migratedHouseReference = true;
      }
      const legacyTrims = savedFields.trimWidth === void 0 && saved2.trimColour === void 0;
      const savedTrimColour = legacyTrims ? saved2.trimColours?.door : saved2.trimColour;
      if (typeof savedTrimColour !== "string" || !/^#[\da-f]{6}$/i.test(savedTrimColour)) return false;
      if (legacyTrims) {
        savedFields.trimWidth = savedFields.doorTrimWidth;
        adjustedTrims = ["front", "right"].some((key) => {
          const colour = saved2.trimColours?.[key];
          return Number(saved2.fields[key + "TrimWidth"]) !== Number(savedFields.trimWidth) || typeof colour !== "string" || colour.toLowerCase() !== savedTrimColour.toLowerCase();
        });
      }
      if (savedFields.roofWidth === void 0 && savedFields.doorSideOverhang === void 0) {
        const overhang = savedFields.sideOverhang;
        if (typeof overhang !== "string" || overhang.trim() === "" || !Number.isFinite(Number(overhang)) || Number(overhang) < 0 || Number(overhang) > 1e3) return false;
        savedFields.roofWidth = String(Number(savedFields.width) + 2 * Number(overhang));
        savedFields.doorSideOverhang = overhang;
        adjustedRoofSettings = true;
      }
      if (savedRoofMaterial !== saved2.roofMaterial) adjustedRoofSettings = true;
      if (savedRoofMaterial === "standingSeam" && Number(savedFields.pitch) < 6) {
        savedFields.pitch = "6";
        adjustedRoofSettings = true;
      }
      if (savedFields.houseEntryOffset === void 0) {
        const centre2 = Number(savedFields.slabOriginOffset) + Number(savedFields.width) / 2;
        const left = Number(savedFields.houseWallLeft) + 1e3;
        const right = Number(savedFields.houseWallLeft) + Number(savedFields.houseWallWidth) - 1e3;
        savedFields.houseEntryOffset = String(Math.round(Math.max(left, Math.min(right, centre2))));
      }
      if (savedFields.propertyLineDistance === void 0) savedFields.propertyLineDistance = savedFields.hedgeDistance;
      for (const side of windowSides) {
        if (savedFields[side + "Left"] !== void 0) continue;
        const anchor = saved2.anchors?.[side];
        if (!["Bottom", "Top"].includes(anchor)) return false;
        const numeric = (key) => {
          const value = savedFields[key];
          return typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : NaN;
        };
        const width = numeric(side + "Width"), thickness = numeric("wallThickness");
        const face = numeric("houseBaseHeight") > 0 ? numeric("houseBaseRecession") : 0;
        const span = side === "front" ? numeric("width") - 2 * thickness : numeric("length") - thickness - face;
        const left = (span - width) / 2;
        if (!Number.isFinite(left)) return false;
        savedFields[side + "Left"] = String(Math.ceil(left));
        if (anchor === "Top") {
          const clearance = numeric(side + "Top");
          if (!Number.isFinite(clearance) || clearance < 0 || clearance > 5e3) return false;
          const end = face + left + width;
          const roof = side === "front" ? numeric("frontWallHeight") : numeric("frontWallHeight") + Math.tan(numeric("pitch") * Math.PI / 180) * (numeric("length") - end);
          const bottom = roof - numeric(side + "Height") - clearance;
          if (!Number.isFinite(bottom)) return false;
          savedFields[side + "Bottom"] = String(Math.round(bottom));
        }
        migratedWindowClearances = true;
      }
      for (const [prefix, fraction, reference] of [
        ["houseExtraLeft", 0.3, "houseLeft"],
        ["houseExtraRight", 0.7, "houseRight"],
        ["houseBasementExtraLeft", 0.3, "houseBasementLeft"],
        ["houseBasementExtraRight", 0.7, "houseBasementRight"]
      ]) {
        if (savedFields[prefix + "Offset"] === void 0) {
          addedHouseWindows = true;
          savedFields[prefix + "Offset"] = String(Math.round(Number(savedFields.houseWallLeft) + fraction * Number(savedFields.houseWallWidth)));
        }
        for (const suffix of ["Width", "Height", "Sill"]) {
          if (savedFields[prefix + suffix] === void 0) {
            savedFields[prefix + suffix] = suffix === "Width" ? fields[prefix + suffix].dataset.initial : savedFields[reference + suffix] ?? fields[reference + suffix].dataset.initial;
          }
        }
      }
      for (const [key, input] of Object.entries(fields)) {
        const value = ([
          "houseBaseRecession",
          "doorThickness",
          "baseBoardWidth",
          "coverBoardWidth",
          "flashingHeight",
          "houseEntryWidth",
          "houseEntryDepth",
          "houseEntryOffset",
          "houseBaseBoardWidth",
          "houseBaseBoardThickness",
          "houseCoverBoardWidth",
          "houseCoverBoardThickness"
        ].includes(key) || legacyBasementFields.has(key)) && savedFields[key] === void 0 ? input.dataset.initial : savedFields[key];
        if (typeof value !== "string" || value.trim() === "" || !Number.isFinite(Number(value))) return false;
        if (input.tagName === "SELECT") {
          if (Number(value) < 0 || Number(value) > 5e4 || Number(value) === 0 && !hasOption(input, "0")) return false;
          const choices = key === "studDepth" || key === "rafterDepth" ? [...new Set(timberSections.map((item) => item.depth))] : [...input.options].map((option) => Number(option.value));
          const nearest = choices.reduce((best, n2) => Math.abs(n2 - Number(value)) < Math.abs(best - Number(value)) ? n2 : best);
          savedFields[key] = String(nearest);
          if (nearest !== Number(value)) adjustedStockSizes.push(key);
        } else {
          if (Number(value) < Number(input.min) || Number(value) > Number(input.max)) return false;
          const next = key === "pitch" ? Number(value) : Math.round(Number(value));
          if (next !== Number(value)) roundedMillimetres = true;
          savedFields[key] = String(next);
        }
      }
      if (savedRoofMaterial === "tiles" && Number(savedFields.tileLength) > tileGaugeLimit(Number(savedFields.pitch))) {
        savedFields.tileLength = String(tileGaugeLimit(Number(savedFields.pitch)));
        adjustedRoofSettings = true;
      }
      for (const prefix of ["stud", "rafter"]) {
        const width = Number(savedFields[prefix + "Width"]), depth = Number(savedFields[prefix + "Depth"]);
        if (!timberSections.some((item) => item.width === width && item.depth === depth)) {
          const choices = timberSections.filter((item) => item.width === width);
          savedFields[prefix + "Depth"] = String(choices.reduce((best, item) => Math.abs(item.depth - depth) < Math.abs(best.depth - depth) ? item : best).depth);
          adjustedStockSizes.push(prefix + "Depth");
        }
      }
      for (const [key] of Object.entries(layerInputs)) {
        if (typeof saved2.layers[key] !== "boolean") return false;
      }
      if (!hasOption(footingLayout, saved2.footingLayout) || !hasOption(roofDisplay, saved2.roofDisplay) || !hasOption(roofMaterial, savedRoofMaterial) || !hasOption(roofFinish, savedRoofFinish) || !hasOption(doorHanding, saved2.doorHanding) || !["3d", "front", "left", "right", "plan"].includes(saved2.view) || typeof saved2.groundHidden !== "boolean") return false;
      if (saved2.windowMuntins !== void 0 && !Object.entries(windowMuntins).every(([key, input]) => hasOption(input, saved2.windowMuntins?.[key]))) return false;
      if (saved2.doorWindow !== void 0 && !hasOption(doorWindow, saved2.doorWindow)) return false;
      for (const [key, input] of Object.entries(fields)) {
        if (key !== "studDepth" && key !== "rafterDepth") {
          input.value = savedFields[key];
        }
      }
      syncTimberSizes();
      fields.studDepth.value = savedFields.studDepth;
      fields.rafterDepth.value = savedFields.rafterDepth;
      trimColour.value = savedTrimColour;
      if (saved2.windowMuntins) {
        for (const [key, input] of Object.entries(windowMuntins)) input.value = saved2.windowMuntins[key];
      }
      for (const [key, input] of Object.entries(layerInputs)) input.checked = saved2.layers[key];
      footingLayout.value = saved2.footingLayout;
      roofDisplay.value = saved2.roofDisplay;
      roofMaterial.value = savedRoofMaterial;
      roofFinish.value = savedRoofFinish;
      doorHanding.value = saved2.doorHanding;
      if (saved2.doorWindow !== void 0) doorWindow.value = saved2.doorWindow;
      view = saved2.view;
      groundHidden = saved2.groundHidden;
      return true;
    }
    function settingsSnapshot() {
      return {
        version: 1,
        fields: Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, input.value])),
        trimColour: trimColour.value,
        windowMuntins: Object.fromEntries(Object.entries(windowMuntins).map(([key, input]) => [key, input.value])),
        layers: Object.fromEntries(Object.entries(layerInputs).map(([key, input]) => [key, input.checked])),
        footingLayout: footingLayout.value,
        roofDisplay: roofDisplay.value,
        roofMaterial: roofMaterial.value,
        roofFinish: roofFinish.value,
        doorHanding: doorHanding.value,
        doorWindow: doorWindow.value,
        view,
        groundHidden
      };
    }
    function persistSettings() {
      storageStatus.textContent = saveSettings(settingsSnapshot());
    }
    function updateDrawings() {
      drawings.update(settingsValid ? {
        ...latest,
        doorHanding: doorHanding.value,
        doorWindow: doorWindow.value
      } : void 0, settingsValid);
    }
    function update(alignRoofWidth = false) {
      tileLayoutGuidance.textContent = "";
      roofLayoutGuidance.textContent = "";
      tileLayoutGuidance.hidden = roofMaterial.value !== "tiles";
      const roofStep = roofMaterial.value === "tiles" ? Number(fields.tileWidth.value) : 1;
      fields.roofWidth.step = String(roofStep);
      fields.roofWidth.min = "1200";
      fields.roofWidth.max = "8000";
      if (fields.width.validity.valid && fields.doorSideOverhang.validity.valid && fields.tileWidth.validity.valid) {
        const range = roofWidthRange(
          Number(fields.width.value),
          Number(fields.doorSideOverhang.value),
          roofStep,
          Number(fields.doorSideOverhang.max)
        );
        fields.roofWidth.min = String(range.min);
        fields.roofWidth.max = String(range.max);
        const previous = fields.roofWidth.value === "" ? NaN : Number(fields.roofWidth.value);
        if (alignRoofWidth && Number.isFinite(previous) && previous >= 1200 && previous <= 8e3) {
          const next = Math.max(range.min, Math.min(range.max, Math.round(previous / roofStep) * roofStep));
          fields.roofWidth.value = String(next);
          if (next !== previous) adjustedRoofSettings = true;
        }
      }
      const bad = /* @__PURE__ */ new Set();
      const messages = /* @__PURE__ */ new Set();
      const sillMessages = /* @__PURE__ */ new Set();
      function flag(message, ...keys) {
        messages.add(message);
        keys.forEach((key) => bad.add(key));
      }
      const [footingColumns, footingRows] = footingLayout.value.split("x").map(Number);
      const v = { footingColumns, footingRows };
      for (const [key, input] of Object.entries(fields)) {
        v[key] = input.value === "" ? NaN : Number(input.value);
        if (!input.validity.valid || !Number.isFinite(v[key]) || input.tagName === "SELECT" && ![...input.options].some((option) => option.value === input.value)) {
          const label = input.getAttribute("aria-label");
          flag(input.tagName === "SELECT" ? `Choose a listed standard size for ${label}.` : input.validity.stepMismatch && !input.validity.rangeUnderflow && !input.validity.rangeOverflow ? `${label} must be in increments of ${input.step} mm.` : `${label} must be between ${input.min} and ${input.max}.`, key);
          v[key] = NaN;
        }
      }
      const slope = Math.tan(v.pitch * Math.PI / 180);
      const pitchGuidance = roofPitchGuidance(roofMaterial.value, v.pitch);
      roofGuidance.textContent = pitchGuidance.valid ? pitchGuidance.message : "";
      roofGuidance.classList.toggle(
        "roof-guidance-warning",
        pitchGuidance.valid && roofMaterial.value === "tiles" && v.pitch < 22
      );
      if (!pitchGuidance.valid) flag(pitchGuidance.message, "pitch", "roof-material");
      if (roofMaterial.value === "tiles" && Number.isFinite(v.pitch) && v.tileLength > tileGaugeLimit(v.pitch)) {
        flag(
          `At ${fmt(v.pitch)}\xB0 these tiles need a batten gauge from 310 to ${tileGaugeLimit(v.pitch)} mm. Reduce the exposed tile length.`,
          "tileLength"
        );
      }
      const planRecession = roofRearOffset(v);
      const rear = v.frontWallHeight + slope * (v.length - planRecession);
      const eave = v.frontWallHeight - slope * v.frontOverhang;
      const sideSpan = v.length - v.wallThickness;
      const frontSpan = v.width - 2 * v.wallThickness;
      if (sideSpan <= 0 || frontSpan <= 0) flag("The wall thickness leaves no clear interior span.", "wallThickness", "width", "length");
      if (v.houseBaseHeight + 1 > v.houseWallHeight) {
        flag("The concrete base must end below the top of the existing house wall.", "houseBaseHeight", "houseWallHeight");
      }
      if (v.houseBaseBoardThickness + v.houseCoverBoardThickness > v.wallThickness + planRecession) {
        flag(
          "The existing house cladding is thicker than the wall shown in Top view.",
          "houseBaseBoardThickness",
          "houseCoverBoardThickness",
          "wallThickness",
          "houseBaseRecession",
          "houseBaseHeight"
        );
      }
      const noPiers = footingColumns === 0 && footingRows === 0;
      if (!noPiers && (![2, 3].includes(footingColumns) || ![2, 3].includes(footingRows))) {
        flag("Choose a pier grid from the list.", footingLayout.id);
      } else if (!noPiers && (footingColumns * v.footingDiameter >= v.width || footingRows * v.footingDiameter >= v.length)) {
        flag(
          `The ${footingColumns} \xD7 ${footingRows} pier grid does not fit under this slab without touching. Choose a smaller grid, reduce the pier diameter, or enlarge the slab.`,
          footingLayout.id,
          "footingDiameter"
        );
      }
      if (v.studDepth > v.wallThickness) flag("Stud depth exceeds the overall wall thickness.", "studDepth", "wallThickness");
      if (v.baseBoardWidth > v.claddingSpacing || v.coverBoardWidth > v.claddingSpacing || v.baseBoardWidth + v.coverBoardWidth < v.claddingSpacing + 40) {
        flag(
          "Cladding boards must fit their spacing with at least 20 mm overlap on each side of the joint.",
          "baseBoardWidth",
          "coverBoardWidth",
          "claddingSpacing"
        );
      }
      for (const prefix of ["stud", "rafter"]) {
        if (!timberSections.some((item) => item.width === v[prefix + "Width"] && item.depth === v[prefix + "Depth"])) {
          flag(`Choose a listed timber section for the ${prefix}s.`, prefix + "Width", prefix + "Depth");
        }
      }
      if (v.studWidth >= v.studSpacing) flag("Stud width must be less than the centre-to-centre spacing.", "studWidth", "studSpacing");
      if (v.rafterWidth >= v.rafterSpacing) flag("Rafter width must be less than the centre-to-centre spacing.", "rafterWidth", "rafterSpacing");
      const rightOverhang = v.roofWidth - v.width - v.doorSideOverhang;
      if (rightOverhang < 0 || rightOverhang > 1e3) {
        flag(
          "The roof must cover the slab with each side overhang between 0 and 1000 mm.",
          "roofWidth",
          "doorSideOverhang",
          "width"
        );
      }
      if (2 * v.rafterWidth > v.roofWidth) flag("The two edge rafters do not fit within the roof width.", "rafterWidth", "roofWidth");
      const doorEnd = planRecession + v.offset + v.doorWidth;
      if (doorEnd > sideSpan) flag("The left-side door extends into the front wall.", "offset", "doorWidth", "length", "wallThickness");
      if (v.doorHeight > rear - slope * (doorEnd - planRecession)) flag("The left-side door reaches above the roofline at its front edge.", "doorHeight", "frontWallHeight", "pitch");
      if (eave <= 0) flag("The front roof edge reaches slab level. Reduce the pitch or front overhang, or raise the front wall.", "pitch", "frontOverhang", "frontWallHeight");
      const windows = {};
      for (const side of windowSides) {
        const w = v[side + "Width"];
        const h = v[side + "Height"];
        const isFront = side === "front";
        const span = isFront ? frontSpan : sideSpan - planRecession;
        const start = isFront ? v.wallThickness + v[side + "Left"] : sideSpan - v[side + "Left"] - w;
        const end = start + w;
        const available = (isFront ? v.frontWallHeight : rear - slope * (end - planRecession)) - h;
        if (w > span) flag(`The ${side} window is wider than its clear wall span.`, side + "Width", isFront ? "width" : "length", "wallThickness");
        if (v[side + "Left"] + w > span) flag(`The ${side} window extends beyond its clear wall span.`, side + "Left", side + "Width", isFront ? "width" : "length");
        const bottom = v[side + "Bottom"];
        if (bottom > available + 1e-8) flag(`The ${side} window does not fit between the slab and the roofline.`, side + "Height", side + "Bottom", side + "Left");
        if (bottom <= 2 * v.studWidth) {
          const message = `Raise the ${side} window: doubled studs below the sill need space above the bottom plate.`;
          sillMessages.add(message);
          flag(message, side + "Bottom", "studWidth");
        }
        windows[side] = { start, end, bottom, top: bottom + h };
      }
      const origin = -v.slabOriginOffset;
      const houseA = origin + v.houseWallLeft, houseB = houseA + v.houseWallWidth;
      const entryCentre = origin + v.houseEntryOffset;
      if (entryCentre - v.houseEntryWidth / 2 < houseA || entryCentre + v.houseEntryWidth / 2 > houseB) {
        flag(
          "The existing entry extends beyond the sides of the house wall.",
          "houseEntryWidth",
          "houseEntryOffset",
          "houseWallLeft",
          "houseWallWidth"
        );
      }
      const houseOpenings = Object.keys(houseWindows).map((key) => {
        const left = key === "houseLeft" ? origin : key === "houseRight" ? origin + v.houseLeftWidth + v.houseWindowGap : origin + v[key + "Offset"] - v[key + "Width"] / 2;
        const right = left + v[key + "Width"];
        const sill = v[key + "Sill"] - v.slabThickness;
        const head = sill + v[key + "Height"];
        if (left < houseA || right > houseB) {
          flag(
            `${houseWindows[key].label} extends beyond the sides of the house wall.`,
            "houseWallLeft",
            "houseWallWidth",
            key + "Width",
            key === "houseRight" ? "houseWindowGap" : key + "Offset"
          );
        }
        if (head > v.houseWallHeight - v.slabThickness) {
          flag(`${houseWindows[key].label} extends above the house wall.`, "houseWallHeight", key + "Height", key + "Sill");
        }
        return { key, left, right, sill, head };
      });
      const basementOpenings = Object.entries(houseBasementWindows).map(([key, { label }]) => {
        const centre2 = origin + v[key + "Offset"];
        const halfWidth = v[key + "Width"] / 2;
        const sill = v[key + "Sill"];
        const head = sill + v[key + "Height"];
        if (centre2 - halfWidth < houseA || centre2 + halfWidth > houseB) {
          flag(`${label} extends beyond the sides of the house wall.`, "houseWallLeft", "houseWallWidth", key + "Width", key + "Offset");
        }
        if (v.houseBaseHeight > 0 && head > v.houseBaseHeight) {
          flag(`${label} extends beyond the concrete base.`, "houseBaseHeight", key + "Height", key + "Sill");
        }
        return { key, left: centre2 - halfWidth, right: centre2 + halfWidth, sill, head };
      });
      for (const [key, input] of Object.entries({
        ...fields,
        [footingLayout.id]: footingLayout,
        "roof-material": roofMaterial
      })) {
        if (bad.has(key)) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
      }
      onlySillClearanceErrors = messages.size > 0 && messages.size === sillMessages.size;
      $("status").textContent = messages.size ? `${latest ? "Showing the last valid drawing." : "No valid drawing yet."} ${[...messages].join(" ")}` : "";
      if (messages.size) {
        settingsValid = false;
        bom.update(latest, false);
        updateDrawings();
        return false;
      }
      settingsValid = true;
      roofLayoutGuidance.textContent = `Roof width: ${mm2(v.roofWidth)}. Door-side (left) overhang: ${mm2(v.doorSideOverhang)}. Opposite (right) overhang: ${mm2(rightOverhang)}. Width increments: ${mm2(roofStep)}.`;
      if (roofMaterial.value === "tiles") {
        const tile = tileSystems[v.tileWidth];
        tileLayoutGuidance.textContent = `${tile.label}: ${mm2(tile.width)} wide \xD7 ${mm2(tile.length)} long; ${mm2(tile.width - v.tileWidth)} side overlap and ${mm2(tile.length - v.tileLength)} headlap. Layout: ${v.roofWidth / v.tileWidth} whole covering modules \xD7 ${mm2(v.tileWidth)} = ${mm2(v.roofWidth)} roof width. Maximum batten gauge at this pitch: ${mm2(tileGaugeLimit(v.pitch))}.`;
      }
      latest = {
        ...v,
        houseA,
        houseB,
        rightOverhang,
        windows,
        houseOpenings,
        basementOpenings,
        slope,
        rear,
        eave,
        roofMaterial: roofMaterial.value,
        roofFinish: roofFinish.value
      };
      for (const opening of houseOpenings) {
        const output = document.querySelector(`[data-window-centre="${opening.key}"]`);
        if (output) output.textContent = millimetres.format((opening.left + opening.right) / 2 - origin);
      }
      const flashing = standingFlashing(latest);
      const top = v.houseWallHeight - v.slabThickness;
      const touching = houseOpenings.filter((window2) => {
        const extension = sillExtension(window2.right - window2.left);
        const fall = Math.min(16, (window2.head - window2.sill) * 0.1);
        const head = Math.min(window2.head + houseTrim + 12, top);
        const surround = [
          [Math.max(houseA, window2.left - houseTrim), Math.min(houseB, window2.right + houseTrim), window2.sill, Math.min(top, window2.head + houseTrim), 22],
          [Math.max(houseA, window2.left - extension), Math.min(houseB, window2.right + extension), window2.sill - fall - Math.min(9, fall), window2.sill, sillProjection]
        ];
        if (head >= window2.head + houseTrim + 10) {
          surround.push([Math.max(houseA, window2.left - houseTrim - 8), Math.min(houseB, window2.right + houseTrim + 8), window2.head + houseTrim, head, sillProjection]);
        }
        return surround.some(([left, right, bottom, top2, projection]) => flashing.left <= right && flashing.right >= left && flashing.bottom - slope * projection <= top2 && flashing.top >= bottom);
      });
      $("flashing-warning").textContent = touching.length ? `Warning: the standing flashing (st\xE5ndskiva) or its apron touches or overlaps the existing ${touching.map((window2) => houseWindows[window2.key].label.toLowerCase().replace(" house", "")).join(", ")} or its surround. Adjust the roof or window layout and consult a roofer.` : "";
      bom.update(latest, true);
      updateDrawings();
      $("area").textContent = `${fmt(v.width * v.length / 1e6)} m\xB2`;
      $("rear").textContent = mm2(rear);
      $("rise").textContent = mm2(slope * (v.length - planRecession));
      const footingSummary = noPiers ? "No piers; foundation design must be verified." : `${footingColumns * footingRows} piers (${footingColumns} \xD7 ${footingRows}): ${mm2(v.footingDiameter)} diameter by ${mm2(v.footingDepth)} deep below the slab.`;
      $("assembly").textContent = `Slab: ${mm2(v.slabThickness)} thick. Walls: ${mm2(v.wallThickness)} thick. ${footingSummary}`;
      render();
      return true;
    }
    function render() {
      if (!latest) return;
      const {
        width: W,
        length: L,
        frontWallHeight: H,
        rear: R,
        eave: E,
        frontOverhang: F,
        roofWidth,
        doorSideOverhang,
        rightOverhang,
        slabThickness,
        wallThickness: T,
        footingColumns,
        footingRows,
        footingDiameter,
        footingDepth,
        claddingSpacing,
        baseBoardWidth,
        coverBoardWidth,
        windows,
        houseOpenings,
        basementOpenings,
        houseA,
        houseB,
        houseWallHeight: houseHeightAboveGround,
        houseBaseHeight,
        houseBaseRecession,
        slabOriginOffset,
        houseBaseBoardWidth,
        houseBaseBoardThickness,
        houseCoverBoardWidth,
        houseCoverBoardThickness,
        houseEntryWidth,
        houseEntryDepth,
        houseEntryOffset,
        hedgeDistance,
        hedgeHeight,
        propertyLineDistance,
        offset,
        doorWidth,
        doorHeight,
        doorThickness,
        pitch,
        slope,
        studSpacing,
        studWidth,
        studDepth,
        rafterSpacing,
        rafterWidth,
        rafterDepth,
        tileWidth,
        tileLength,
        tileRise,
        roofMaterial: material,
        roofFinish: finish
      } = latest;
      const visible = (key) => layerInputs[key].checked;
      const roofTiles = roofDisplay.value === "tiles";
      const roofFraming = roofDisplay.value === "rafters";
      const roofPaint = {
        terracotta: "#a9573f",
        classicRed: "#96362e",
        darkGray: "#45494a",
        matteBlack: "#292c2d"
      }[finish];
      const tileTones = finish === "matteBlack" || finish === "darkGray" ? ["#292c2d", "#3a3e3f", "#484c4d", "#55595a", "#494d4e", "#3b3f40", "#303435", "#252829"] : finish === "classicRed" ? ["#7a3028", "#8e382f", "#a44437", "#b14c3d", "#a34235", "#923a31", "#80332c", "#702c25"] : ["#8f4938", "#ab5c47", "#c37759", "#ce8162", "#bf6f53", "#ab5a46", "#964b39", "#824233"];
      const tileEdgeTones = finish === "matteBlack" || finish === "darkGray" ? ["#292c2d", "#45494a"] : finish === "classicRed" ? ["#7a3028", "#a44437"] : ["#a14f3d", "#c0755a"];
      const timberOnly = visible("studs") && wallLayers.every(([key]) => key === "studs" || !visible(key));
      const iso = view === "3d";
      const side = iso || view === "left" ? "left" : "right";
      const plan = view === "plan";
      const front = view === "front";
      const sideElevation = view === "left" || view === "right";
      const raw = iso ? ([x, y, z]) => [0.866 * (x + y), 0.33 * (y - x) - z] : plan ? ([x, y]) => [x, y] : front ? ([x, , z]) => [x, -z] : ([, y, z]) => [side === "left" ? y : -y, -z];
      const shapes = [];
      const doorTrimFaces = [];
      const labels2 = [];
      const dims = [];
      const face = (points, fill, extra = {}) => shapes.push(["polygon", points, { class: "face", fill, ...extra }]);
      const line = (a, b, cls, extra = {}) => shapes.push(["line", [a, b], { class: cls, ...extra }]);
      const propertyLine = (a, b) => {
        line(a, b, "property-line-halo");
        line(a, b, "property-line");
      };
      const note = (at, text, dy = 0, anchor = "middle") => labels2.push({ at, text, dy, anchor });
      const dimension2 = (a, b, gap, text) => dims.push({ a, b, gap, text });
      const ground = (x, y) => [x, y, 0];
      const roofLeft = -doorSideOverhang, roofRight = roofLeft + roofWidth;
      const houseWallHeight = houseHeightAboveGround - slabThickness;
      const housePlanRecession = roofRearOffset(latest);
      const houseAt = (x, z) => [x, housePlanRecession, z];
      const houseBaseAt = (x, z) => [x, 0, z];
      const roofDepth = rafterDepth * Math.hypot(1, slope);
      const tileRun = tileLength / Math.hypot(1, slope);
      const roof = [
        [roofLeft, housePlanRecession, R + roofDepth],
        [roofRight, housePlanRecession, R + roofDepth],
        [roofRight, L + F, E + roofDepth],
        [roofLeft, L + F, E + roofDepth]
      ];
      const roofAt = (x, y, offset2 = 0) => [x, y, R - slope * (y - housePlanRecession) + roofDepth + offset2];
      const flashing = standingFlashing(latest);
      const slab = [ground(0, 0), ground(W, 0), ground(W, L), ground(0, L)];
      const frontAt = (x, z) => [x, L, z];
      const sideAt = (x) => (y, z) => [x, y, z];
      const slabBase = -slabThickness;
      const roofFootprint = roof.map(([x, y]) => [x, y, slabBase]);
      const houseBaseTop = slabBase + houseBaseHeight;
      const houseBaseColor = "#d5d5d5";
      const footingBase = slabBase - footingDepth;
      const { radius: pierRadius, rows: pierRows, columns: pierColumns } = pierLayout(latest);
      const gradeMargin = Math.min(350, W * 0.2, L * 0.2);
      const hedgeHalfDepth = 450;
      const topHedgeCentre = housePlanRecession + hedgeDistance;
      const propertyY = housePlanRecession + propertyLineDistance;
      const sideGradeEnd = Math.max(L + F, topHedgeCentre + hedgeHalfDepth, propertyY) + gradeMargin;
      const frontGradeLeft = Math.min(0, roofLeft) - gradeMargin;
      const frontGradeRight = Math.max(W, roofRight) + gradeMargin;
      const gradeEnd = Math.max(L + F, groundHidden ? 0 : propertyY, plan ? topHedgeCentre + hedgeHalfDepth : 0) + gradeMargin;
      const grade = [
        [roofLeft - gradeMargin, 0, slabBase],
        [roofRight + gradeMargin, 0, slabBase],
        [roofRight + gradeMargin, gradeEnd, slabBase],
        [roofLeft - gradeMargin, gradeEnd, slabBase]
      ];
      const door = { start: housePlanRecession + offset, end: housePlanRecession + offset + doorWidth, bottom: 0, top: doorHeight };
      const rtl = doorHanding.value === "rtl";
      const hingeY = rtl ? door.end : door.start;
      const swingPoint = (angle, distance, height = 0) => [-Math.sin(angle) * distance, hingeY + (rtl ? -1 : 1) * Math.cos(angle) * distance, height];
      const doorPoint = (angle, distance, depth, height) => {
        const [x, y, z] = swingPoint(angle, distance, height);
        return [x + Math.cos(angle) * depth, y + (rtl ? -1 : 1) * Math.sin(angle) * depth, z];
      };
      const swingArc = Array.from({ length: 25 }, (_, i) => swingPoint(i * Math.PI / 48, doorWidth));
      const doorVisible = plan || iso || view === "left";
      const wallTop = (y) => R - slope * (y - housePlanRecession);
      const frontTop = () => H;
      const frontSection = (u, d, z) => [u, L - d, z];
      const sideSection = (which) => (u, d, z) => [which === "left" ? d : W - d, u, z];
      const core = studDepth;
      const spare = T - core;
      const outer = spare * 0.6, inner = spare - outer;
      const bands = {
        trim: [0, 0],
        cover: [0, outer * 0.15],
        base: [outer * 0.15, outer * 0.31],
        nailers: [outer * 0.31, outer * 0.49],
        counter: [outer * 0.49, outer * 0.65],
        wind: [outer * 0.65, outer * 0.72],
        exterior: [outer * 0.72, outer],
        studs: [outer, outer + core],
        cavity: [outer, outer + core],
        vapour: [T - inner, T - inner * 0.91],
        service: [T - inner * 0.91, T - inner * 0.39],
        serviceFill: [T - inner * 0.91, T - inner * 0.39],
        osb: [T - inner * 0.39, T - inner * 0.19],
        gypsum: [T - inner * 0.19, T]
      };
      const wallColour = Object.fromEntries(wallLayers.map(([key, , colour]) => [key, colour]));
      const lumber = (points, kind, color = "#d9ab76", extra = {}) => face(points, color, { class: `face lumber ${kind}`, ...extra });
      const camera = [-1, 1, 0.66];
      const subtract = (a, b) => a.map((v, i) => v - b[i]);
      const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
      const cross = ([x, y, z], [a, b, c]) => [y * c - z * b, z * a - x * c, x * b - y * a];
      const epsilon = 1e-6;
      function plane(points) {
        const origin = points[0];
        for (let i = 1; i < points.length - 1; i++) {
          const n2 = cross(subtract(points[i], origin), subtract(points[i + 1], origin));
          const length = Math.hypot(...n2);
          if (length > epsilon) return n2.map((v) => v / length);
        }
      }
      function timberPrism(outer2, inner2, kind, colour, extra) {
        const centre2 = outer2[0].map((_, i) => (outer2[0][i] + outer2[2][i] + inner2[0][i] + inner2[2][i]) / 4);
        const sides = outer2.map((p, i) => {
          const j = (i + 1) % outer2.length;
          return [p, outer2[j], inner2[j], inner2[i]];
        });
        for (const [i, points] of [outer2, inner2, ...sides].entries()) {
          const n2 = plane(points);
          if (!n2 || dot(n2, camera) * dot(n2, subtract(points[0], centre2)) <= epsilon) continue;
          lumber(
            points,
            i < 2 ? kind : `${kind} lumber-return`,
            i < 2 ? colour : i === 4 ? "#f1cb9a" : "#b3875c",
            extra
          );
        }
      }
      function orderFraming(polygons, output, eye = camera) {
        if (!polygons.length) return;
        let pivot, best = Infinity;
        for (let i = 0; i < Math.min(7, polygons.length); i++) {
          const sample = polygons[Math.floor(i * polygons.length / Math.min(7, polygons.length))];
          let above = 0, below = 0, crossing = 0;
          for (const polygon of polygons) {
            const distances = polygon.points.map((p) => dot(sample.normal, p) - sample.offset);
            const pos = distances.some((d) => d > epsilon), neg = distances.some((d) => d < -epsilon);
            if (pos && neg) crossing++;
            else if (pos) above++;
            else if (neg) below++;
          }
          const score = Math.abs(above - below) + crossing * 4;
          if (score < best) {
            best = score;
            pivot = sample;
          }
        }
        const positive = [], negative = [], coplanar = [];
        for (const polygon of polygons) {
          const points = polygon.points;
          const distances = points.map((p) => dot(pivot.normal, p) - pivot.offset);
          const pos = distances.some((d) => d > epsilon), neg = distances.some((d) => d < -epsilon);
          if (!pos && !neg) coplanar.push(polygon);
          else if (!neg) positive.push(polygon);
          else if (!pos) negative.push(polygon);
          else {
            const a = [], b = [];
            for (let i = 0; i < points.length; i++) {
              const j = (i + 1) % points.length, d = distances[i], e = distances[j];
              if (d >= -epsilon) a.push(points[i]);
              if (d <= epsilon) b.push(points[i]);
              if (d > epsilon && e < -epsilon || d < -epsilon && e > epsilon) {
                const p = points[i].map((v, k) => v + (points[j][k] - v) * d / (d - e));
                a.push(p);
                b.push(p);
              }
            }
            if (a.length >= 3) positive.push({ ...polygon, points: a });
            if (b.length >= 3) negative.push({ ...polygon, points: b });
          }
        }
        const facing = dot(pivot.normal, eye) > 0;
        orderFraming(facing ? negative : positive, output, eye);
        output.push(...coplanar);
        orderFraming(facing ? positive : negative, output, eye);
      }
      const wallPosts2 = (start, end, op) => wallPosts(start, end, op, studWidth, studSpacing);
      function drawWallFrame(at, start, end, top, op, isWindow) {
        const members = wallMembers(start, end, top, op, studWidth, studSpacing, isWindow);
        const height = (fn, u) => clippedHeight(top, fn, u);
        if (visible("studs")) for (const { a, b, low, high, kind } of members) {
          const al = height(low, a), bl = height(low, b);
          const ah = Math.max(al, height(high, a)), bh = Math.max(bl, height(high, b));
          if (ah === al && bh === bl) continue;
          const quad = (d) => [at(a, d, al), at(b, d, bl), at(b, d, bh), at(a, d, ah)];
          const outer2 = quad(0);
          const attrs = { "data-layer": "studs" };
          if (iso) timberPrism(outer2, quad(core), kind, "#d9ab76", attrs);
          else lumber(outer2, kind, "#d9ab76", attrs);
        }
        if (visible("cavity")) {
          members.push({ a: op.start, b: op.end, low: () => op.bottom, high: () => op.top });
          const cuts = [.../* @__PURE__ */ new Set([start, end, ...members.flatMap(({ a, b }) => [a, b])])].sort((a, b) => a - b);
          for (let i = 1; i < cuts.length; i++) {
            const a = cuts[i - 1], b = cuts[i], mid = (a + b) / 2;
            const stack = members.filter((m) => m.a < mid && m.b > mid).sort((p, q) => height(p.low, mid) - height(q.low, mid));
            let al = 0, bl = 0;
            for (const { low, high } of [...stack, { low: top, high: top }]) {
              const ah = Math.max(al, height(low, a)), bh = Math.max(bl, height(low, b));
              if (ah > al || bh > bl) {
                const d = Math.min(1, core / 2);
                face(
                  [at(a, d, al), at(b, d, bl), at(b, d, bh), at(a, d, ah)],
                  wallColour.cavity,
                  { class: "face insulation-bay", "data-layer": "cavity" }
                );
              }
              al = Math.max(ah, height(high, a));
              bl = Math.max(bh, height(high, b));
            }
          }
        }
      }
      function drawRafters() {
        const starts = rafterStarts(roofWidth, doorSideOverhang, rafterWidth, rafterSpacing);
        const y = L + F;
        const start = housePlanRecession;
        const top = (x) => [[x, start, R + roofDepth], [x + rafterWidth, start, R + roofDepth], [x + rafterWidth, y, E + roofDepth], [x, y, E + roofDepth]];
        if (!plan && !iso && !front) {
          const x = side === "left" ? roofLeft : roofRight;
          lumber([[x, start, R], [x, y, E], [x, y, E + roofDepth], [x, start, R + roofDepth]], "rafter");
          return;
        }
        for (const x of starts.reverse()) {
          const t = top(x);
          if (iso) {
            timberPrism(t, t.map(([u, v, z]) => [u, v, z - roofDepth]), "rafter", "#efc693");
            continue;
          }
          if (plan) {
            lumber(t, "rafter", "#e8bd89", { "fill-opacity": ".35" });
            continue;
          }
          lumber(t, "rafter", "#efc693");
          lumber([[x, y, E], [x + rafterWidth, y, E], t[2], t[3]], "rafter-end");
        }
      }
      function wallStrip(at, start, end, top, base, openings) {
        return function strip(a, b, low, high, fill, kind, opacity = 1, layer2) {
          a = Math.max(start, a);
          b = Math.min(end, b);
          low = Math.max(base, low);
          if (b <= a || high <= low) return;
          const cuts = [a, b];
          for (const { start: start2, end: end2, bottom, top: top2 } of openings) {
            if (bottom >= high || top2 <= low) continue;
            if (start2 > a && start2 < b) cuts.push(start2);
            if (end2 > a && end2 < b) cuts.push(end2);
          }
          cuts.sort((x, y) => x - y);
          for (let i = 1; i < cuts.length; i++) {
            let patch = function(bottom, ceiling) {
              if (ceiling <= bottom || top(x) <= bottom) return;
              const roofFall = top(x) - top(y);
              const clippedY = top(y) < bottom ? x + (y - x) * (top(x) - bottom) / roofFall : y;
              const upper = [x, clippedY];
              if (top(x) > ceiling && top(clippedY) < ceiling) {
                upper.splice(1, 0, x + (y - x) * (top(x) - ceiling) / roofFall);
              }
              face(
                [at(x, bottom), at(clippedY, bottom), ...upper.reverse().map((u) => at(u, Math.min(ceiling, top(u))))],
                fill,
                { class: `cladding-facet ${kind}`, "fill-opacity": opacity, ...layer2 && { "data-layer": layer2 } }
              );
            };
            const x = cuts[i - 1], y = cuts[i];
            if (y <= x) continue;
            const holes = openings.filter((op) => op.start < y && op.end > x).sort((p, q) => p.bottom - q.bottom);
            let z = low;
            for (const hole of holes) {
              patch(z, Math.min(high, hole.bottom));
              z = Math.max(z, hole.top);
            }
            patch(z, high);
          }
        };
      }
      function houseCladding(at, start, end, top, bottom, openings) {
        const strip = wallStrip(at, start, end, top, bottom, openings);
        const high = top(start);
        const pitch2 = claddingSpacing;
        const edge = Math.min(22, pitch2 * 0.08, houseCoverBoardWidth * 0.2);
        for (const [a, b] of wallCourses("base", end - start, pitch2, houseBaseBoardWidth, houseCoverBoardWidth)) {
          strip(start + a, start + b, bottom, high, "#b99b63", "house-cladding-base", 0.13);
        }
        for (const [i, [left, right]] of wallCourses("cover", end - start, pitch2, houseBaseBoardWidth, houseCoverBoardWidth).entries()) {
          const a = start + left, b = start + right;
          strip(a, b, bottom, high, i % 3 ? "hsl(var(--cladding-hue) 80% 94%)" : "hsl(var(--cladding-hue) 75% 84%)", "cladding-cover", 0.28);
          strip(a, a + edge, bottom, high, "hsl(var(--cladding-hue) 80% 94%)", "cladding-highlight", 0.62);
          strip(b - edge / 2, b, bottom, high, "#795a35", "cladding-return", 0.28);
          strip(b, b + edge, bottom, high, "#64492d", "cladding-shadow", 0.27);
          strip(b - edge * 2, b - edge * 1.7, bottom, high, "#754e2c", "cladding-grain", 0.14);
          strip(a, b, bottom, bottom + 12, "#745430", "cladding-drip", 0.5);
        }
      }
      function foundation(at, end, slabColor) {
        face([at(0, slabBase), at(end, slabBase), at(end, 0), at(0, 0)], slabColor, { class: "face slab-edge" });
      }
      function drawEntryStep() {
        if (view === "right") return;
        const a = Math.max(0, door.start - 100), b = Math.min(L, door.end + 100);
        const tread = slabBase / 2, outer2 = -300;
        const top = [[outer2, a, tread], [outer2, b, tread], [0, b, tread], [0, a, tread]];
        if (iso || view === "left") {
          face([[outer2, a, slabBase], [outer2, b, slabBase], top[1], top[0]], "#9ba59a", { class: "face step-riser" });
        }
        if (iso || front) {
          face([[outer2, b, slabBase], [0, b, slabBase], top[2], top[1]], "#9ba59a", { class: "face step-riser" });
        }
        if (iso || plan) face(top, "#b98d61", { class: "face step-tread" });
      }
      function drawGutter() {
        const y = L + F, lip = E + roofDepth;
        const back = y - 20, edge = y + 110;
        const bottom = Math.max(0, lip - 100);
        const at = (x, u, z) => [x, u, z];
        const left = roofLeft, right = roofRight;
        const outlet = W;
        const elbow = Math.max(0, bottom - 200);
        const points = [
          at(outlet, y + 55, bottom),
          at(outlet, y + 55, elbow),
          at(outlet, L + 35, Math.max(0, elbow - 90)),
          at(outlet, L + 35, 35),
          at(outlet, L + 85, 15)
        ];
        for (let i = 1; i < points.length; i++) line(points[i - 1], points[i], "downspout-outline");
        for (let i = 1; i < points.length; i++) line(points[i - 1], points[i], "downspout");
        if (iso || front) {
          if (iso) face(
            [at(left, back, lip), at(right, back, lip), at(right, edge, lip), at(left, edge, lip)],
            "#fff",
            { class: "face eave-gutter" }
          );
          face(
            [at(left, edge, lip), at(right, edge, lip), at(right, edge - 25, bottom), at(left, edge - 25, bottom)],
            "#f3f5f5",
            { class: "face eave-gutter" }
          );
        } else {
          face(
            [at(0, back, lip), at(0, edge, lip), at(0, edge - 25, bottom), at(0, back + 20, bottom)],
            "#f3f5f5",
            { class: "face eave-gutter" }
          );
        }
      }
      function drawTiles() {
        const start = roofLeft, end = roofRight, eaveY = L + F;
        const count = Math.round((end - start) / tileWidth);
        const courses = Math.ceil((eaveY - housePlanRecession) / tileRun);
        const elevation = !iso && !front;
        if (elevation ? courses > 80 : count > 65 || iso && count * courses > 1800) {
          const centre2 = (housePlanRecession + eaveY) / 2;
          note(roofAt(W / 2, centre2), "Tile profiles too dense to show", -10);
          return;
        }
        const at = (x, y, h) => roofAt(x, y, h);
        if (elevation) {
          const x = side === "left" ? start : end;
          for (let row = 0; row < courses; row++) {
            const b = eaveY - row * tileRun;
            const a = Math.max(housePlanRecession, b - tileRun);
            const shoulder = b - Math.min((b - a) * 0.22, 55);
            face(
              [at(x, a, 0), at(x, b, 0), at(x, b, tileRise), at(x, shoulder, tileRise), at(x, a, tileRise * 0.6)],
              tileEdgeTones[row % 2],
              { class: "face tile-course-side" }
            );
          }
          return;
        }
        const tones = tileTones;
        const waves = tileSystems[tileWidth].waves;
        const facets = tones.length * waves;
        const strips = [];
        for (let tile = 0; tile < count; tile++) {
          const x = start + tile * tileWidth;
          const profile = (u) => tileRise * Math.abs(Math.sin(Math.PI * waves * (u - x) / tileWidth));
          for (let i = 0; i < facets; i++) {
            const a = x + tileWidth * i / facets;
            const b = x + tileWidth * (i + 1) / facets;
            strips.push({ a, b, h1: profile(a), h2: profile(b), tone: tones[i % tones.length] });
          }
        }
        if (iso) {
          for (const { a, b, h1, h2, tone } of [...strips].reverse()) {
            face([at(a, housePlanRecession, h1), at(b, housePlanRecession, h2), at(b, eaveY, h2), at(a, eaveY, h1)], tone, { class: "tile-facet" });
          }
          for (let row = 1; row < courses; row++) {
            const y = eaveY - row * tileRun;
            const points = [at(strips[0].a, y, strips[0].h1), ...strips.map(({ b, h2 }) => at(b, y, h2))];
            shapes.push(["polyline", points, { class: "tile-joint" }]);
          }
        }
        for (const { a, b, h1, h2, tone } of strips) {
          face([at(a, eaveY, 0), at(b, eaveY, 0), at(b, eaveY, h2), at(a, eaveY, h1)], tone, { class: "tile-facet tile-profile" });
        }
      }
      function drawRoofCovering() {
        if (material === "tiles") {
          drawTiles();
          return;
        }
        const span = roofWidth;
        const spacing = Math.max(350, span / 120);
        for (let x = roofLeft + spacing; x < roofRight; x += spacing) {
          line(roofAt(x, housePlanRecession, 8), roofAt(x, L + F, 8), "roof-standing-seam");
          if (pitch < 14 && x + 10 < roofRight) {
            line(roofAt(x + 10, housePlanRecession, 9), roofAt(x + 10, L + F, 9), "roof-standing-seam");
          }
        }
      }
      function drawStandingFlashing() {
        const { left, right, bottom, top, coverRise } = flashing;
        const apron = housePlanRecession + Math.min(150, L + F - housePlanRecession);
        const metal = "#555b5c";
        face(
          [
            roofAt(left, housePlanRecession, coverRise + 2),
            roofAt(right, housePlanRecession, coverRise + 2),
            roofAt(right, apron, coverRise + 2),
            roofAt(left, apron, coverRise + 2)
          ],
          metal,
          { class: "face roof-abutment-flashing" }
        );
        if (sideElevation) {
          line([0, housePlanRecession, bottom], [0, housePlanRecession, top], "roof-standing-flashing-edge");
        } else {
          face(
            [
              [left, housePlanRecession + 1, bottom],
              [right, housePlanRecession + 1, bottom],
              [right, housePlanRecession + 1, top],
              [left, housePlanRecession + 1, top]
            ],
            metal,
            { class: "face roof-standing-flashing" }
          );
        }
      }
      function drawRoofEdgeDetails() {
        const start = roofLeft, end = roofRight, eave = L + F;
        const metal = "#555b5c";
        face([
          roofAt(start, eave - 35, -10),
          roofAt(end, eave - 35, -10),
          roofAt(end, eave, -10),
          roofAt(start, eave, -10)
        ], metal, { class: "face roof-eave-flashing" });
        face([
          roofAt(start, housePlanRecession, -10),
          roofAt(start + 22, housePlanRecession, -10),
          roofAt(start + 22, eave, -10),
          roofAt(start, eave, -10)
        ], metal, { class: "face roof-verge-flashing" });
        face([
          roofAt(end - 22, housePlanRecession, -10),
          roofAt(end, housePlanRecession, -10),
          roofAt(end, eave, -10),
          roofAt(end - 22, eave, -10)
        ], metal, { class: "face roof-verge-flashing" });
        drawStandingFlashing();
        for (const x of rafterStarts(roofWidth, doorSideOverhang, rafterWidth, rafterSpacing)) {
          face([
            roofAt(x, eave, -roofDepth + 10),
            roofAt(x + rafterWidth, eave, -roofDepth + 10),
            roofAt(x + rafterWidth, eave, -10),
            roofAt(x, eave, -10)
          ], "#c18a5f", { class: "face roof-rafter-tail" });
        }
        line(roofAt(start, housePlanRecession, -15), roofAt(start, eave, -15), "roof-bargeboard");
        line(roofAt(start + 25, housePlanRecession, -18), roofAt(start + 25, eave, -18), "roof-bargeboard-secondary");
        line(roofAt(end, housePlanRecession, -15), roofAt(end, eave, -15), "roof-bargeboard");
        line(roofAt(end - 25, housePlanRecession, -18), roofAt(end - 25, eave, -18), "roof-bargeboard-secondary");
        line(roofAt(start, eave, -15), roofAt(end, eave, -15), "roof-eave-fascia");
        line(roofAt(start, housePlanRecession, -20), roofAt(end, housePlanRecession, -20), "roof-underlayment-edge");
      }
      function drawPiers() {
        const pier = (points) => face(points, footingColor, { class: "face pier" });
        const ring = (x, y, z, start, turn, steps) => Array.from({ length: steps + 1 }, (_, i) => {
          const angle = start + turn * i / steps;
          return [x + pierRadius * Math.cos(angle), y + pierRadius * Math.sin(angle), z];
        });
        if (iso || plan) {
          const centres = pierColumns.flatMap((x) => pierRows.map((y) => [x, y]));
          centres.sort(([x, y], [a, b]) => y - x - (b - a));
          for (const [x, y] of centres) {
            if (plan) {
              pier(ring(x, y, slabBase, 0, 2 * Math.PI, 36));
            } else {
              const base = ring(x, y, footingBase, Math.PI / 4, Math.PI, 18);
              const top = base.map(([u, v]) => [u, v, slabBase]);
              pier([top[0], ...base, top[top.length - 1], ...top.slice(1, -1).reverse()]);
            }
          }
        } else {
          const at = front ? frontAt : sideAt(side === "left" ? 0 : W);
          for (const u of front ? pierColumns : pierRows) {
            const a = u - pierRadius, b = u + pierRadius;
            pier([at(a, footingBase), at(b, footingBase), at(b, slabBase), at(a, slabBase)]);
          }
        }
      }
      function drawHouseFacade() {
        const section2 = (u, d, z) => [u, housePlanRecession - d, z];
        const baseSection = (u, d, z) => [u, -d, z];
        const facade = { start: houseA, end: houseB, top: () => houseWallHeight };
        if (houseBaseHeight > 0) {
          face(
            [houseBaseAt(houseA, slabBase), houseBaseAt(houseB, slabBase), houseBaseAt(houseB, houseBaseTop), houseBaseAt(houseA, houseBaseTop)],
            houseBaseColor,
            { class: "face house-concrete-base" }
          );
          if (houseBaseRecession > 0) {
            face(
              [
                houseBaseAt(houseA, houseBaseTop),
                houseBaseAt(houseB, houseBaseTop),
                houseAt(houseB, houseBaseTop),
                houseAt(houseA, houseBaseTop)
              ],
              "#c5c6b8",
              { class: "face house-base-reveal" }
            );
            face(
              [
                houseBaseAt(houseA, slabBase),
                houseBaseAt(houseA, houseBaseTop),
                houseAt(houseA, houseBaseTop),
                houseAt(houseA, slabBase)
              ],
              "#b9bbb2",
              { class: "face house-base-return" }
            );
            face(
              [
                houseBaseAt(houseB, slabBase),
                houseAt(houseB, slabBase),
                houseAt(houseB, houseBaseTop),
                houseBaseAt(houseB, houseBaseTop)
              ],
              "#b9bbb2",
              { class: "face house-base-return" }
            );
          }
        }
        face(
          [houseAt(houseA, houseBaseTop), houseAt(houseB, houseBaseTop), houseAt(houseB, houseWallHeight), houseAt(houseA, houseWallHeight)],
          houseColor,
          { class: "face house-facade" }
        );
        houseCladding(
          houseAt,
          houseA,
          houseB,
          () => houseWallHeight,
          houseBaseTop,
          houseOpenings.map((w) => ({ start: w.left, end: w.right, bottom: w.sill, top: w.head }))
        );
        if (houseBaseHeight > 0) {
          for (const w of basementOpenings) {
            drawWindow(
              face,
              baseSection,
              {
                start: w.left,
                end: w.right,
                bottom: slabBase + w.sill,
                top: slabBase + w.head
              },
              facade,
              { key: w.key, pattern: "cross", thickness: 145, trim: 0, flashing: false }
            );
          }
        }
        for (const w of houseOpenings) {
          drawWindow(
            face,
            section2,
            { start: w.left, end: w.right, bottom: w.sill, top: w.head },
            facade,
            { key: w.key, pattern: "cross", thickness: 145, trim: houseTrim, trimColour: "#f5efe1" }
          );
        }
        if (front) note(houseAt(houseA, houseWallHeight), "Existing house", -9, "start");
      }
      function drawSideWallBasementJunction(which) {
        if (!sideElevation || houseBaseRecession <= 0 || houseBaseHeight <= 0 || !visible("cover") && !visible("studs")) return;
        const x = which === "left" ? 0 : W;
        const at = (y, z) => [x, y, z];
        const foundationTop = Math.min(0, houseBaseTop);
        if (foundationTop > slabBase) {
          face([
            at(0, slabBase),
            at(housePlanRecession, slabBase),
            at(housePlanRecession, foundationTop),
            at(0, foundationTop)
          ], "#8e9b92", { class: "face side-wall-basement-junction", "data-layer": "cover" });
        }
        const wallBottom = Math.max(0, slabBase);
        if (houseBaseTop > wallBottom) {
          face(
            [
              at(0, wallBottom),
              at(housePlanRecession, wallBottom),
              at(housePlanRecession, houseBaseTop),
              at(0, houseBaseTop)
            ],
            visible("cover") ? wallColour.cover : wallColour.studs,
            { class: "face side-wall-basement-junction", "data-layer": visible("cover") ? "cover" : "studs" }
          );
        }
        line(
          at(0, slabBase),
          at(0, houseBaseTop),
          "face",
          { "data-layer": "cover" }
        );
      }
      function doorTrim(at, key, op, wallLength, wallTop2) {
        const width = latest.trimWidth;
        if (!width) return;
        const start = Math.max(0, op.start - width), end = Math.min(wallLength, op.end + width);
        const high = op.top + width;
        const colour = trimColour.value;
        function board(a, b, base, top) {
          if (b <= a) return;
          const inner2 = [a, b];
          if (wallTop2(a) > top && wallTop2(b) < top) {
            inner2.splice(1, 0, a + (b - a) * (wallTop2(a) - top) / (wallTop2(a) - wallTop2(b)));
          }
          const point = (u, z) => at(u, Math.min(z, wallTop2(u)));
          if (Math.min(top, wallTop2(a)) <= base) return;
          const points = [point(a, base), point(b, base), ...inner2.reverse().map((u) => point(u, top))];
          const normal = plane(points);
          if (normal) doorTrimFaces.push({
            points,
            original: points,
            normal,
            offset: dot(normal, points[0]),
            attrs: { fill: colour, class: "face opening-trim", "data-trim": key, "data-layer": "trim" }
          });
        }
        board(start, op.start, op.bottom, op.top);
        board(op.end, end, op.bottom, op.top);
        board(start, end, op.top, high);
      }
      const wallCourses2 = (key, end) => wallCourses(key, end, claddingSpacing, baseBoardWidth, coverBoardWidth);
      function drawWall(section2, length, top, op, name) {
        const isSide = name !== "front";
        for (const [key] of [...wallLayers].reverse()) {
          if (!visible(key) || key === "trim" || key === "cavity") continue;
          const [depth] = bands[key];
          const at2 = (u, z) => section2(u, depth, z);
          if (key === "studs") {
            drawWallFrame((u, d, z) => section2(u, depth + d, z), 0, isSide ? length - T : length, top, op, name !== "door");
            continue;
          }
          const end = isSide ? length - depth : length;
          const strip = wallStrip(at2, 0, end, top, 0, [op]);
          const cladding = key === "cover" || key === "base";
          const low = cladding ? Math.max(0, slabBase + 200) : 0;
          const high = top(0);
          const paint = (a, b, l, h, fill = wallColour[key], part = "wall-layer", alpha = 1) => strip(a, b, l, h, fill, part, alpha, key);
          if (cladding || key === "counter") {
            if (key === "base") paint(0, end, 0, low, "#abb0a0", "cladding-plinth");
            const courses = wallCourses2(key, end);
            if (key === "base") {
              courses.unshift([0, claddingSpacing * 0.19]);
              courses.push([end - claddingSpacing * 0.19, end]);
            }
            for (const [a, b] of courses) {
              paint(a, b, low, high, wallColour[key], `cladding-${key}`);
              if (!cladding) continue;
              const edge = Math.min(13, (b - a) * 0.2);
              paint(a, a + edge, low, high, "hsl(var(--cladding-hue) 80% 90%)", "cladding-highlight", 0.62);
              paint(b - edge, b, low, high, "#785938", "cladding-return", 0.4);
              paint(a + (b - a) * 0.58, a + (b - a) * 0.63, low, high, "#754e2c", "cladding-grain", 0.14);
              paint(a, b, low, low + 12, "#745430", "cladding-drip", 0.5);
            }
          } else if (["nailers", "service", "serviceFill"].includes(key)) {
            const battenWidth = key === "nailers" ? 48 : 70;
            for (let z = 0; z < high; z += 600) {
              paint(0, end, z + (key === "serviceFill" ? battenWidth : 0), key === "serviceFill" ? z + 600 : z + battenWidth);
            }
          } else {
            paint(0, end, 0, high);
            if (key === "wind" || key === "osb" || key === "gypsum") {
              for (let u = 1200; u < end; u += 1200) paint(u, u + 7, 0, high, "#394735", "sheet-joint", 0.3);
            }
          }
        }
        if (!visible("studs") && visible("cavity")) {
          drawWallFrame((u, d, z) => section2(u, bands.studs[0] + d, z), 0, isSide ? length - T : length, top, op, name !== "door");
        }
        const at = (u, z) => section2(u, 0, z);
        if (name === "door") {
          if (visible("trim")) doorTrim(at, name, op, length, top);
          face(
            [at(op.start, 0), at(op.end, 0), at(op.end, op.top), at(op.start, op.top)],
            "none",
            { class: "face door-opening" }
          );
        } else {
          if (timberOnly) {
            face(
              [at(op.start, op.bottom), at(op.end, op.bottom), at(op.end, op.top), at(op.start, op.top)],
              "none",
              { class: "face opening-guide window-opening" }
            );
          } else {
            drawWindow(face, section2, op, { start: 0, end: length, top }, {
              key: name,
              pattern: windowMuntins[name].value,
              thickness: T,
              trim: visible("trim") ? latest.trimWidth : 0,
              trimColour: trimColour.value
            });
          }
        }
      }
      function planWall(at, end, opening, keyForTrim) {
        const isDoor = keyForTrim === "door";
        const spans = [[0, opening.start], [opening.end, end]];
        const posts = wallPosts2(0, end, opening);
        function part(key, a, b, d, e) {
          for (const [start, finish2] of spans) {
            const lo = Math.max(a, start), hi = Math.min(b, finish2);
            if (hi > lo) face(
              [at(lo, d), at(hi, d), at(hi, e), at(lo, e)],
              wallColour[key],
              { class: "cladding-facet wall-plan", "data-layer": key }
            );
          }
        }
        for (const [key] of wallLayers) {
          if (!visible(key) || key === "trim") continue;
          const [d, e] = bands[key];
          if (key === "cover" || key === "base" || key === "counter") {
            for (const [a, b] of wallCourses2(key, end)) part(key, a, b, d, e);
          } else if (key === "studs") {
            for (const [a, b] of posts) part(key, a, b, d, e);
          } else if (key === "cavity") {
            let a = 0;
            for (const [b, c] of posts) {
              part(key, a, b, d, e);
              a = c;
            }
            part(key, a, end, d, e);
          } else {
            const middle = (d + e) / 2;
            part(
              key,
              0,
              end,
              key === "serviceFill" && visible("service") ? middle : d,
              key === "service" && visible("serviceFill") ? middle : e
            );
          }
        }
        if (visible("trim")) {
          const width = latest.trimWidth;
          for (const [edge, dir] of [[opening.start, -1], [opening.end, 1]]) {
            const u = Math.max(0, Math.min(end, edge + dir * width));
            if (u !== edge) line(
              at(edge, 0),
              at(u, 0),
              "opening-trim",
              { "data-layer": "trim", stroke: trimColour.value, "stroke-width": 2.5 }
            );
          }
        }
        if (isDoor || timberOnly) {
          line(
            at(opening.start, T / 2),
            at(opening.end, T / 2),
            isDoor ? "door-opening" : "window-opening",
            { style: "stroke:#9a693c;stroke-width:1.7;stroke-dasharray:4 4" }
          );
          return;
        }
        const { gap, setBack, jamb, rim, glassDepth } = windowProfile(opening, T);
        const l = opening.start + gap, r = opening.end - gap;
        const partWindow = (a, b, d, e, fill, part2) => face(
          [at(a, d), at(b, d), at(b, e), at(a, e)],
          fill,
          { class: `window-detail window-${part2}`, "data-window": keyForTrim, "data-window-part": part2 }
        );
        partWindow(l, l + rim, setBack, setBack + jamb, "#ecebe0", "frame");
        partWindow(r - rim, r, setBack, setBack + jamb, "#ecebe0", "frame");
        partWindow(l + rim, r - rim, setBack, glassDepth, glassColor, "glass");
        const extension = sillExtension(opening.end - opening.start);
        partWindow(Math.max(0, opening.start - extension), Math.min(end, opening.end + extension), -sillProjection, 0, "#aebec1", "sill");
      }
      function drawHedge() {
        const points = (profile) => profile.map(([offset2, height]) => [0, topHedgeCentre + offset2 * hedgeHalfDepth, slabBase + hedgeHeight * height]);
        face(points([
          [-1, 0],
          [-1, 0.89],
          [-0.97, 0.95],
          [-0.88, 0.98],
          [-0.62, 0.99],
          [-0.4, 0.98],
          [-0.2, 1],
          [0.18, 1],
          [0.42, 0.98],
          [0.68, 0.99],
          [0.89, 0.97],
          [0.97, 0.94],
          [1, 0.88],
          [1, 0]
        ]), "#617c4d", { class: "face hedge-bush" });
        face(points([
          [-0.83, 0.77],
          [-0.7, 0.89],
          [-0.38, 0.93],
          [-0.08, 0.91],
          [0.22, 0.95],
          [0.62, 0.92],
          [0.83, 0.77],
          [0.48, 0.8],
          [0.13, 0.77],
          [-0.22, 0.81],
          [-0.52, 0.75]
        ]), "#789363", { class: "hedge-highlight" });
      }
      function drawHedgePlanting() {
        const plantScale = 1.2;
        const plant = (centre2, profile, colour, kind) => face(
          profile.map(([offset2, height]) => [0, topHedgeCentre - hedgeHalfDepth - centre2 + offset2 * plantScale, slabBase + height * plantScale]),
          colour,
          { class: `hedge-plant ${kind}` }
        );
        for (const [centre2, size] of [[200, 0.85], [460, 1]]) {
          for (const [reach, height, colour] of [
            [-170, 176, "#416c45"],
            [-112, 267, "#518052"],
            [-32, 310, "#648d52"],
            [84, 260, "#527949"],
            [162, 192, "#3f6840"]
          ]) {
            plant(centre2, [
              [0, 0],
              [reach * 0.18 - 10, height * 0.49],
              [reach * 0.45 - 19, height * 0.72],
              [reach * 0.6 - 16, height * 0.91],
              [reach, height],
              [reach * 0.78 + 15, height * 0.79],
              [reach * 0.52 + 18, height * 0.62],
              [reach * 0.27 + 10, height * 0.33]
            ].map(([x, z]) => [x * size, z * size]), colour, "fern-frond");
          }
        }
        for (const [centre2, height, colour] of [
          [70, 156, "#e1bd60"],
          [110, 205, "#c484ad"],
          [310, 170, "#e1bd60"],
          [365, 145, "#b586b8"],
          [550, 196, "#c484ad"]
        ]) {
          plant(centre2, [[0, 0], [-4, height], [4, height], [7, 0]], "#496c40", "flower-stem");
          plant(centre2, [[2, height * 0.32], [34, height * 0.55], [18, height * 0.34]], "#5d894e", "flower-leaf");
          plant(centre2, Array.from({ length: 20 }, (_, i) => {
            const angle = 2 * Math.PI * i / 20;
            const radius = i % 4 === 2 ? 14 : 32;
            return [radius * Math.cos(angle), height + radius * Math.sin(angle)];
          }), colour, "flower-bloom");
        }
      }
      if (!groundHidden) {
        if (iso || plan) {
          face(grade, "#a8c987", { class: "ground-plane" });
          face(roofFootprint, "#94b575", { class: "roof-ground-projection" });
          if (iso) propertyLine([roofLeft - gradeMargin, propertyY, slabBase], [roofRight + gradeMargin, propertyY, slabBase]);
        } else {
          if (front) line(frontAt(frontGradeLeft, slabBase), frontAt(frontGradeRight, slabBase), "ground-line");
          else line([0, 0, slabBase], [0, sideGradeEnd, slabBase], "ground-line");
          line(roofFootprint[0], roofFootprint[front ? 1 : 3], "roof-ground-projection-edge");
        }
      }
      function orderScene(start) {
        if (!iso) return;
        const polygons = shapes.splice(start).flatMap(([, points, attrs]) => {
          const normal = plane(points);
          return normal ? [{ points, original: points, attrs, normal, offset: dot(normal, points[0]) }] : [];
        });
        const ordered = [];
        orderFraming(polygons, ordered);
        for (const { points, original, attrs } of ordered) shapes.push(["polygon", points, attrs, original]);
      }
      if (plan) {
        face(
          [
            ground(roofLeft - gradeMargin, topHedgeCentre - hedgeHalfDepth),
            ground(roofRight + gradeMargin, topHedgeCentre - hedgeHalfDepth),
            ground(roofRight + gradeMargin, topHedgeCentre + hedgeHalfDepth),
            ground(roofLeft - gradeMargin, topHedgeCentre + hedgeHalfDepth)
          ],
          "#617c4d",
          { class: "face hedge-plan" }
        );
        const planA = Math.max(houseA, -1e3), planB = Math.min(houseB, W + 1e3);
        const houseFace = housePlanRecession;
        const entryCentre = houseEntryOffset - slabOriginOffset;
        const entryLeft = entryCentre - houseEntryWidth / 2, entryRight = entryCentre + houseEntryWidth / 2;
        const entryVisible = entryRight > planA && entryLeft < planB && planA < planB;
        const wallSpans = entryVisible ? [[planA, Math.min(planB, entryLeft)], [Math.max(planA, entryRight), planB]] : [[planA, planB]];
        face(slab, "#f8f6e8", { class: "slab-plan" });
        for (const [a, b] of [[ground(0, 0), ground(0, L)], [ground(0, L), ground(W, L)], [ground(W, L), ground(W, 0)]]) {
          line(a, b, "slab-plan-edge");
        }
        const rearSpans = entryVisible ? [[0, Math.max(0, Math.min(W, entryLeft))], [Math.max(0, Math.min(W, entryRight)), W]] : [[0, W]];
        for (const [start, end] of rearSpans) {
          if (start < end) line(ground(start, 0), ground(end, 0), "slab-plan-edge", { "data-edge": "rear" });
        }
        for (const [start, end] of wallSpans) {
          if (start < end) face([
            ground(start, -T),
            ground(end, -T),
            ground(end, houseFace),
            ground(start, houseFace)
          ], houseColor, { class: "face house-plan" });
        }
        for (const [kind, inner2, outer2, colour] of [
          ["base", houseCoverBoardThickness, houseCoverBoardThickness + houseBaseBoardThickness, "hsl(var(--cladding-hue) 65% 82%)"],
          ["cover", 0, houseCoverBoardThickness, "hsl(var(--cladding-hue) 75% 91%)"]
        ]) {
          for (const [a, b] of wallCourses(kind, houseB - houseA, claddingSpacing, houseBaseBoardWidth, houseCoverBoardWidth)) {
            for (const [start, end] of wallSpans) {
              const left = Math.max(start, houseA + a), right = Math.min(end, houseA + b);
              if (left < right) face(
                [
                  ground(left, houseFace - inner2),
                  ground(right, houseFace - inner2),
                  ground(right, houseFace - outer2),
                  ground(left, houseFace - outer2)
                ],
                colour,
                { class: "house-cladding-plan", "data-house-layer": kind }
              );
            }
          }
        }
        if (entryVisible) {
          const back = houseFace - houseEntryDepth, treadDepth = 250, stairEnd = back - 2 * treadDepth;
          face(
            [ground(entryLeft, houseFace), ground(entryRight, houseFace), ground(entryRight, back), ground(entryLeft, back)],
            "#cbd1ce",
            { class: "house-entry-floor" }
          );
          for (const [left, right, direction] of [[entryLeft, entryCentre, "up"], [entryCentre, entryRight, "down"]]) {
            face(
              [ground(left, back), ground(right, back), ground(right, stairEnd), ground(left, stairEnd)],
              direction === "up" ? "#e4ba89" : "#d9ab76",
              { class: "face house-entry-stair", "data-direction": direction }
            );
            line(ground(left, back - treadDepth), ground(right, back - treadDepth), "house-entry-tread");
          }
          line(ground(entryLeft, houseFace), ground(entryLeft, back), "house-entry-wall");
          line(ground(entryRight, houseFace), ground(entryRight, back), "house-entry-wall");
        }
        if (groundHidden) drawPiers();
        if (groundHidden && (roofTiles || roofFraming)) face(roof, "none", { style: `stroke:${roofPaint}`, "stroke-dasharray": "7 5" });
        planWall((u, d) => ground(d, u), L - T, door, "door");
        planWall((u, d) => ground(W - d, u), L - T, windows.right, "right");
        planWall((u, d) => ground(u, L - d), W, windows.front, "front");
        drawEntryStep();
        if (roofFraming) drawRafters();
        shapes.push(["door-leaf", []]);
        if (planA < planB && !entryVisible) note(ground((planA + planB) / 2, (houseFace - T) / 2), "Existing house", -7);
      } else {
        if (iso || front) drawHouseFacade();
        if (groundHidden) drawPiers();
        const wallScene = shapes.length;
        if (iso) {
          face(slab, "#e1e6de");
          drawWall(sideSection("right"), L, wallTop, windows.right, "right");
        }
        if (iso || front) {
          foundation(frontAt, W, "#aab4aa");
          drawWall(frontSection, W, frontTop, windows.front, "front");
          if (front) {
            const baseline = groundHidden && pierColumns.length ? footingBase : slabBase;
            dimension2(frontAt(0, baseline), frontAt(W, baseline), [0, 38], mm2(W));
          }
        }
        if (iso || !front) {
          if (!iso) {
            if (houseBaseHeight > 0) {
              line(
                [0, 0, slabBase],
                [0, 0, houseBaseTop],
                "house-concrete-base",
                { stroke: houseBaseColor, "stroke-width": 2.5 }
              );
              if (houseBaseRecession > 0) {
                line(
                  [0, 0, slabBase],
                  [0, housePlanRecession, slabBase],
                  "house-concrete-base",
                  { stroke: houseBaseColor, "stroke-width": 2.5 }
                );
                line(
                  [0, 0, houseBaseTop],
                  [0, housePlanRecession, houseBaseTop],
                  "house-base-reveal",
                  { stroke: "#858b81", "stroke-width": 1.7 }
                );
              }
            }
            line(
              [0, housePlanRecession, houseBaseTop],
              [0, housePlanRecession, houseWallHeight],
              "face",
              { style: "stroke:#778a7b;stroke-width:1.7;stroke-dasharray:5 4" }
            );
            note([0, housePlanRecession, houseWallHeight], "Existing house", -9);
          }
          foundation(sideAt(side === "right" ? W : 0), L, "#8e9b92");
          drawWall(sideSection(side), L, wallTop, side === "left" ? door : windows.right, side === "left" ? "door" : "right");
        }
        if (sideElevation) drawSideWallBasementJunction(side);
        orderScene(wallScene);
        drawEntryStep();
        if (doorVisible) shapes.push(["door-leaf", []]);
        if (roofFraming) {
          const rafters = shapes.length;
          drawRafters();
          orderScene(rafters);
        } else if (roofTiles && (iso || front)) {
          if (iso) face([roof[0], roof[3], [roofLeft, L + F, E], [roofLeft, housePlanRecession, R]], material === "tiles" ? tileEdgeTones[0] : roofPaint);
          face(roof, roofPaint, { class: "face roof-covering" });
          face([roof[2], roof[3], [roofLeft, L + F, E], [roofRight, L + F, E]], material === "tiles" ? tileEdgeTones[0] : roofPaint);
          drawRoofCovering();
          drawRoofEdgeDetails();
        }
        if (!iso && !front) {
          if (roofTiles) {
            face([[0, housePlanRecession, R], [0, L + F, E], [0, L + F, E + roofDepth], [0, housePlanRecession, R + roofDepth]], roofPaint);
            drawRoofCovering();
            drawRoofEdgeDetails();
          }
        }
        if (roofTiles) drawGutter();
        if (sideElevation) {
          drawHedge();
          drawHedgePlanting();
        }
        if (front) dimension2(frontAt(0, 0), frontAt(0, H), [-43, 0], mm2(H));
      }
      if (sideElevation) {
        propertyLine([0, propertyY, slabBase], [0, propertyY, slabBase + Math.max(2e3, hedgeHeight + 250)]);
      } else if (front || plan && !groundHidden) {
        propertyLine([roofLeft - gradeMargin, propertyY, slabBase], [roofRight + gradeMargin, propertyY, slabBase]);
      }
      const bounds = [...shapes.flatMap(([, points]) => points), ...roof];
      if (iso || plan) bounds.push(...grade);
      else if (front) bounds.push(frontAt(frontGradeLeft, slabBase), frontAt(frontGradeRight, slabBase));
      else bounds.push([0, sideGradeEnd, slabBase]);
      if (!plan && pierColumns.length) bounds.push([0, 0, footingBase], [W, L, footingBase], [0, L, footingBase]);
      if (doorVisible) {
        for (let i = 0; i <= 24; i++) {
          for (const distance of [0, doorWidth]) for (const depth of [0, doorThickness]) {
            for (const height of [0, doorHeight]) bounds.push(doorPoint(i * Math.PI / 48, distance, depth, height));
          }
        }
      }
      const unscaled = bounds.map(raw);
      const xs = unscaled.map(([x]) => x), ys = unscaled.map(([, y]) => y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const scale = Math.min(620 / Math.max(1, maxX - minX), 375 / Math.max(1, maxY - minY));
      const project = (point) => {
        const [x, y] = raw(point);
        return [410 + (x - (minX + maxX) / 2) * scale, 246 + (y - (minY + maxY) / 2) * scale];
      };
      const ns = "http://www.w3.org/2000/svg";
      const group = document.createDocumentFragment();
      const layer = document.createElementNS(ns, "g");
      layer.setAttribute("class", "drawing-layer");
      function node(tag, attrs, text, parent = layer) {
        const el = document.createElementNS(ns, tag);
        for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
        if (text !== void 0) el.textContent = text;
        parent.append(el);
        return el;
      }
      function stroke(a, b, attrs, parent = layer) {
        node("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], ...attrs }, void 0, parent);
      }
      function measurementSpecs(section2) {
        const m = (key, label, a, b, visible2 = true, value = latest[key], gap = [0, -12]) => ({ key, label, a, b, visible: visible2, value, gap, vertical: a[2] !== b[2] && a[0] === b[0] && a[1] === b[1] });
        const left = view === "left", right = view === "right";
        const onFacade = iso || front;
        const x = pierColumns[0], y = pierRows[pierRows.length - 1];
        switch (section2) {
          case "slab":
            return [
              m("width", "Slab width", [0, L, 0], [W, L, 0], iso || front || plan, W, [0, 16]),
              m("length", "Slab length", [0, 0, 0], [0, L, 0], !front, L, plan ? [-15, 0] : [0, 28]),
              m("slabThickness", "Slab thickness", [0, L, slabBase], [0, L, 0], !plan, slabThickness, [-16, 0])
            ];
          case "footings":
            return !pierColumns.length ? [] : [
              m(
                "footingDiameter",
                "Pier diameter",
                front || plan ? [x - pierRadius, y, slabBase] : [x, y - pierRadius, slabBase],
                front || plan ? [x + pierRadius, y, slabBase] : [x, y + pierRadius, slabBase],
                groundHidden
              ),
              m("footingDepth", "Pier depth", [x, y, footingBase], [x, y, slabBase], groundHidden && !plan, footingDepth, [-12, 0])
            ];
          case "door":
            return [
              m("doorWidth", "Door width", [0, door.start, 0], [0, door.end, 0], doorVisible),
              m("doorHeight", "Door height", [0, door.start, 0], [0, door.start, door.top], iso || left, doorHeight, [-14, 0]),
              m("doorThickness", "Leaf thickness", [0, hingeY, door.top], [doorThickness, hingeY, door.top], plan || iso, doorThickness),
              m("offset", "Offset from house", [0, housePlanRecession, 0], [0, door.start, 0], doorVisible, offset, [0, 12]),
              m(
                "trimWidth",
                "Trim width",
                [0, door.start - latest.trimWidth, door.top / 2],
                [0, door.start, door.top / 2],
                visible("trim") && (iso || left) && latest.trimWidth <= door.start
              )
            ];
          case "front":
          case "right": {
            const w = windows[section2], isFront = section2 === "front";
            const at = isFront ? frontAt : sideAt(W);
            const usable = isFront ? onFacade : right;
            return [
              m(section2 + "Width", "Window width", at(w.start, w.top), at(w.end, w.top), usable || plan),
              m(section2 + "Height", "Window height", at(w.start, w.bottom), at(w.start, w.top), usable, void 0, [-14, 0]),
              m(section2 + "Bottom", "Bottom clearance", at(w.end, 0), at(w.end, w.bottom), usable, w.bottom, [12, 0]),
              m(section2 + "Left", "Left clearance", at(isFront ? T : L - T, w.bottom), at(isFront ? w.start : w.end, w.bottom), usable || plan, latest[section2 + "Left"], [0, 12]),
              m(
                "trimWidth",
                "Trim width",
                at(w.start - latest.trimWidth, (w.bottom + w.top) / 2),
                at(w.start, (w.bottom + w.top) / 2),
                visible("trim") && usable && latest.trimWidth <= w.start
              )
            ];
          }
          case "trims":
            return measurementSpecs(left ? "door" : right ? "right" : "front").filter((spec) => spec.key === "trimWidth");
          case "walls": {
            const seam = houseA + claddingSpacing;
            const guideZ = houseBaseTop + (houseWallHeight - houseBaseTop) * 0.85;
            return [
              m("wallThickness", "Wall thickness", [0, L / 2, 0], [T, L / 2, 0], plan),
              m(
                "claddingSpacing",
                "Cover-board spacing",
                houseAt(seam, guideZ),
                houseAt(seam + claddingSpacing, guideZ),
                onFacade && seam + claddingSpacing < houseB
              ),
              m("frontWallHeight", "Front wall height", [0, L, 0], [0, L, H], !plan, H, [-25, 0])
            ];
          }
          case "studs": {
            const w = windows.front;
            const posts = wallPosts2(0, W, w).filter(([a, b]) => a < w.start || b > w.end);
            const pair = posts.findIndex(([a, b], i) => i > 0 && Math.abs((a + b - posts[i - 1][0] - posts[i - 1][1]) / 2 - studSpacing) < 1e-3);
            const centre2 = ([a, b]) => (a + b) / 2;
            const p = posts[0] || [0, studWidth], z = H * 0.4;
            const exposed = visible("studs") && (plan || onFacade && !["cover", "base", "wind", "exterior"].some(visible));
            const at = (u, z2) => frontSection(u, bands.studs[0], z2);
            return [
              m(
                "studSpacing",
                "Stud centres",
                at(pair > 0 ? centre2(posts[pair - 1]) : 0, z),
                at(pair > 0 ? centre2(posts[pair]) : studSpacing, z),
                exposed && pair > 0
              ),
              m("studWidth", "Stud width", at(p[0], z), at(p[1], z), exposed && p[1] - p[0] === studWidth),
              m("studDepth", "Stud depth", at(p[0], z), frontSection(p[0], bands.studs[1], z), exposed && !front)
            ];
          }
          case "roof":
            return [
              { key: "pitch", label: "Roof pitch", value: pitch, angle: true },
              m("frontOverhang", "Front overhang", [0, L, E + roofDepth], [0, L + F, E + roofDepth], !front),
              m("roofWidth", "Total roof width", [roofLeft, L, E + roofDepth], [roofRight, L, E + roofDepth], onFacade || plan),
              m("doorSideOverhang", "Door-side overhang", [0, L, E + roofDepth], [roofLeft, L, E + roofDepth], onFacade || plan),
              m("rightOverhang", "Opposite overhang", [W, L, E + roofDepth], [roofRight, L, E + roofDepth], onFacade || plan, rightOverhang),
              m(
                "flashingHeight",
                "Standing flashing height",
                [roofLeft, housePlanRecession, flashing.bottom],
                [roofLeft, housePlanRecession, flashing.top],
                roofTiles && !plan,
                latest.flashingHeight,
                [-12, 0]
              )
            ];
          case "roofTiles": {
            const y2 = L + F, x2 = roofLeft, z = E + roofDepth;
            return [
              m("tileWidth", "Tile covering width", [x2, y2, z], [x2 + tileWidth, y2, z], roofTiles && material === "tiles" && onFacade && tileWidth <= roofWidth),
              m("tileLength", "Exposed tile length", [x2, y2, z], [x2, y2 - tileRun, z + slope * tileRun], roofTiles && material === "tiles" && (iso || left || right) && tileRun <= y2 - housePlanRecession),
              m(
                "tileRise",
                "Profile rise",
                [x2 + tileWidth / (2 * tileSystems[tileWidth].waves), y2, z],
                [x2 + tileWidth / (2 * tileSystems[tileWidth].waves), y2, z + tileRise],
                roofTiles && material === "tiles" && !plan && tileWidth / 2 <= roofWidth,
                tileRise,
                [8, 0]
              )
            ];
          }
          case "rafters": {
            const c = roofLeft + rafterWidth / 2, z = E + roofDepth;
            const visible2 = roofFraming && (onFacade || plan);
            const perpendicular = rafterDepth / Math.hypot(1, slope);
            const startY = (housePlanRecession + L + F) / 2, startZ = wallTop(startY);
            return [
              m(
                "rafterSpacing",
                "Rafter centres",
                [c, L + F, z],
                [c + rafterSpacing, L + F, z],
                visible2 && roofLeft + rafterSpacing + rafterWidth <= roofRight - rafterWidth
              ),
              m("rafterWidth", "Rafter width", [roofLeft, L + F, z], [roofLeft + rafterWidth, L + F, z], visible2),
              m(
                "rafterDepth",
                "Rafter depth",
                [roofLeft, startY, startZ],
                [roofLeft, startY + slope * perpendicular, startZ + perpendicular],
                roofFraming && (left || right),
                rafterDepth
              )
            ];
          }
          case "housePosition": {
            const first = houseOpenings.find((w) => w.key === "houseLeft");
            const second = houseOpenings.find((w) => w.key === "houseRight");
            return [
              m(
                "slabOriginOffset",
                "Origin to slab left edge",
                houseAt(first.left, slabBase),
                houseAt(0, slabBase),
                onFacade,
                slabOriginOffset,
                [0, 20]
              ),
              m(
                "houseWindowGap",
                "Gap between main windows",
                houseAt(first.right, first.sill),
                houseAt(second.left, first.sill),
                onFacade,
                latest.houseWindowGap,
                [0, 13]
              )
            ];
          }
          case "houseWall":
            return [
              m(
                "houseWallLeft",
                "Wall left edge from origin",
                houseAt(-slabOriginOffset, slabBase),
                houseAt(houseA, slabBase),
                onFacade,
                latest.houseWallLeft,
                [0, 20]
              ),
              m("houseWallWidth", "House wall width", houseAt(houseA, houseWallHeight), houseAt(houseB, houseWallHeight), onFacade),
              m("houseWallHeight", "House wall height", houseAt(houseB, slabBase), houseAt(houseB, houseWallHeight), onFacade, houseHeightAboveGround, [15, 0]),
              m(
                "houseBaseHeight",
                "Concrete base height",
                houseBaseAt(houseA, slabBase),
                houseBaseAt(houseA, houseBaseTop),
                onFacade,
                houseBaseHeight,
                [-15, 0]
              ),
              m(
                "houseBaseBoardWidth",
                "House base-board width",
                houseAt(houseA + claddingSpacing / 2 - houseBaseBoardWidth / 2, houseBaseTop),
                houseAt(houseA + claddingSpacing / 2 + houseBaseBoardWidth / 2, houseBaseTop),
                onFacade
              ),
              m(
                "houseCoverBoardWidth",
                "House cover-board width",
                houseAt(houseA + claddingSpacing - houseCoverBoardWidth / 2, houseBaseTop),
                houseAt(houseA + claddingSpacing + houseCoverBoardWidth / 2, houseBaseTop),
                onFacade
              ),
              m(
                "houseBaseBoardThickness",
                "House base-board thickness",
                ground(houseA + claddingSpacing / 2, housePlanRecession - houseCoverBoardThickness - houseBaseBoardThickness),
                ground(houseA + claddingSpacing / 2, housePlanRecession - houseCoverBoardThickness),
                plan
              ),
              m(
                "houseCoverBoardThickness",
                "House cover-board thickness",
                ground(houseA + claddingSpacing, housePlanRecession - houseCoverBoardThickness),
                ground(houseA + claddingSpacing, housePlanRecession),
                plan
              )
            ];
          case "houseEntry": {
            const centre2 = houseEntryOffset - slabOriginOffset;
            const left2 = centre2 - houseEntryWidth / 2, right2 = centre2 + houseEntryWidth / 2;
            const face2 = housePlanRecession;
            return [
              m("houseEntryWidth", "Entry width", ground(left2, face2 - houseEntryDepth), ground(right2, face2 - houseEntryDepth), plan),
              m("houseEntryDepth", "Entry depth", ground(left2, face2), ground(left2, face2 - houseEntryDepth), plan, houseEntryDepth, [-15, 0]),
              m("houseEntryOffset", "Entry centre from origin", ground(-slabOriginOffset, face2), ground(centre2, face2), plan)
            ];
          }
          case "hedge":
            return [
              m(
                "hedgeDistance",
                "Distance from house",
                [0, housePlanRecession, slabBase],
                [0, topHedgeCentre, slabBase],
                sideElevation || plan,
                hedgeDistance,
                plan ? [-15, 0] : [0, 17]
              ),
              m(
                "hedgeHeight",
                "Hedge height",
                [0, topHedgeCentre, slabBase],
                [0, topHedgeCentre, slabBase + hedgeHeight],
                sideElevation,
                hedgeHeight,
                side === "left" ? [20, 0] : [-20, 0]
              )
            ];
          case "propertyLine":
            return [
              m(
                "propertyLineDistance",
                "Property line from house",
                [0, housePlanRecession, slabBase],
                [0, propertyY, slabBase],
                sideElevation || plan,
                propertyLineDistance,
                plan ? [-15, 0] : [0, 17]
              )
            ];
          default: {
            const basement = basementOpenings.find((w2) => w2.key === section2);
            if (basement) {
              const centre2 = (basement.left + basement.right) / 2;
              const sill = slabBase + basement.sill, head = slabBase + basement.head;
              return [
                m(section2 + "Width", "Window width", houseBaseAt(basement.left, head), houseBaseAt(basement.right, head), onFacade),
                m(section2 + "Height", "Window height", houseBaseAt(basement.left, sill), houseBaseAt(basement.left, head), onFacade, void 0, [-12, 0]),
                m(section2 + "Offset", "Centre from origin", houseBaseAt(-slabOriginOffset, sill), houseBaseAt(centre2, sill), onFacade, void 0, [0, 13]),
                m(section2 + "Sill", "Sill height", houseBaseAt(basement.right, slabBase), houseBaseAt(basement.right, sill), onFacade, void 0, [13, 0])
              ];
            }
            const w = houseOpenings.find((w2) => w2.key === section2);
            if (!w) return [];
            const c = (w.left + w.right) / 2;
            return [
              m(section2 + "Width", "Window width", houseAt(w.left, w.head), houseAt(w.right, w.head), onFacade),
              m(section2 + "Height", "Window height", houseAt(w.left, w.sill), houseAt(w.left, w.head), onFacade, void 0, [-12, 0]),
              ...fields[section2 + "Offset"] ? [m(
                section2 + "Offset",
                "Centre from origin",
                houseAt(-slabOriginOffset, w.sill),
                houseAt(c, w.sill),
                onFacade,
                void 0,
                [0, 13]
              )] : [],
              m(section2 + "Sill", "Sill height", houseAt(w.right, slabBase), houseAt(w.right, w.sill), onFacade, void 0, [13, 0])
            ];
          }
        }
      }
      function drawMeasurements() {
        svg.querySelector(".measurement-guides")?.remove();
        if (!guideTimer) return;
        const specs = measurementSpecs(guideSection).filter((spec) => !guideField || spec.key === guideField);
        if (!specs.length) return;
        const overlay = node("g", { class: "measurement-guides", "aria-hidden": "true" }, void 0, svg);
        const guide = (tag, attrs, text) => node(tag, attrs, text, overlay);
        function arrow([x, y], [u, v]) {
          const n2 = Math.hypot(u - x, v - y);
          const dx = (u - x) / n2, dy = (v - y) / n2;
          const tip = (a, b, dir) => `M${a + dx * dir * 5 - dy * 3},${b + dy * dir * 5 + dx * 3} L${a},${b} L${a + dx * dir * 5 + dy * 3},${b + dy * dir * 5 - dx * 3}`;
          guide("path", { class: "guide-arrow", d: `M${x},${y} L${u},${v} ${tip(x, y, 1)} ${tip(u, v, -1)}` });
        }
        function badge(x, y, i) {
          guide("circle", { cx: x, cy: y, r: 8, fill: "#8a3520" });
          guide("text", { x, y, class: "guide-number" }, i + 1);
        }
        const rows = specs.map((spec, i) => {
          if (!spec.visible) return { spec, i, inset: true };
          const zoomPoint = ([x, y]) => [x * zoom + zoomX, y * zoom + zoomY];
          const a = zoomPoint(project(spec.a)), b = zoomPoint(project(spec.b));
          const p = a.map((v, j) => v + spec.gap[j]), q = b.map((v, j) => v + spec.gap[j]);
          const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
          if (d < 17 || [p, q].some(([x, y]) => x < 12 || x > 808 || y < 12 || y > 513)) return { spec, i, inset: true };
          guide("path", { class: "guide-arrow", opacity: ".45", d: `M${a.join(",")} L${p.join(",")} M${b.join(",")} L${q.join(",")}` });
          arrow(p, q);
          badge((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, i);
          return { spec, i, inset: false };
        });
        guide("rect", { x: 12, y: 12, width: 222, height: 32 + rows.length * 24, rx: 8, fill: "#fff8eb", stroke: "#c3917b" });
        guide("text", { x: 25, y: 33, class: "guide-key guide-title" }, rows.some((row) => row.inset) ? "Measurements \xB7 inset as needed" : "Measurements");
        rows.forEach(({ spec, i, inset }) => {
          const y = 53 + i * 24;
          if (!inset) badge(30, y - 4, i);
          else if (spec.angle) {
            guide("path", { class: "guide-arrow", d: `M18,${y + 4} H47 M18,${y + 4} L44,${y - 11} M31,${y + 4} A13,13 0 0 0 29,${y - 3}` });
          } else if (spec.value === 0) {
            guide("circle", { cx: 32, cy: y - 4, r: 3, fill: "#8a3520" });
          } else if (spec.vertical || spec.key === "rafterDepth") arrow([32, y - 12], [32, y + 4]);
          else arrow([20, y - 4], [44, y - 4]);
          guide("text", { x: 54, y, class: "guide-key" }, `${spec.label}: ${spec.angle ? `${fmt(spec.value)}\xB0` : mm2(spec.value)}`);
        });
      }
      function drawDoorLeaf() {
        if (plan) {
          const path = swingArc.map((p, i) => `${i ? "L" : "M"}${project(p).join(",")}`).join(" ");
          node("path", { d: path, fill: "none", stroke: "#9a693c", "stroke-dasharray": "4 4" });
        }
        const leaf = node("g", {
          class: "door-leaf",
          opacity: timberOnly && !plan ? ".5" : "1",
          "data-thickness": doorThickness,
          "data-door-window": doorWindow.value
        });
        const w = doorWidth, h = doorHeight, d = doorThickness;
        const surfaces = [
          { name: "outer", normal: [0, -1, 0], points: [[0, 0, 0], [w, 0, 0], [w, 0, h], [0, 0, h]], colour: "#f5ead7", depth: 0 },
          { name: "inner", normal: [0, 1, 0], points: [[0, d, 0], [w, d, 0], [w, d, h], [0, d, h]], colour: "#e7d8bd", depth: d },
          { name: "hinge", normal: [-1, 0, 0], points: [[0, 0, 0], [0, d, 0], [0, d, h], [0, 0, h]], colour: "#365b4b" },
          { name: "latch", normal: [1, 0, 0], points: [[w, 0, 0], [w, d, 0], [w, d, h], [w, 0, h]], colour: "#294c3d" },
          { name: "top", normal: [0, 0, 1], points: [[0, 0, h], [w, 0, h], [w, d, h], [0, d, h]], colour: "#64816d" },
          { name: "bottom", normal: [0, 0, -1], points: [[0, 0, 0], [w, 0, 0], [w, d, 0], [0, d, 0]], colour: "#294c3d" }
        ];
        const inset = Math.min(42, w * 0.15, h * 0.12);
        for (const surface of surfaces) {
          const polygon = (points, fill, part) => ({
            points,
            attrs: {
              fill,
              class: "face",
              "vector-effect": "non-scaling-stroke",
              "data-door-face": surface.name,
              ...part && { "data-door-part": part }
            }
          });
          surface.parts = [polygon(surface.points, surface.colour)];
          if (surface.depth === void 0) continue;
          const rect = (a, b, low, high, fill, part) => polygon([
            [a, surface.depth, low],
            [b, surface.depth, low],
            [b, surface.depth, high],
            [a, surface.depth, high]
          ], fill, part);
          surface.parts.push(rect(inset, w - inset, inset, h - inset, "#3d6052"));
          const rim = 22;
          if (doorWindow.value === "half-circle") {
            const centre2 = w / 2, radius = w * 0.3, base = h * 0.85 - radius;
            const arch = (r, apron = 0) => [
              ...Array.from({ length: 25 }, (_, i) => [
                centre2 + r * Math.cos(i * Math.PI / 24),
                surface.depth,
                base + r * Math.sin(i * Math.PI / 24)
              ]),
              ...apron ? [[centre2 - r, surface.depth, base - apron], [centre2 + r, surface.depth, base - apron]] : []
            ];
            surface.parts.push(
              polygon(arch(radius + rim, rim), surface.colour, "glazing-frame"),
              polygon(arch(radius), glassColor, "glass")
            );
            const half = 6, reach = Math.sqrt(radius * radius - half * half);
            for (const angle of [Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4]) {
              const sin = Math.sin(angle), cos = Math.cos(angle);
              surface.parts.push(polygon([
                [centre2 - half / sin, surface.depth, base],
                [centre2 + half / sin, surface.depth, base],
                [centre2 + cos * reach + sin * half, surface.depth, base + sin * reach - cos * half],
                [centre2 + cos * reach - sin * half, surface.depth, base + sin * reach + cos * half]
              ], surface.colour, "muntin"));
            }
          } else if (doorWindow.value !== "none") {
            const narrow = doorWindow.value === "vertical";
            const a = w * (narrow ? 0.66 : 0.2), b = w * (narrow ? 0.82 : 0.8);
            const low = h * (narrow ? 0.52 : 0.5), high = h * 0.85;
            surface.parts.push(
              rect(a - rim, b + rim, low - rim, high + rim, surface.colour, "glazing-frame"),
              rect(a, b, low, high, glassColor, "glass")
            );
          }
          surface.parts.push(rect(w * 0.76, w * 0.87, h * 0.425, h * 0.435, "#edf8f7", "handle"));
        }
        const eye = plan ? [0, 0, 1] : iso ? camera : [-1, 0, 0];
        paintDoor = () => {
          const sin = Math.sin(doorAngle), cos = Math.cos(doorAngle), direction = rtl ? -1 : 1;
          const polygons = [...doorTrimFaces];
          for (const surface of surfaces) {
            const [u, d2, z] = surface.normal;
            const normal = [-sin * u + cos * d2, direction * (cos * u + sin * d2), z];
            if (dot(normal, eye) <= epsilon) continue;
            for (const part of surface.parts) {
              const points = part.points.map(([u2, d3, z2]) => doorPoint(doorAngle, u2, d3, z2));
              polygons.push({ points, original: points, normal, offset: dot(normal, points[0]), attrs: part.attrs });
            }
          }
          const ordered = [];
          orderFraming(polygons, ordered, eye);
          leaf.replaceChildren();
          for (const { points, original, attrs } of ordered) drawShape("polygon", points, attrs, original, leaf);
        };
        paintDoor();
      }
      function drawShape(tag, points, attrs, original, parent = layer) {
        const polygon = points.map(project);
        const coords = polygon.map((p) => p.join(",")).join(" ");
        if (tag === "line") {
          stroke(...polygon, attrs, parent);
          return;
        }
        if (!original || points === original) {
          node(tag, { points: coords, ...attrs }, void 0, parent);
          return;
        }
        if (attrs.fill !== "none") node("polygon", { points: coords, ...attrs, style: "stroke:none" }, void 0, parent);
        if (attrs.class.includes("cladding-facet")) return;
        const edges = original.map((p, i) => [p, subtract(original[(i + 1) % original.length], p)]);
        for (let i = 0; i < points.length; i++) {
          const j = (i + 1) % points.length;
          const onEdge = edges.some(([p, d]) => {
            const tolerance = epsilon * Math.hypot(...d);
            return tolerance > 0 && [points[i], points[j]].every((q) => Math.hypot(...cross(subtract(q, p), d)) <= tolerance);
          });
          if (onEdge) stroke(polygon[i], polygon[j], {
            class: attrs.class,
            ...attrs["data-layer"] && { "data-layer": attrs["data-layer"] },
            ...attrs["vector-effect"] && { "vector-effect": attrs["vector-effect"] }
          }, parent);
        }
      }
      const names = { "3d": "3D porch sketch", front: "Front elevation", left: "Left elevation", right: "Right elevation", plan: "Top view" };
      node("title", { id: "drawing-title" }, timberOnly ? `${names[view]} \u2014 wall timber` : names[view], group);
      paintDoor = void 0;
      doorButton.disabled = !doorVisible;
      doorButton.title = doorVisible ? "Preview the outward door swing" : "Available in 3D, Left, and Top view";
      for (const [tag, points, attrs, original] of shapes) {
        if (tag === "door-leaf") drawDoorLeaf();
        else drawShape(tag, points, attrs, original);
      }
      for (const { a, b, gap, text } of dims) {
        const p = project(a), q = project(b);
        const u = [p[0] + gap[0], p[1] + gap[1]], v = [q[0] + gap[0], q[1] + gap[1]];
        const attrs = { class: "dim" };
        stroke(p, u, attrs);
        stroke(q, v, attrs);
        stroke(u, v, attrs);
        for (const [x, y] of [u, v]) stroke([x - 4, y + 4], [x + 4, y - 4], attrs);
        node("text", {
          x: (u[0] + v[0]) / 2,
          y: (u[1] + v[1]) / 2 + (gap[0] ? 5 : 21),
          "text-anchor": gap[0] < 0 ? "end" : "middle",
          class: "dimension"
        }, text);
      }
      for (const { at, text, dy, anchor } of labels2) {
        const [x, y] = project(at);
        node("text", { x, y: y + dy, "text-anchor": anchor, class: "annotation" }, text);
      }
      group.append(layer);
      drawingLayer = layer;
      applyZoom();
      svg.replaceChildren(group);
      paintMeasurements = drawMeasurements;
      paintMeasurements();
      groundButton.textContent = groundHidden ? "Show ground" : "Hide ground";
      const framingNotes = [];
      if (visible("studs") && !visible("cover")) framingNotes.push(`Studs: ${fmt(studWidth)} \xD7 ${mm2(studDepth)} at ${mm2(studSpacing)} centres.`);
      if (roofFraming) framingNotes.push(`Rafters: ${fmt(rafterWidth)} \xD7 ${mm2(rafterDepth)} at ${mm2(rafterSpacing)} centres.`);
      $("framing-summary").hidden = !framingNotes.length;
      $("framing-summary").textContent = [...framingNotes, "Framing is schematic; member sizes and spans are not structurally verified."].join(" ");
      if (persistenceEnabled && settingsValid) persistSettings();
    }
    form.addEventListener("toggle", () => {
      const section2 = activeSection();
      if (section2 !== guideSection) {
        guideSection = section2;
        showMeasurements();
      }
    }, true);
    form.addEventListener("focusin", ({ target }) => {
      if (fields[target.id] === target) {
        guideSection = target.closest("tr[data-window]")?.dataset.window || activeSection();
        showMeasurements(target.id);
      }
    });
    form.addEventListener("input", ({ target }) => {
      persistenceEnabled = true;
      if (target === trimColour || Object.values(windowMuntins).includes(target)) {
        render();
        return;
      }
      if (target === fields.studWidth || target === fields.rafterWidth) syncTimberSizes();
      update(target === fields.tileWidth);
      if (fields[target.id] === target) showMeasurements(target.id);
    });
    form.addEventListener("submit", (event) => event.preventDefault());
    exportButton.addEventListener("click", () => {
      storageStatus.textContent = settingsValid ? downloadSettings(settingsSnapshot()) : "Correct the highlighted settings before exporting.";
    });
    form.addEventListener("reset", (event) => {
      event.preventDefault();
      persistenceEnabled = true;
      resetParameters();
      update();
    });
    const tabs = [...document.querySelectorAll("[data-view]")];
    function resetParameters(resetView = false) {
      for (const input of Object.values(fields)) input.value = input.dataset.initial;
      syncTimberSizes();
      fields.studDepth.value = fields.studDepth.dataset.initial;
      fields.rafterDepth.value = fields.rafterDepth.dataset.initial;
      trimColour.value = trimColour.defaultValue;
      for (const input of Object.values(windowMuntins)) input.value = [...input.options].find((option) => option.defaultSelected).value;
      footingLayout.value = [...footingLayout.options].find((option) => option.defaultSelected).value;
      for (const input of Object.values(layerInputs)) input.checked = input.defaultChecked;
      roofDisplay.selectedIndex = 0;
      roofMaterial.value = [...roofMaterial.options].find((option) => option.defaultSelected).value;
      roofFinish.value = [...roofFinish.options].find((option) => option.defaultSelected).value;
      groundHidden = false;
      if (resetView) view = "3d";
      for (const tab of tabs) tab.setAttribute("aria-pressed", String(tab.dataset.view === view));
      clearTimeout(guideTimer);
      guideTimer = void 0;
      doorHanding.selectedIndex = 0;
      doorWindow.value = [...doorWindow.options].find((option) => option.defaultSelected).value;
      setDoor(false, false);
    }
    svg.addEventListener("wheel", (event) => {
      if (!event.altKey || !event.deltaY) return;
      event.preventDefault();
      const next = wheelZoom(event, zoom);
      if (next === zoom) return;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
      setZoom(next, Math.max(0, Math.min(drawingWidth, point.x)), Math.max(0, Math.min(drawingHeight, point.y)));
    }, { passive: false });
    document.addEventListener("keydown", (event) => {
      if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.altKey || event.metaKey || event.key.toLowerCase() !== "r" || event.target.isContentEditable || event.target.closest?.("input, textarea, select")) return;
      setZoom(1, 0, 0);
    });
    layerMenu.addEventListener("change", () => {
      persistenceEnabled = true;
      render();
    });
    for (const button of layerMenu.querySelectorAll("[data-layer-preset]")) {
      button.addEventListener("click", () => {
        persistenceEnabled = true;
        for (const [key, input] of Object.entries(layerInputs)) {
          input.checked = button.dataset.layerPreset === "finished" ? input.defaultChecked : button.dataset.layerPreset === "timber" && key === "studs";
        }
        render();
      });
    }
    roofDisplay.addEventListener("change", () => {
      persistenceEnabled = true;
      render();
    });
    roofMaterial.addEventListener("change", () => {
      persistenceEnabled = true;
      update(true);
    });
    roofFinish.addEventListener("change", () => {
      persistenceEnabled = true;
      update();
    });
    groundButton.addEventListener("click", () => {
      persistenceEnabled = true;
      groundHidden = !groundHidden;
      render();
    });
    doorButton.addEventListener("click", () => setDoor(!doorOpen));
    doorHanding.addEventListener("change", () => {
      persistenceEnabled = true;
      setDoor(false, false);
      updateDrawings();
      render();
    });
    doorWindow.addEventListener("change", () => {
      persistenceEnabled = true;
      updateDrawings();
      render();
    });
    for (const tab of tabs) tab.addEventListener("click", () => {
      persistenceEnabled = true;
      view = tab.dataset.view;
      for (const option of tabs) option.setAttribute("aria-pressed", String(option === tab));
      render();
    });
    const saved = loadSettings();
    storageStatus.textContent = saved.error;
    const restored = saved.value ? restoreSettings(saved.value) : false;
    if (saved.error || saved.value && !restored) {
      persistenceEnabled = false;
    }
    if (saved.value && !restored) {
      storageStatus.textContent = "Saved settings are invalid or incomplete; defaults were loaded.";
    }
    for (const tab of tabs) tab.setAttribute("aria-pressed", String(tab.dataset.view === view));
    const valid = update(true);
    if (!valid && restored) {
      persistenceEnabled = false;
      if (!onlySillClearanceErrors) {
        resetParameters(true);
        storageStatus.textContent = "Saved settings are incompatible; defaults were loaded.";
        update();
      }
    } else if (valid && restored && (adjustedStockSizes.length || adjustedRoofSettings || adjustedTrims || migratedHouseReference || roundedMillimetres || addedHouseWindows || migratedWindowClearances)) {
      const notices = [];
      if (adjustedStockSizes.length) notices.push(`Saved dimensions adjusted to listed stock sizes: ${adjustedStockSizes.map((key) => `${key} = ${fields[key].value} mm`).join(", ")}. Review these changes before ordering.`);
      if (adjustedRoofSettings) notices.push("Saved roof settings were migrated to total roof width and door-side overhang, or adjusted to the selected tile module and pitch-dependent batten gauge.");
      if (adjustedTrims) notices.push("Saved opening trims were unified using the door trim width and colour.");
      if (migratedHouseReference) notices.push("Saved house and slab positions were converted to the left-window origin.");
      if (addedHouseWindows) notices.push("Four additional house and basement windows were added with assumed measurements. Review their sizes and positions.");
      if (migratedWindowClearances) notices.push("Porch windows now use left and bottom clearances; former centred positions were rounded to whole millimetres.");
      if (roundedMillimetres) notices.push("Saved dimensions were rounded to whole millimetres. Review the updated layout.");
      storageStatus.textContent = [...notices, storageStatus.textContent].filter(Boolean).join(" ");
    }
  }

  // js/main.js
  try {
    initDesigner();
  } catch (error) {
    console.error("Farstu Designer failed to start.", error);
    const status = document.getElementById("app-error");
    if (status) {
      status.hidden = false;
      status.textContent = `The designer could not start: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
})();
