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
  function drawWindow(face, section, op, wall, options) {
    const { key, pattern, thickness, trim, trimColour, flashing = true } = options;
    const { gap, setBack, rim, glassDepth } = windowProfile(op, thickness);
    const { start: a, end: b, bottom: c, top: d } = op;
    const l = a + gap, r = b - gap, s = c + gap, h = d - gap;
    const x = l + rim, y = r - rim, bottom = s + rim, top = h - rim;
    const draw = (points, fill, part) => face(points.map((point) => section(...point)), fill, {
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
    const { roofWidth: widthWithOverhang, length, frontOverhang, slope, pitch, roofMaterial } = model;
    const slopedRun = (length + frontOverhang) * Math.hypot(1, slope);
    const area = widthWithOverhang * slopedRun / 1e6;
    const edgeLength = widthWithOverhang / 1e3;
    const vergeLength = 2 * slopedRun / 1e3;
    const underlayment = roofMaterial === "tiles" && pitch < 22 ? "High-grade sealed underlayment with taped or welded seams" : "Continuous roof underlayment over solid sheathing";
    return [
      { id: `covering-${roofMaterial}`, role: `${roofMaterials[roofMaterial].label} covering`, quantity: area * 1.1, unit: "m\xB2", basis: "Roof area plus 10% laps / cuts" },
      { id: "roof-deck", role: "Solid roof deck / sheathing", quantity: area * 1.05, unit: "m\xB2", basis: "Net roof area plus 5% cuts" },
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

  // js/controls.js
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
      ["cover", "Cover boards", "#edc897"],
      ["base", "Base boards", "#d6a876"],
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
    const anchors = { front: "Bottom", right: "Bottom" };
    const windowMuntins = {};
    const houseWindows = {
      houseLeft: { label: "Left house window", sill: 1390, width: 1300, height: 1100 },
      houseUpper: { label: "Upper house window", offset: 4894, sill: 3490, width: 700, height: 500 },
      houseRight: { label: "Right house window", sill: 1390, width: 1300, height: 1100 }
    };
    const houseBasementWindows = {
      houseBasementLeft: { label: "Left basement window", offset: 650, sill: 150, width: 900, height: 300 },
      houseBasementRight: { label: "Right basement window", offset: 9138, sill: 150, width: 900, height: 300 }
    };
    function addFields(group, specs) {
      for (const [key, title, initial, min = 0, unit = "mm", max = 5e4, step = unit === "mm" ? 1 : "any", choices] of specs) {
        const label = document.createElement("label");
        label.textContent = title;
        const box = document.createElement("span");
        box.className = "number";
        const input = document.createElement(choices ? "select" : "input");
        Object.assign(input, { name: key, id: key, required: true });
        input.dataset.initial = initial;
        if (choices) {
          for (const value of choices) input.add(new Option(`${value} ${unit}`, value, value === initial, value === initial));
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
        const fieldTitle = Object.hasOwn(anchors, group) ? `${group} window: ${title.toLowerCase().replace(/^window /, "")}` : Object.hasOwn(houseWindows, group) ? `${houseWindows[group].label}: ${title.toLowerCase()}` : Object.hasOwn(houseBasementWindows, group) ? `${houseBasementWindows[group].label}: ${title.toLowerCase()}` : title;
        input.setAttribute("aria-label", unit ? `${fieldTitle} (${unit === "mm" ? "millimetres" : "degrees"})` : fieldTitle);
        const suffix = document.createElement("span");
        suffix.className = "unit";
        suffix.textContent = unit;
        suffix.setAttribute("aria-hidden", "true");
        box.append(input);
        if (!choices) box.append(suffix);
        label.append(box);
        $(group).append(label);
        fields[key] = input;
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
    for (const side of Object.keys(anchors)) {
      addFields(side, [
        windowSize(side + "Width", "Window width", 900),
        windowSize(side + "Height", "Window height", 1e3),
        [side + "Bottom", "Bottom clearance", 900, 0, "mm", 5e3],
        [side + "Top", "Top clearance", 0, 0, "mm", 5e3]
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
    for (const [key, values] of Object.entries(houseWindows)) {
      addFields(key, [
        measuredWindowSize(key + "Width", "Width", values.width, 4e3),
        measuredWindowSize(key + "Height", "Height", values.height, 3e3),
        ...key === "houseUpper" ? [[key + "Offset", "Centre from origin", values.offset, -4e4, "mm", 4e4, 1]] : [],
        [key + "Sill", "Sill height above ground", values.sill, 0, "mm", 12400, 1]
      ]);
    }
    for (const [key, values] of Object.entries(houseBasementWindows)) {
      addFields(key, [
        measuredWindowSize(key + "Width", "Width", values.width, 3e3),
        measuredWindowSize(key + "Height", "Height", values.height, 1500),
        [key + "Offset", "Centre from origin", values.offset, -4e4, "mm", 4e4, 1],
        [key + "Sill", "Sill height above base bottom", values.sill, 0, "mm", 3e3, 1]
      ]);
    }
    addFields("houseWall", [
      ["houseWallLeft", "Wall left edge from origin", -505, -4e4, "mm", 4e4, 1],
      ["houseWallWidth", "House wall width", 10798, 3e3, "mm", 3e4, 1],
      ["houseWallHeight", "House wall height above ground", 4540, 2500, "mm", 12400, 1],
      ["houseBaseHeight", "Concrete base height", 600, 0, "mm", 3e3, 1],
      ["houseBaseRecession", "Basement recession", 100, 0, "mm", 500, 1]
    ]);
    addFields("hedge", [
      ["hedgeDistance", "Distance from house", 3500, 500, "mm", 2e4, 1],
      ["hedgeHeight", "Hedge height", 1500, 300, "mm", 5e3, 1]
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
      anchors,
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
    for (let centre = phase * pitch; centre - half < end; centre += pitch) {
      spans.push([Math.max(0, centre - half), Math.min(end, centre + half)]);
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
      frontOverhang,
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
    const door = { start: offset, end: offset + doorWidth, bottom: 0, top: doorHeight };
    const sideTop = (u) => rear - slope * u;
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
          const run = slope && key !== "front" ? Math.min(face, (rear - z) / slope) : face;
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
      add("Rafters", "frame", rafterWidth, rafterDepth, (length + frontOverhang) * factor);
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
  var invalidQuoteMessage = "Enter a quote from 0 to 10,000,000 SEK or leave the field blank. The previous quote is unchanged.";
  var number = new Intl.NumberFormat("en", { maximumFractionDigits: 3 });
  var money = new Intl.NumberFormat("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var crossSection = (item) => `${item.width} \xD7 ${item.depth}`;
  function cell(row, value, className) {
    const td = row.insertCell();
    td.textContent = value;
    if (className) td.className = className;
    return td;
  }
  function readQuotes(status) {
    try {
      const text2 = localStorage.getItem(storageKey);
      if (text2 === null) return /* @__PURE__ */ new Map();
      const quotes = JSON.parse(text2);
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
      const text2 = localStorage.getItem(roofStorageKey);
      if (text2 === null) return /* @__PURE__ */ new Map();
      const quotes = JSON.parse(text2);
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
        lengths.textContent = [...counts].sort(([a], [b]) => b - a).map(([mm, count]) => `${count} \xD7 ${mm}`).join("; ");
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

  // js/loads.js
  var gravity = 9.81;
  var adultMass = 80;
  var adultCount = 3;
  var adultFootprint = 400;
  var densities = {
    concrete: { value: 2500, label: "Reinforced concrete (slab and piers)" },
    timber: { value: 450, label: "Structural spruce, C24 incl. moisture" },
    mineralWool: { value: 30, label: "Mineral-wool insulation" }
  };
  var wallLayerMasses = ({ baseBoardWidth, coverBoardWidth, claddingSpacing }) => [
    { key: "cladding", label: "Board-on-board cladding, 22 mm", kg: (baseBoardWidth + coverBoardWidth) / claddingSpacing * 0.022 * densities.timber.value },
    { key: "battens", label: "Nailers and counter-battens, 48 \xD7 25 @ 600", kg: 2 * 0.048 * 0.025 / 0.6 * 450 },
    { key: "wind", label: "Wind-barrier board, 9 mm", kg: 7 },
    { key: "vapour", label: "Vapour control membrane", kg: 0.2 },
    { key: "service", label: "Service battens 70 \xD7 28 @ 600 with insulation", kg: 0.07 * 0.028 / 0.6 * 450 + 0.028 * 30 },
    { key: "osb", label: "OSB / plywood, 12 mm", kg: 0.012 * 620 },
    { key: "gypsum", label: "Gypsum lining, 13 mm", kg: 9 }
  ];
  var openingMasses = { window: 35, door: 30 };
  var roofCoveringMasses = {
    tiles: 45,
    standingSeam: 6
  };
  var roofCoveringLabels = {
    tiles: roofMaterials.tiles.label,
    standingSeam: roofMaterials.standingSeam.label
  };
  var roofCovering = ({ roofMaterial }) => roofMaterial in roofCoveringMasses ? roofMaterial : "tiles";
  var roofLayerMasses = { deck: 10, underlayment: 1.5 };
  var roofEdgeMasses = { eave: 6, verge: 3.6, abutment: 1, downpipe: 5 };
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
  function leverShares(u, supports) {
    const last = supports.length - 2;
    let k = 0;
    while (k < last && u > supports[k + 1]) k++;
    const t = (u - supports[k]) / (supports[k + 1] - supports[k]);
    return [[k, 1 - t], [k + 1, t]];
  }
  function defaultPeople(model, preset = "spread") {
    const { width: W, length: L, wallThickness: T } = model;
    const ix = [T, W - T], iy = [0, L - T];
    const cx = (ix[0] + ix[1]) / 2, cy = (iy[0] + iy[1]) / 2;
    if (preset === "spread") return [0.25, 0.5, 0.75].map((f) => ({ x: ix[0] + f * (ix[1] - ix[0]), y: cy }));
    return [[-1, -1], [1, -1], [0, 1]].map(([dx, dy]) => ({ x: cx + dx * 220, y: cy + dy * 190 }));
  }
  function clampPerson(model, { x, y }) {
    const { width: W, length: L, wallThickness: T } = model;
    const m = adultFootprint / 2;
    const clamp = (v, a, b) => a > b ? (a + b) / 2 : Math.max(a, Math.min(b, v));
    return { x: clamp(x, T + m, W - T - m), y: clamp(y, m, L - T - m) };
  }
  function wallLoads(model, add) {
    const {
      width: W,
      length: L,
      wallThickness: T,
      studWidth,
      studDepth,
      studSpacing,
      rear,
      slope,
      frontWallHeight,
      windows,
      offset,
      doorWidth,
      doorHeight
    } = model;
    const timber = densities.timber.value / 1e9;
    const layerKg = wallLayerMasses(model).reduce((sum, layer) => sum + layer.kg, 0) / 1e6;
    const cavityKg = densities.mineralWool.value * studDepth / 1e9 * Math.max(0, 1 - studWidth / studSpacing);
    const sideTop = (u) => rear - slope * u;
    const walls = [
      {
        end: L - T,
        top: sideTop,
        op: { start: offset, end: offset + doorWidth, bottom: 0, top: doorHeight },
        at: (u) => [T / 2, u],
        kind: "door"
      },
      { end: W, top: () => frontWallHeight, op: windows.front, at: (u) => [u, L - T / 2], kind: "window" },
      { end: L - T, top: sideTop, op: windows.right, at: (u) => [W - T / 2, u], kind: "window" }
    ];
    const step = 25;
    for (const { end, top, op, at, kind } of walls) {
      for (const { a, b, low, high } of wallMembers(0, end, top, op, studWidth, studSpacing, kind === "window")) {
        const n2 = Math.max(1, Math.ceil((b - a) / step));
        for (let i = 0; i < n2; i++) {
          const u = a + (i + 0.5) * (b - a) / n2;
          const h = clippedHeight(top, high, u) - clippedHeight(top, low, u);
          if (h > 0) add("walls", "framing", ...at(u), h * (b - a) / n2 * studDepth * timber);
        }
      }
      for (let start = 0; start < end; ) {
        const boundary = start < op.start ? op.start : start < op.end ? op.end : end;
        const du = Math.min(step, end - start, boundary - start);
        const u = start + du / 2;
        const inOpening = u > op.start && u < op.end;
        const solid = Math.max(0, top(u) - (inOpening ? op.top - op.bottom : 0));
        add("walls", "layers", ...at(u), solid * du * layerKg);
        add("walls", "insulation", ...at(u), solid * du * cavityKg);
        start += du;
      }
      const area = (op.end - op.start) * (op.top - op.bottom) / 1e6;
      const unitKg = area * openingMasses[kind];
      const trimWidth = model.trimWidth ?? 0;
      const trimKg = trimWidth * 22 * densities.timber.value / 1e9 * (2 * (op.top - op.bottom) + (op.end - op.start) + 2 * trimWidth);
      const n = Math.max(1, Math.ceil((op.end - op.start) / step));
      for (let i = 0; i < n; i++) {
        const u = op.start + (i + 0.5) * (op.end - op.start) / n;
        add("walls", "openings", ...at(u), (unitKg + trimKg) / n);
      }
    }
  }
  function roofLoads(model, add) {
    const {
      width: W,
      length: L,
      wallThickness: T,
      roofWidth,
      doorSideOverhang: S,
      frontOverhang: F,
      slope,
      rafterWidth,
      rafterDepth,
      rafterSpacing
    } = model;
    const factor = Math.hypot(1, slope);
    const roofRight = roofWidth - S;
    const rafters = rafterStarts(roofWidth, S, rafterWidth, rafterSpacing);
    const rafterKg = rafterWidth * rafterDepth * (L + F) * factor * densities.timber.value / 1e9;
    const areaKg = (roofCoveringMasses[roofCovering(model)] + roofLayerMasses.deck + roofLayerMasses.underlayment) / 1e6 * factor;
    const point = (part, x, y, kg2) => add("roof", part, x, y, kg2);
    const step = 50;
    const ys = [];
    for (let start = 0; start < L + F; start += step) {
      const dy = Math.min(step, L + F - start);
      ys.push([start + dy / 2, dy]);
    }
    for (const x0 of rafters) for (const [y, dy] of ys) point("rafters", x0 + rafterWidth / 2, y, rafterKg * dy / (L + F));
    for (let start = -S; start < roofRight; start += step) {
      const dx = Math.min(step, roofRight - start);
      const x = start + dx / 2;
      for (const [y, dy] of ys) point("covering", x, y, dx * dy * areaKg);
      point("edges", x, L + F, dx / 1e3 * roofEdgeMasses.eave);
      point("edges", x, 0, dx / 1e3 * roofEdgeMasses.abutment);
    }
    for (const [y, dy] of ys) {
      for (const x of [-S, roofRight]) point("edges", x, y, dy / 1e3 * factor * roofEdgeMasses.verge);
    }
    point("edges", W - T / 2, L + F, roofEdgeMasses.downpipe);
  }
  function computeLoads(model, { people, rearSupport = "beam" }) {
    const { width: W, length: L, wallThickness: T, slabThickness, footingDiameter, footingDepth } = model;
    const layout = pierLayout(model);
    const { columns, rows, radius } = layout;
    const piers = rows.flatMap((y, r) => columns.map((x, c) => ({
      id: `${String.fromCharCode(65 + r)}${c + 1}`,
      x,
      y,
      row: r,
      column: c,
      parts: { slab: 0, walls: 0, roof: 0, people: 0 }
    })));
    const totals = { slab: 0, walls: 0, roof: 0, people: 0, house: 0 };
    const details = {};
    const cell2 = 100;
    const nx = Math.max(1, Math.ceil(W / cell2)), ny = Math.max(1, Math.ceil(L / cell2));
    const field = new Float64Array(nx * ny);
    function onSlab(group, x, y, kg2) {
      totals[group] += kg2;
      const cx = Math.min(nx - 1, Math.max(0, Math.floor(x / W * nx)));
      const cy = Math.min(ny - 1, Math.max(0, Math.floor(y / L * ny)));
      field[cy * nx + cx] += kg2;
      for (const [r, wr] of leverShares(y, rows)) {
        for (const [c, wc] of leverShares(x, columns)) piers[r * columns.length + c].parts[group] += kg2 * wr * wc;
      }
    }
    function add(group, part, x, y, kg2) {
      details[`${group}:${part}`] = (details[`${group}:${part}`] ?? 0) + kg2;
      onSlab(group, x, y, kg2);
    }
    const slabKg = densities.concrete.value * slabThickness / 1e9;
    for (let y = 0; y < L; y += 50) {
      const dy = Math.min(50, L - y);
      for (let x = 0; x < W; x += 50) {
        const dx = Math.min(50, W - x);
        add("slab", "concrete", x + dx / 2, y + dy / 2, dx * dy * slabKg);
      }
    }
    wallLoads(model, add);
    const frontY = L - T / 2;
    const sides = [T / 2, W - T / 2];
    roofLoads(model, (group, part, x, y, kg2) => {
      details[`${group}:${part}`] = (details[`${group}:${part}`] ?? 0) + kg2;
      const front = kg2 * y / frontY;
      const rearKg = kg2 - front;
      onSlab("roof", Math.max(sides[0], Math.min(sides[1], x)), frontY, front);
      if (rearSupport === "house") {
        totals.house += rearKg;
      } else {
        for (const [i, share] of leverShares(x, sides)) onSlab("roof", sides[i], T / 2, rearKg * share);
      }
    });
    const footprint = adultFootprint;
    const steps = 4;
    for (const person of people) {
      for (let i = 0; i < steps; i++) {
        for (let j = 0; j < steps; j++) {
          const x = person.x - footprint / 2 + (i + 0.5) * footprint / steps;
          const y = person.y - footprint / 2 + (j + 0.5) * footprint / steps;
          add("people", "adults", x, y, adultMass / steps / steps);
        }
      }
    }
    const area = Math.PI * radius * radius / 1e6;
    const selfWeight = densities.concrete.value * area * footingDepth / 1e3;
    const onPiers = totals.slab + totals.walls + totals.roof + totals.people;
    for (const pier of piers) {
      pier.fromAbove = Object.values(pier.parts).reduce((a, b) => a + b, 0);
      pier.selfWeight = selfWeight;
      pier.atBase = pier.fromAbove + selfWeight;
      pier.share = pier.fromAbove / onPiers;
      pier.topPressure = pier.fromAbove * gravity / 1e3 / area;
      pier.basePressure = pier.atBase * gravity / 1e3 / area;
    }
    const cellArea = W / nx * (L / ny) / 1e6;
    return {
      piers,
      layout,
      totals,
      details,
      onPiers,
      area,
      footingDiameter,
      pierSelfWeight: selfWeight * piers.length,
      field: { nx, ny, values: Array.from(field, (kg2) => kg2 * gravity / 1e3 / cellArea) }
    };
  }

  // js/loads-view.js
  var svgNS = "http://www.w3.org/2000/svg";
  var kgFormat = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });
  var oneDecimal = new Intl.NumberFormat("en", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var twoDecimals = new Intl.NumberFormat("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var percent = new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 });
  var kg = (n) => kgFormat.format(Math.round(n));
  var kN = (n) => twoDecimals.format(n * gravity / 1e3);
  var ramp = [[255, 247, 214], [253, 205, 120], [240, 133, 62], [204, 64, 44], [128, 20, 34]];
  function heat(t) {
    const x = Math.max(0, Math.min(1, t)) * (ramp.length - 1);
    const i = Math.min(ramp.length - 2, Math.floor(x));
    const f = x - i;
    return `rgb(${ramp[i].map((c, k) => Math.round(c + f * (ramp[i + 1][k] - c))).join(",")})`;
  }
  function el(name, attrs = {}, parent) {
    const node = document.createElementNS(svgNS, name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    parent?.append(node);
    return node;
  }
  function text(parent, x, y, content, size, attrs = {}) {
    const node = el("text", { x, y, "font-size": size, class: "loads-text", ...attrs }, parent);
    node.textContent = content;
    return node;
  }
  function createLoadsView($) {
    const panel2 = $("loads-view");
    const svg = $("loads-diagram");
    const status = $("loads-status");
    const rearSupport = $("loads-rear-support");
    const peopleSelect = $("loads-people");
    const rows = $("loads-rows");
    const breakdown = $("loads-breakdown");
    const assumptions = $("loads-assumptions");
    const fixedNodes = [...svg.childNodes];
    $("loads-adult-mass").textContent = adultMass;
    let latest, valid;
    let custom;
    let dragging = null;
    let renderFrame = 0;
    let focusIndex = null;
    const interior = (model) => ({ x0: model.wallThickness, x1: model.width - model.wallThickness, y0: 0, y1: model.length - model.wallThickness });
    function peopleFor(model) {
      let people;
      if (peopleSelect.value === "custom" && custom) {
        const box = interior(model);
        people = custom.map(({ fx, fy }) => ({ x: box.x0 + fx * (box.x1 - box.x0), y: box.y0 + fy * (box.y1 - box.y0) }));
      } else if (peopleSelect.value === "worst") {
        const dead = computeLoads(model, { people: [], rearSupport: rearSupport.value });
        const pier = dead.piers.reduce((a, b) => b.fromAbove > a.fromAbove ? b : a);
        const group = defaultPeople(model, "together");
        const cx = group.reduce((s, q) => s + q.x, 0) / group.length;
        const cy = group.reduce((s, q) => s + q.y, 0) / group.length;
        people = group.map((p) => ({ x: p.x - cx + pier.x, y: p.y - cy + pier.y }));
      } else {
        people = defaultPeople(model, peopleSelect.value);
      }
      return people.slice(0, adultCount).map((p) => clampPerson(model, p));
    }
    function storeCustom(model, people) {
      const box = interior(model);
      custom = people.map(({ x, y }) => ({
        fx: (x - box.x0) / Math.max(1, box.x1 - box.x0),
        fy: (y - box.y0) / Math.max(1, box.y1 - box.y0)
      }));
      peopleSelect.querySelector('option[value="custom"]').disabled = false;
      peopleSelect.value = "custom";
    }
    function moveTo(index, point, defer = false) {
      const people = peopleFor(latest);
      people[index] = clampPerson(latest, point);
      storeCustom(latest, people);
      if (defer) {
        if (!renderFrame) renderFrame = requestAnimationFrame(() => {
          renderFrame = 0;
          render();
        });
      } else render();
    }
    function svgPoint(event) {
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const matrix = svg.getScreenCTM();
      return matrix ? point.matrixTransform(matrix.inverse()) : null;
    }
    svg.addEventListener("pointerdown", (event) => {
      const person = event.target.closest("[data-person]");
      if (!person || !latest || panel2.hidden || event.button !== 0 || dragging) return;
      const point = svgPoint(event);
      if (!point) return;
      event.preventDefault();
      const index = Number(person.dataset.person);
      const { x, y } = point;
      const current = peopleFor(latest)[index];
      dragging = { index, pointer: event.pointerId, dx: current.x - x, dy: current.y - y };
      svg.setPointerCapture(event.pointerId);
    });
    svg.addEventListener("pointermove", (event) => {
      if (!dragging || event.pointerId !== dragging.pointer) return;
      if (panel2.hidden) {
        stop(event);
        return;
      }
      const point = svgPoint(event);
      if (!point) return;
      moveTo(dragging.index, { x: point.x + dragging.dx, y: point.y + dragging.dy }, true);
    });
    const stop = (event) => {
      if (!dragging || event.pointerId !== dragging.pointer) return;
      dragging = null;
      if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
      if (renderFrame) render();
    };
    svg.addEventListener("pointerup", stop);
    svg.addEventListener("pointercancel", stop);
    svg.addEventListener("lostpointercapture", stop);
    svg.addEventListener("keydown", (event) => {
      const person = event.target.closest?.("[data-person]");
      const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
      if (!person || !step || !latest || panel2.hidden) return;
      event.preventDefault();
      const index = Number(person.dataset.person);
      const current = peopleFor(latest)[index];
      const distance = event.shiftKey ? 500 : 100;
      focusIndex = index;
      moveTo(index, { x: current.x + step[0] * distance, y: current.y + step[1] * distance });
    });
    rearSupport.addEventListener("change", () => render());
    peopleSelect.addEventListener("change", () => render());
    function drawDiagram(model, result, people) {
      const { width: W, length: L, wallThickness: T, roofWidth, doorSideOverhang: S, frontOverhang: F, windows, offset, doorWidth } = model;
      const { piers, layout, field } = result;
      const span = Math.max(roofWidth, L + F);
      const u = span / 640;
      const margin = 70 * u;
      const houseBand = 46 * u;
      const minX = -S - margin, minY = -houseBand - 14 * u, maxX = roofWidth - S + margin, maxY = L + F + margin;
      svg.setAttribute("viewBox", `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);
      svg.replaceChildren(...fixedNodes);
      const root = el("g", {}, svg);
      el("rect", { x: minX, y: -houseBand, width: maxX - minX, height: houseBand, class: "loads-house" }, root);
      text(root, W / 2, -houseBand / 2, "Existing house wall", 13 * u, { "dominant-baseline": "central", "text-anchor": "middle" });
      el("rect", { x: -S, y: 0, width: roofWidth, height: L + F, class: "loads-roof" }, root);
      text(root, roofWidth - S - 4 * u, L + F - 6 * u, "Roof outline", 10 * u, { "text-anchor": "end", class: "loads-text loads-muted" });
      const max = Math.max(...field.values);
      const cw = W / field.nx, ch = L / field.ny;
      const cells = el("g", { "aria-hidden": "true", "shape-rendering": "crispEdges" }, root);
      field.values.forEach((value, i) => {
        el("rect", {
          x: i % field.nx * cw,
          y: Math.floor(i / field.nx) * ch,
          width: cw + 0.5,
          height: ch + 0.5,
          fill: heat(Math.sqrt(value / max))
        }, cells);
      });
      el("rect", { x: 0, y: 0, width: W, height: L, class: "loads-slab" }, root);
      const walls = el("g", { class: "loads-walls" }, root);
      el("rect", { x: 0, y: 0, width: T, height: offset }, walls);
      el("rect", { x: 0, y: offset + doorWidth, width: T, height: Math.max(0, L - T - offset - doorWidth) }, walls);
      el("rect", { x: 0, y: L - T, width: W, height: T }, walls);
      el("rect", { x: W - T, y: 0, width: T, height: L - T }, walls);
      const glazing = el("g", { class: "loads-glazing" }, root);
      el("line", { x1: windows.front.start, x2: windows.front.end, y1: L - T / 2, y2: L - T / 2 }, glazing);
      el("line", { x1: W - T / 2, x2: W - T / 2, y1: windows.right.start, y2: windows.right.end }, glazing);
      text(
        root,
        -10 * u,
        offset + doorWidth / 2,
        "Door",
        10 * u,
        { "text-anchor": "middle", transform: `rotate(-90 ${-10 * u} ${offset + doorWidth / 2})`, class: "loads-text loads-muted" }
      );
      const pressures = piers.map((p) => p.basePressure);
      const pMin = Math.min(...pressures), pMax = Math.max(...pressures);
      for (const pier of piers) {
        const g = el("g", { class: "loads-pier" }, root);
        const t = pMax > pMin ? (pier.basePressure - pMin) / (pMax - pMin) : 0.5;
        el("circle", { cx: pier.x, cy: pier.y, r: layout.radius, fill: `hsl(250 ${25 + 30 * t}% ${78 - 30 * t}%)` }, g);
        const size = Math.min(12 * u, layout.radius / 3.2);
        text(g, pier.x, pier.y - size * 1.15, pier.id, size, { "text-anchor": "middle", class: "loads-text loads-pier-id" });
        text(g, pier.x, pier.y, `${kg(pier.fromAbove)} kg`, size, { "text-anchor": "middle", "dominant-baseline": "central", class: `loads-text${pier.fromAbove < 0 ? " loads-uplift" : ""}` });
        text(g, pier.x, pier.y + size * 1.2, `${oneDecimal.format(pier.basePressure)} kPa`, size * 0.9, { "text-anchor": "middle", "dominant-baseline": "hanging", class: "loads-text" });
      }
      people.forEach((person, index) => {
        const g = el("g", {
          class: "loads-person",
          "data-person": index,
          tabindex: 0,
          role: "button",
          "aria-label": `Adult ${index + 1}, ${adultMass} kg, ${kgFormat.format(person.x)} mm from the left and ${kgFormat.format(person.y)} mm from the house. Use the arrow keys to move.`
        }, root);
        el("rect", {
          x: person.x - adultFootprint / 2,
          y: person.y - adultFootprint / 2,
          width: adultFootprint,
          height: adultFootprint,
          rx: adultFootprint / 5,
          class: "loads-person-area"
        }, g);
        el("circle", { cx: person.x, cy: person.y - 60, r: 55, class: "loads-person-head" }, g);
        el("path", { d: `M${person.x - 110} ${person.y + 120} Q${person.x} ${person.y - 30} ${person.x + 110} ${person.y + 120} Z`, class: "loads-person-head" }, g);
        text(g, person.x, person.y + adultFootprint / 2 + 12 * u, `${adultMass} kg`, 10 * u, { "text-anchor": "middle", "dominant-baseline": "hanging" });
      });
      const dims = el("g", { class: "loads-dims" }, root);
      const dy = L + F + 28 * u;
      el("line", { x1: 0, x2: W, y1: dy, y2: dy }, dims);
      for (const x of [0, W]) el("line", { x1: x, x2: x, y1: dy - 7 * u, y2: dy + 7 * u }, dims);
      text(root, W / 2, dy + 6 * u, `Slab width ${kgFormat.format(W)} mm`, 11 * u, { "text-anchor": "middle", "dominant-baseline": "hanging" });
      const dx = -S - 28 * u;
      el("line", { x1: dx, x2: dx, y1: 0, y2: L }, dims);
      for (const y of [0, L]) el("line", { x1: dx - 7 * u, x2: dx + 7 * u, y1: y, y2: y }, dims);
      text(
        root,
        dx - 6 * u,
        L / 2,
        `Slab length ${kgFormat.format(L)} mm`,
        11 * u,
        { "text-anchor": "middle", transform: `rotate(-90 ${dx - 6 * u} ${L / 2})` }
      );
      $("loads-ramp-range").textContent = `0 \u2013 ${oneDecimal.format(max)} kPa (square-root scale; walls and feet are concentrated loads)`;
      if (focusIndex !== null) svg.querySelector(`[data-person="${focusIndex}"]`)?.focus({ preventScroll: true });
      focusIndex = null;
    }
    function fillTables(model, result) {
      const { piers, totals, details, onPiers, area } = result;
      const fragment = document.createDocumentFragment();
      const cell2 = (row, value, className = "numeric") => {
        const td = row.insertCell();
        td.textContent = value;
        if (className) td.className = className;
        return td;
      };
      for (const pier of piers) {
        const tr2 = document.createElement("tr");
        const th2 = document.createElement("th");
        th2.scope = "row";
        th2.textContent = pier.id;
        tr2.append(th2);
        cell2(tr2, `${kgFormat.format(pier.x)} / ${kgFormat.format(pier.y)}`);
        for (const key of ["slab", "walls", "roof", "people"]) cell2(tr2, kg(pier.parts[key]));
        cell2(tr2, kg(pier.fromAbove), pier.fromAbove < 0 ? "numeric bom-flag" : "numeric");
        cell2(tr2, kN(pier.fromAbove));
        cell2(tr2, kg(pier.selfWeight));
        cell2(tr2, kN(pier.atBase));
        cell2(tr2, oneDecimal.format(pier.basePressure));
        cell2(tr2, percent.format(pier.share));
        fragment.append(tr2);
      }
      const tr = document.createElement("tr");
      tr.className = "loads-total-row";
      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = "Total";
      tr.append(th);
      cell2(tr, `${piers.length} piers, ${twoDecimals.format(area)} m\xB2 each`, "");
      for (const key of ["slab", "walls", "roof", "people"]) cell2(tr, kg(totals[key]));
      cell2(tr, kg(onPiers));
      cell2(tr, kN(onPiers));
      cell2(tr, kg(result.pierSelfWeight));
      cell2(tr, kN(onPiers + result.pierSelfWeight));
      cell2(tr, "");
      cell2(tr, percent.format(1));
      fragment.append(tr);
      rows.replaceChildren(fragment);
      const factor = Math.hypot(1, model.slope);
      const covering = roofCovering(model);
      const coveringLabel = roofCoveringLabels[covering].toLowerCase();
      const lines = [
        ["Concrete slab", details["slab:concrete"], `${kgFormat.format(model.width)} \xD7 ${kgFormat.format(model.length)} \xD7 ${kgFormat.format(model.slabThickness)} mm at ${densities.concrete.value} kg/m\xB3`],
        ["Wall studs, plates, sills & headers", details["walls:framing"], `Stud layout from the Designer at ${densities.timber.value} kg/m\xB3`],
        ["Wall cladding, battens, boards & linings", details["walls:layers"], `${oneDecimal.format(wallLayerMasses(model).reduce((s, l) => s + l.kg, 0))} kg/m\xB2 of solid wall`],
        ["Stud-bay insulation", details["walls:insulation"], `${densities.mineralWool.value} kg/m\xB3 mineral wool, ${kgFormat.format(model.studDepth)} mm deep`],
        ["Windows, door & opening trim", details["walls:openings"], `Windows ${openingMasses.window} kg/m\xB2, door ${openingMasses.door} kg/m\xB2`],
        ["Rafters", details["roof:rafters"], `${kgFormat.format(model.rafterWidth)} \xD7 ${kgFormat.format(model.rafterDepth)} mm at ${densities.timber.value} kg/m\xB3`],
        [`Roof ${coveringLabel}, deck & underlayment`, details["roof:covering"], `${oneDecimal.format((roofCoveringMasses[covering] + roofLayerMasses.deck + roofLayerMasses.underlayment) * factor)} kg per m\xB2 of plan`],
        ["Fascia, flashings & gutter", details["roof:edges"], "Line loads along the roof edges"],
        [`${adultCount} adults`, details["people:adults"], `${adultMass} kg each, spread over ${adultFootprint} \xD7 ${adultFootprint} mm`]
      ];
      const out = document.createDocumentFragment();
      const addLine = (label, mass, basis, className) => {
        const row = document.createElement("tr");
        if (className) row.className = className;
        const head = document.createElement("th");
        head.scope = "row";
        head.textContent = label;
        row.append(head);
        cell2(row, kg(mass));
        cell2(row, basis, "");
        out.append(row);
      };
      for (const line of lines) addLine(...line);
      if (totals.house > 0) addLine("Less: rear roof share carried by the house", -totals.house, "Ledger on the existing house wall");
      addLine("Total on the piers", onPiers, `${kN(onPiers)} kN`, "loads-total-row");
      addLine("Pier self-weight", result.pierSelfWeight, `${piers.length} \xD7 \xD8 ${kgFormat.format(model.footingDiameter)} mm, ${kgFormat.format(model.footingDepth)} mm deep`);
      addLine("Total on the soil", onPiers + result.pierSelfWeight, `${kN(onPiers + result.pierSelfWeight)} kN`, "loads-total-row");
      breakdown.replaceChildren(out);
      const items = [
        ...Object.values(densities).map((d) => `${d.label}: ${d.value} kg/m\xB3`),
        ...wallLayerMasses(model).map((l) => `${l.label}: ${oneDecimal.format(l.kg)} kg/m\xB2`),
        `Window units: ${openingMasses.window} kg/m\xB2; exterior door: ${openingMasses.door} kg/m\xB2`,
        ...Object.entries(roofCoveringMasses).map(([key, value]) => `${roofCoveringLabels[key]}: ${value} kg/m\xB2 of roof incl. battens`),
        `Roof deck, 22 mm boards: ${roofLayerMasses.deck} kg/m\xB2; underlayment: ${roofLayerMasses.underlayment} kg/m\xB2`,
        `Eave (fascia, drip flashing, gutter): ${roofEdgeMasses.eave} kg/m; each verge (two bargeboards, flashing): ${roofEdgeMasses.verge} kg/m; downpipe: ${roofEdgeMasses.downpipe} kg`,
        `Average adult: ${adultMass} kg; gravity ${gravity} m/s\xB2`
      ];
      assumptions.replaceChildren(...items.map((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        return li;
      }));
    }
    let renderedKey;
    function render() {
      cancelAnimationFrame(renderFrame);
      renderFrame = 0;
      if (panel2.hidden) return;
      if (!latest) {
        status.textContent = "No valid design is available.";
        return;
      }
      status.textContent = valid ? "" : "Showing the last valid design. Fix the highlighted parameters in Designer to update these loads.";
      const key = [latest, rearSupport.value, peopleSelect.value, custom];
      if (renderedKey && key.every((value, i) => value === renderedKey[i])) return;
      renderedKey = key;
      const people = peopleFor(latest);
      const result = computeLoads(latest, { people, rearSupport: rearSupport.value });
      const top = result.piers.reduce((a, b) => b.fromAbove > a.fromAbove ? b : a);
      const worst = result.piers.reduce((a, b) => b.basePressure > a.basePressure ? b : a);
      $("loads-total").textContent = `${kg(result.onPiers)} kg \xB7 ${kN(result.onPiers)} kN`;
      $("loads-max").textContent = `${top.id}: ${kg(top.fromAbove)} kg`;
      $("loads-pressure").textContent = `${worst.id}: ${oneDecimal.format(worst.basePressure)} kPa`;
      drawDiagram(latest, result, people);
      fillTables(latest, result);
    }
    return {
      render,
      update(model, isValid) {
        latest = model;
        valid = isValid;
        render();
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
      anchors,
      trimColour,
      houseWindows,
      houseBasementWindows,
      windowMuntins,
      syncTimberSizes
    } = createControls($);
    const legacyBasementFields = new Set(Object.keys(houseBasementWindows).flatMap((key) => ["Width", "Height", "Offset", "Sill"].map((suffix) => key + suffix)));
    const isCalculatedClearance = (key, selectedAnchors = anchors) => Object.keys(anchors).some((side) => key === side + (selectedAnchors[side] === "Bottom" ? "Top" : "Bottom"));
    const roofGuidance = $("roof-guidance");
    const tileLayoutGuidance = $("tile-layout-guidance");
    const roofLayoutGuidance = $("roof-layout-guidance");
    const storageStatus = $("storage-status");
    const exportButton = $("export-settings");
    const bom = createBomView($);
    const loads = createLoadsView($);
    createWorkspaceTabs($, [
      { button: "show-designer", panel: "designer-view" },
      { button: "show-bom", panel: "bom-view", onShow: bom.render },
      { button: "show-loads", panel: "loads-view", onShow: loads.render }
    ]);
    const dimensions = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });
    const millimetres = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });
    const fmt = (n) => dimensions.format(n);
    const mm = (n) => `${millimetres.format(n)} mm`;
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
    let roundedMillimetres = false;
    function restoreSettings(saved2) {
      if (!saved2 || saved2.version !== 1 || !saved2.fields || !saved2.layers || !saved2.anchors) return false;
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
        for (const key of Object.keys(houseWindows)) converted[key + "Sill"] = oldValue(key + "Sill") + slabThickness;
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
      for (const [key, input] of Object.entries(fields)) {
        if (isCalculatedClearance(key, saved2.anchors)) continue;
        const value = (["houseBaseRecession", "doorThickness", "baseBoardWidth", "coverBoardWidth", "flashingHeight"].includes(key) || legacyBasementFields.has(key)) && savedFields[key] === void 0 ? input.dataset.initial : savedFields[key];
        if (typeof value !== "string" || value.trim() === "" || !Number.isFinite(Number(value))) return false;
        if (input.tagName === "SELECT") {
          if (Number(value) < 0 || Number(value) > 5e4 || Number(value) === 0 && !hasOption(input, "0")) return false;
          const choices = key === "studDepth" || key === "rafterDepth" ? [...new Set(timberSections.map((item) => item.depth))] : [...input.options].map((option) => Number(option.value));
          const nearest = choices.reduce((best, n) => Math.abs(n - Number(value)) < Math.abs(best - Number(value)) ? n : best);
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
      if (!hasOption(footingLayout, saved2.footingLayout) || !hasOption(roofDisplay, saved2.roofDisplay) || !hasOption(roofMaterial, savedRoofMaterial) || !hasOption(roofFinish, savedRoofFinish) || !hasOption(doorHanding, saved2.doorHanding) || !["3d", "front", "left", "right", "plan"].includes(saved2.view) || typeof saved2.groundHidden !== "boolean" || !["Bottom", "Top"].includes(saved2.anchors.front) || !["Bottom", "Top"].includes(saved2.anchors.right)) return false;
      if (saved2.windowMuntins !== void 0 && !Object.entries(windowMuntins).every(([key, input]) => hasOption(input, saved2.windowMuntins?.[key]))) return false;
      if (saved2.doorWindow !== void 0 && !hasOption(doorWindow, saved2.doorWindow)) return false;
      for (const [key, input] of Object.entries(fields)) {
        if (key !== "studDepth" && key !== "rafterDepth" && !isCalculatedClearance(key, saved2.anchors)) {
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
      anchors.front = saved2.anchors.front;
      anchors.right = saved2.anchors.right;
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
        groundHidden,
        anchors: { ...anchors }
      };
    }
    function persistSettings() {
      storageStatus.textContent = saveSettings(settingsSnapshot());
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
        if (isCalculatedClearance(key)) continue;
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
      const rear = v.frontWallHeight + slope * v.length;
      const eave = v.frontWallHeight - slope * v.frontOverhang;
      const sideSpan = v.length - v.wallThickness;
      const frontSpan = v.width - 2 * v.wallThickness;
      if (sideSpan <= 0 || frontSpan <= 0) flag("The wall thickness leaves no clear interior span.", "wallThickness", "width", "length");
      if (v.houseBaseHeight + 1 > v.houseWallHeight) {
        flag("The concrete base must end below the top of the existing house wall.", "houseBaseHeight", "houseWallHeight");
      }
      if (![2, 3].includes(footingColumns) || ![2, 3].includes(footingRows)) {
        flag("Choose a pier grid from the list.", footingLayout.id);
      } else if (footingColumns * v.footingDiameter >= v.width || footingRows * v.footingDiameter >= v.length) {
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
      const doorEnd = v.offset + v.doorWidth;
      if (doorEnd > sideSpan) flag("The left-side door extends into the front wall.", "offset", "doorWidth", "length", "wallThickness");
      if (v.doorHeight > rear - slope * doorEnd) flag("The left-side door reaches above the roofline at its front edge.", "doorHeight", "frontWallHeight", "pitch");
      if (eave <= 0) flag("The front roof edge reaches slab level. Reduce the pitch or front overhang, or raise the front wall.", "pitch", "frontOverhang", "frontWallHeight");
      const windows = {};
      for (const [side, anchor] of Object.entries(anchors)) {
        const w = v[side + "Width"];
        const h = v[side + "Height"];
        const isFront = side === "front";
        const span = isFront ? frontSpan : sideSpan;
        const start = (span - w) / 2 + (isFront ? v.wallThickness : 0);
        const end = start + w;
        const available = (isFront ? v.frontWallHeight : rear - slope * end) - h;
        const complement = available - v[side + anchor];
        const other = anchor === "Bottom" ? "Top" : "Bottom";
        fields[side + other].value = Number.isFinite(complement) ? Math.round(complement) : "";
        if (w > span) flag(`The ${side} window is wider than its clear wall span.`, side + "Width", isFront ? "width" : "length", "wallThickness");
        if (complement < -1e-8) flag(`The ${side} window does not fit between the slab and the roofline.`, side + "Height", side + anchor, side + other);
        const bottom = anchor === "Bottom" ? v[side + anchor] : Math.max(0, complement);
        if (bottom <= 2 * v.studWidth) {
          const message = `Raise the ${side} window: doubled studs below the sill need space above the bottom plate.`;
          sillMessages.add(message);
          flag(message, side + anchor, side + other, "studWidth");
        }
        windows[side] = { start, end, bottom, top: bottom + h };
      }
      const origin = -v.slabOriginOffset;
      const houseA = origin + v.houseWallLeft, houseB = houseA + v.houseWallWidth;
      const houseOpenings = Object.keys(houseWindows).map((key) => {
        const left = key === "houseLeft" ? origin : key === "houseRight" ? origin + v.houseLeftWidth + v.houseWindowGap : origin + v.houseUpperOffset - v.houseUpperWidth / 2;
        const right = left + v[key + "Width"];
        const sill = v[key + "Sill"] - v.slabThickness;
        const head2 = sill + v[key + "Height"];
        if (left < houseA || right > houseB) {
          flag(
            `${houseWindows[key].label} extends beyond the sides of the house wall.`,
            "houseWallLeft",
            "houseWallWidth",
            key + "Width",
            key === "houseRight" ? "houseWindowGap" : key + "Offset"
          );
        }
        if (head2 > v.houseWallHeight - v.slabThickness) {
          flag(`${houseWindows[key].label} extends above the house wall.`, "houseWallHeight", key + "Height", key + "Sill");
        }
        return { key, left, right, sill, head: head2 };
      });
      const basementOpenings = Object.entries(houseBasementWindows).map(([key, { label }]) => {
        const centre = origin + v[key + "Offset"];
        const halfWidth = v[key + "Width"] / 2;
        const sill = v[key + "Sill"];
        const head2 = sill + v[key + "Height"];
        if (centre - halfWidth < houseA || centre + halfWidth > houseB) {
          flag(`${label} extends beyond the sides of the house wall.`, "houseWallLeft", "houseWallWidth", key + "Width", key + "Offset");
        }
        if (v.houseBaseHeight > 0 && head2 > v.houseBaseHeight) {
          flag(`${label} extends beyond the concrete base.`, "houseBaseHeight", key + "Height", key + "Sill");
        }
        return { key, left: centre - halfWidth, right: centre + halfWidth, sill, head: head2 };
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
        loads.update(latest, false);
        return false;
      }
      settingsValid = true;
      roofLayoutGuidance.textContent = `Roof width: ${mm(v.roofWidth)}. Door-side (left) overhang: ${mm(v.doorSideOverhang)}. Opposite (right) overhang: ${mm(rightOverhang)}. Width increments: ${mm(roofStep)}.`;
      if (roofMaterial.value === "tiles") {
        const tile = tileSystems[v.tileWidth];
        tileLayoutGuidance.textContent = `${tile.label}: ${mm(tile.width)} wide \xD7 ${mm(tile.length)} long; ${mm(tile.width - v.tileWidth)} side overlap and ${mm(tile.length - v.tileLength)} headlap. Layout: ${v.roofWidth / v.tileWidth} whole covering modules \xD7 ${mm(v.tileWidth)} = ${mm(v.roofWidth)} roof width. Maximum batten gauge at this pitch: ${mm(tileGaugeLimit(v.pitch))}.`;
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
      const flashing = standingFlashing(latest);
      const upper = houseOpenings.find((window) => window.key === "houseUpper");
      const top = v.houseWallHeight - v.slabThickness;
      const extension = sillExtension(upper.right - upper.left);
      const fall = Math.min(16, (upper.head - upper.sill) * 0.1);
      const head = Math.min(upper.head + houseTrim + 12, top);
      const surround = [
        [Math.max(houseA, upper.left - houseTrim), Math.min(houseB, upper.right + houseTrim), upper.sill, Math.min(top, upper.head + houseTrim), 22],
        [Math.max(houseA, upper.left - extension), Math.min(houseB, upper.right + extension), upper.sill - fall - Math.min(9, fall), upper.sill, sillProjection]
      ];
      if (head >= upper.head + houseTrim + 10) {
        surround.push([Math.max(houseA, upper.left - houseTrim - 8), Math.min(houseB, upper.right + houseTrim + 8), upper.head + houseTrim, head, sillProjection]);
      }
      const touches = surround.some(([left, right, bottom, top2, projection]) => flashing.left <= right && flashing.right >= left && flashing.bottom - slope * projection <= top2 && flashing.top >= bottom);
      $("flashing-warning").textContent = touches ? "Warning: the standing flashing (st\xE5ndskiva) or its apron touches or overlaps the existing upper window or its surround. Adjust the roof or window layout and consult a roofer." : "";
      bom.update(latest, true);
      loads.update(latest, true);
      $("area").textContent = `${fmt(v.width * v.length / 1e6)} m\xB2`;
      $("rear").textContent = mm(rear);
      $("rise").textContent = mm(slope * v.length);
      $("assembly").textContent = `Slab: ${mm(v.slabThickness)} thick. Walls: ${mm(v.wallThickness)} thick. ${footingColumns * footingRows} piers (${footingColumns} \xD7 ${footingRows}): ${mm(v.footingDiameter)} diameter by ${mm(v.footingDepth)} deep below the slab.`;
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
        hedgeDistance,
        hedgeHeight,
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
      const labels = [];
      const dims = [];
      const face = (points, fill, extra = {}) => shapes.push(["polygon", points, { class: "face", fill, ...extra }]);
      const line = (a, b, cls, extra = {}) => shapes.push(["line", [a, b], { class: cls, ...extra }]);
      const note = (at, text2, dy = 0, anchor = "middle") => labels.push({ at, text: text2, dy, anchor });
      const dimension = (a, b, gap, text2) => dims.push({ a, b, gap, text: text2 });
      const ground = (x, y) => [x, y, 0];
      const roofLeft = -doorSideOverhang, roofRight = roofLeft + roofWidth;
      const planMargin = Math.max(360, doorSideOverhang + 170, rightOverhang + 170);
      const houseWallHeight = houseHeightAboveGround - slabThickness;
      const houseAt = (x, z) => [x, 0, z];
      const houseBaseAt = (x, z) => [x, -houseBaseRecession, z];
      const roofDepth = rafterDepth * Math.hypot(1, slope);
      const tileRun = tileLength / Math.hypot(1, slope);
      const roof = [[roofLeft, 0, R + roofDepth], [roofRight, 0, R + roofDepth], [roofRight, L + F, E + roofDepth], [roofLeft, L + F, E + roofDepth]];
      const roofAt = (x, y, offset2 = 0) => [x, y, R - slope * y + roofDepth + offset2];
      const flashing = standingFlashing(latest);
      const slab = [ground(0, 0), ground(W, 0), ground(W, L), ground(0, L)];
      const frontAt = (x, z) => [x, L, z];
      const sideAt = (x) => (y, z) => [x, y, z];
      const slabBase = -slabThickness;
      const houseBaseTop = slabBase + houseBaseHeight;
      const houseBaseColor = "#d5d5d5";
      const footingBase = slabBase - footingDepth;
      const { radius: pierRadius, rows: pierRows, columns: pierColumns } = pierLayout(latest);
      const gradeMargin = Math.min(350, W * 0.2, L * 0.2);
      const hedgeHalfDepth = 450;
      const sideGradeEnd = Math.max(L, hedgeDistance + hedgeHalfDepth) + gradeMargin;
      const grade = [
        [roofLeft - gradeMargin, 0, slabBase],
        [roofRight + gradeMargin, 0, slabBase],
        [roofRight + gradeMargin, L + F + gradeMargin, slabBase],
        [roofLeft - gradeMargin, L + F + gradeMargin, slabBase]
      ];
      const door = { start: offset, end: offset + doorWidth, bottom: 0, top: doorHeight };
      const rtl = doorHanding.value === "rtl";
      const hingeY = rtl ? door.end : door.start;
      const swingPoint = (angle, distance, height = 0) => [-Math.sin(angle) * distance, hingeY + (rtl ? -1 : 1) * Math.cos(angle) * distance, height];
      const doorPoint = (angle, distance, depth, height) => {
        const [x, y, z] = swingPoint(angle, distance, height);
        return [x + Math.cos(angle) * depth, y + (rtl ? -1 : 1) * Math.sin(angle) * depth, z];
      };
      const swingArc = Array.from({ length: 25 }, (_, i) => swingPoint(i * Math.PI / 48, doorWidth));
      const doorVisible = plan || iso || view === "left";
      const wallTop = (y) => R - slope * y;
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
          const n = cross(subtract(points[i], origin), subtract(points[i + 1], origin));
          const length = Math.hypot(...n);
          if (length > epsilon) return n.map((v) => v / length);
        }
      }
      function timberPrism(outer2, inner2, kind, colour, extra) {
        const centre = outer2[0].map((_, i) => (outer2[0][i] + outer2[2][i] + inner2[0][i] + inner2[2][i]) / 4);
        const sides = outer2.map((p, i) => {
          const j = (i + 1) % outer2.length;
          return [p, outer2[j], inner2[j], inner2[i]];
        });
        for (const [i, points] of [outer2, inner2, ...sides].entries()) {
          const n = plane(points);
          if (!n || dot(n, camera) * dot(n, subtract(points[0], centre)) <= epsilon) continue;
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
        const top = (x) => [[x, 0, R + roofDepth], [x + rafterWidth, 0, R + roofDepth], [x + rafterWidth, y, E + roofDepth], [x, y, E + roofDepth]];
        if (!plan && !iso && !front) {
          const x = side === "left" ? roofLeft : roofRight;
          lumber([[x, 0, R], [x, y, E], [x, y, E + roofDepth], [x, 0, R + roofDepth]], "rafter");
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
        const halfCover = pitch2 * 0.27;
        const edge = Math.min(22, pitch2 * 0.08);
        for (let i = 0; start + i * pitch2 - halfCover < end; i++) {
          const centre = start + i * pitch2;
          const a = centre - halfCover, b = centre + halfCover;
          strip(a, b, bottom, high, i % 3 ? "#fff7df" : "#f8dead", "cladding-cover", 0.28);
          strip(a, a + edge, bottom, high, "#fff7e2", "cladding-highlight", 0.62);
          strip(b - edge / 2, b, bottom, high, "#795a35", "cladding-return", 0.28);
          strip(b, b + edge, bottom, high, "#64492d", "cladding-shadow", 0.27);
          strip(b + pitch2 * 0.15, b + pitch2 * 0.17, bottom, high, "#754e2c", "cladding-grain", 0.14);
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
        if (iso || plan) face(top, "#c7cfc2", { class: "face step-tread" });
      }
      function drawGutter() {
        const y = L + F, lip = E + roofDepth;
        const back = y - 20, edge = y + 110;
        const bottom = Math.max(0, lip - 100);
        const at = (x, u, z) => [x, u, z];
        const left = roofLeft, right = roofRight;
        const outlet = W;
        if (!plan) {
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
        }
        if (iso || front || plan) {
          if (iso || plan) face(
            [at(left, back, lip), at(right, back, lip), at(right, edge, lip), at(left, edge, lip)],
            "#fff",
            { class: "face eave-gutter" }
          );
          if (!plan) face(
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
        const courses = Math.ceil(eaveY / tileRun);
        const elevation = !iso && !front;
        if (elevation ? courses > 80 : count > 65 || iso && count * courses > 1800) {
          note([W / 2, eaveY / 2, R + roofDepth - slope * eaveY / 2], "Tile profiles too dense to show", -10);
          return;
        }
        const at = (x, y, h) => [x, y, R + roofDepth - slope * y + h];
        if (elevation) {
          const x = side === "left" ? start : end;
          for (let row = 0; row < courses; row++) {
            const b = eaveY - row * tileRun;
            const a = Math.max(0, b - tileRun);
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
            face([at(a, 0, h1), at(b, 0, h2), at(b, eaveY, h2), at(a, eaveY, h1)], tone, { class: "tile-facet" });
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
          line(roofAt(x, 0, 8), roofAt(x, L + F, 8), "roof-standing-seam");
          if (pitch < 14 && x + 10 < roofRight) {
            line(roofAt(x + 10, 0, 9), roofAt(x + 10, L + F, 9), "roof-standing-seam");
          }
        }
      }
      function drawStandingFlashing() {
        const { left, right, bottom, top, coverRise } = flashing;
        const apron = Math.min(150, L + F);
        const metal = "#555b5c";
        face(
          [
            roofAt(left, 0, coverRise + 2),
            roofAt(right, 0, coverRise + 2),
            roofAt(right, apron, coverRise + 2),
            roofAt(left, apron, coverRise + 2)
          ],
          metal,
          { class: "face roof-abutment-flashing" }
        );
        if (sideElevation) {
          line([0, 0, bottom], [0, 0, top], "roof-standing-flashing-edge");
        } else if (!plan) {
          face(
            [[left, 1, bottom], [right, 1, bottom], [right, 1, top], [left, 1, top]],
            metal,
            { class: "face roof-standing-flashing" }
          );
        } else {
          line([left, 0, bottom], [right, 0, bottom], "roof-standing-flashing-edge");
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
          roofAt(start, 0, -10),
          roofAt(start + 22, 0, -10),
          roofAt(start + 22, eave, -10),
          roofAt(start, eave, -10)
        ], metal, { class: "face roof-verge-flashing" });
        face([
          roofAt(end - 22, 0, -10),
          roofAt(end, 0, -10),
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
        line(roofAt(start, 0, -15), roofAt(start, eave, -15), "roof-bargeboard");
        line(roofAt(start + 25, 0, -18), roofAt(start + 25, eave, -18), "roof-bargeboard-secondary");
        line(roofAt(end, 0, -15), roofAt(end, eave, -15), "roof-bargeboard");
        line(roofAt(end - 25, 0, -18), roofAt(end - 25, eave, -18), "roof-bargeboard-secondary");
        line(roofAt(start, eave, -15), roofAt(end, eave, -15), "roof-eave-fascia");
        line(roofAt(start, 0, -20), roofAt(end, 0, -20), "roof-underlayment-edge");
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
        const section = (u, d, z) => [u, -d, z];
        const baseSection = (u, d, z) => [u, -houseBaseRecession - d, z];
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
            section,
            { start: w.left, end: w.right, bottom: w.sill, top: w.head },
            facade,
            { key: w.key, pattern: "cross", thickness: 145, trim: houseTrim, trimColour: "#f5efe1" }
          );
        }
        note(houseAt(houseA, houseWallHeight), "Existing house", -9, "start");
      }
      function drawSideWallBasementJunction(which) {
        if (!sideElevation || houseBaseRecession <= 0 || houseBaseHeight <= 0 || !visible("cover") && !visible("studs")) return;
        const x = which === "left" ? 0 : W;
        const at = (y, z) => [x, y, z];
        const foundationTop = Math.min(0, houseBaseTop);
        if (foundationTop > slabBase) {
          face([
            at(-houseBaseRecession, slabBase),
            at(0, slabBase),
            at(0, foundationTop),
            at(-houseBaseRecession, foundationTop)
          ], "#8e9b92", { class: "face side-wall-basement-junction", "data-layer": "cover" });
        }
        const wallBottom = Math.max(0, slabBase);
        if (houseBaseTop > wallBottom) {
          face(
            [
              at(-houseBaseRecession, wallBottom),
              at(0, wallBottom),
              at(0, houseBaseTop),
              at(-houseBaseRecession, houseBaseTop)
            ],
            visible("cover") ? wallColour.cover : wallColour.studs,
            { class: "face side-wall-basement-junction", "data-layer": visible("cover") ? "cover" : "studs" }
          );
        }
        line(
          at(-houseBaseRecession, slabBase),
          at(-houseBaseRecession, houseBaseTop),
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
      function drawWall(section, length, top, op, name) {
        const isSide = name !== "front";
        for (const [key] of [...wallLayers].reverse()) {
          if (!visible(key) || key === "trim" || key === "cavity") continue;
          const [depth] = bands[key];
          const at2 = (u, z) => section(u, depth, z);
          if (key === "studs") {
            drawWallFrame((u, d, z) => section(u, depth + d, z), 0, isSide ? length - T : length, top, op, name !== "door");
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
              paint(a, a + edge, low, high, "#fff2d6", "cladding-highlight", 0.62);
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
          drawWallFrame((u, d, z) => section(u, bands.studs[0] + d, z), 0, isSide ? length - T : length, top, op, name !== "door");
        }
        const at = (u, z) => section(u, 0, z);
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
            drawWindow(face, section, op, { start: 0, end: length, top }, {
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
              { "data-layer": "trim", stroke: trimColour.value, "stroke-width": 3 }
            );
          }
        }
        if (isDoor || timberOnly) {
          line(
            at(opening.start, T / 2),
            at(opening.end, T / 2),
            isDoor ? "door-opening" : "window-opening",
            { style: "stroke:#9a693c;stroke-width:2;stroke-dasharray:4 4" }
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
        const points = (profile) => profile.map(([offset2, height]) => [0, hedgeDistance + offset2 * hedgeHalfDepth, slabBase + hedgeHeight * height]);
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
        const plant = (centre, profile, colour, kind) => face(
          profile.map(([offset2, height]) => [0, hedgeDistance - hedgeHalfDepth - centre + offset2 * plantScale, slabBase + height * plantScale]),
          colour,
          { class: `hedge-plant ${kind}` }
        );
        for (const [centre, size] of [[200, 0.85], [460, 1]]) {
          for (const [reach, height, colour] of [
            [-170, 176, "#416c45"],
            [-112, 267, "#518052"],
            [-32, 310, "#648d52"],
            [84, 260, "#527949"],
            [162, 192, "#3f6840"]
          ]) {
            plant(centre, [
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
        for (const [centre, height, colour] of [
          [70, 156, "#e1bd60"],
          [110, 205, "#c484ad"],
          [310, 170, "#e1bd60"],
          [365, 145, "#b586b8"],
          [550, 196, "#c484ad"]
        ]) {
          plant(centre, [[0, 0], [-4, height], [4, height], [7, 0]], "#496c40", "flower-stem");
          plant(centre, [[2, height * 0.32], [34, height * 0.55], [18, height * 0.34]], "#5d894e", "flower-leaf");
          plant(centre, Array.from({ length: 20 }, (_, i) => {
            const angle = 2 * Math.PI * i / 20;
            const radius = i % 4 === 2 ? 14 : 32;
            return [radius * Math.cos(angle), height + radius * Math.sin(angle)];
          }), colour, "flower-bloom");
        }
      }
      if (!groundHidden) {
        if (iso || plan) {
          face(grade, "#a8c987", { class: "ground-plane" });
          face(roof.map(([x, y]) => [x, y, slabBase]), "#94b575", { class: "roof-ground-projection" });
        } else if (front) line(frontAt(-gradeMargin, slabBase), frontAt(W + gradeMargin, slabBase), "ground-line");
        else line([0, 0, slabBase], [0, sideGradeEnd, slabBase], "ground-line");
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
        const planA = Math.max(houseA, -planMargin), planB = Math.min(houseB, W + planMargin);
        if (planA < planB) {
          face(
            [ground(planA, -Math.min(520, L * 0.22)), ground(planB, -Math.min(520, L * 0.22)), ground(planB, 0), ground(planA, 0)],
            houseColor,
            { class: "face house-plan" }
          );
        }
        face(slab, "#f8f6e8");
        if (groundHidden) drawPiers();
        if (groundHidden && (roofTiles || roofFraming)) face(roof, "none", { style: `stroke:${roofPaint}`, "stroke-dasharray": "7 5" });
        planWall((u, d) => ground(d, u), L - T, door, "door");
        planWall((u, d) => ground(W - d, u), L - T, windows.right, "right");
        planWall((u, d) => ground(u, L - d), W, windows.front, "front");
        drawEntryStep();
        if (roofFraming) drawRafters();
        if (roofTiles) {
          drawStandingFlashing();
          drawGutter();
        }
        shapes.push(["door-leaf", []]);
        if (planA < planB) note(ground((planA + planB) / 2, -Math.min(260, L * 0.11)), "Existing house", -7);
        note(ground(T, (door.start + door.end) / 2), "Left door", -9, "start");
        dimension(ground(0, L + F), ground(W, L + F), [0, 35], mm(W));
        dimension(ground(roofLeft, 0), ground(roofLeft, L), [-43, 0], mm(L));
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
          const baseline = groundHidden ? footingBase : slabBase;
          dimension(frontAt(0, baseline), frontAt(W, baseline), [0, 38], mm(W));
        }
        if (iso || !front) {
          if (!iso) {
            if (houseBaseHeight > 0) {
              line(
                [0, -houseBaseRecession, slabBase],
                [0, -houseBaseRecession, houseBaseTop],
                "house-concrete-base",
                { stroke: houseBaseColor, "stroke-width": 3 }
              );
              if (houseBaseRecession > 0) {
                line(
                  [0, -houseBaseRecession, slabBase],
                  [0, 0, slabBase],
                  "house-concrete-base",
                  { stroke: houseBaseColor, "stroke-width": 3 }
                );
                line(
                  [0, -houseBaseRecession, houseBaseTop],
                  [0, 0, houseBaseTop],
                  "house-base-reveal",
                  { stroke: "#858b81", "stroke-width": 2 }
                );
              }
            }
            line(
              [0, 0, houseBaseTop],
              [0, 0, houseWallHeight],
              "face",
              { style: "stroke:#778a7b;stroke-width:2;stroke-dasharray:5 4" }
            );
            note([0, 0, houseWallHeight], "House wall", -9);
          }
          foundation(sideAt(side === "right" ? W : 0), L, "#8e9b92");
          drawWall(sideSection(side), L, wallTop, side === "left" ? door : windows.right, side === "left" ? "door" : "right");
          const x = side === "right" ? W : 0;
          const baseline = groundHidden ? footingBase : slabBase;
          dimension([x, 0, baseline], [x, L, baseline], [0, 38], mm(L));
        }
        if (sideElevation) drawSideWallBasementJunction(side);
        orderScene(wallScene);
        if (doorVisible) shapes.push(["door-leaf", []]);
        drawEntryStep();
        if (roofFraming) {
          const rafters = shapes.length;
          drawRafters();
          orderScene(rafters);
        } else if (roofTiles && (iso || front)) {
          if (iso) face([roof[0], roof[3], [roofLeft, L + F, E], [roofLeft, 0, R]], material === "tiles" ? tileEdgeTones[0] : roofPaint);
          face(roof, roofPaint, { class: "face roof-covering" });
          face([roof[2], roof[3], [roofLeft, L + F, E], [roofRight, L + F, E]], material === "tiles" ? tileEdgeTones[0] : roofPaint);
          drawRoofCovering();
          drawRoofEdgeDetails();
        }
        if (!iso && !front) {
          if (roofTiles) {
            face([[0, 0, R], [0, L + F, E], [0, L + F, E + roofDepth], [0, 0, R + roofDepth]], roofPaint);
            drawRoofCovering();
            drawRoofEdgeDetails();
          }
          if (roofTiles || roofFraming) {
            note([0, (L + F) / 2, (R + E) / 2 + roofDepth + (roofTiles && material === "tiles" ? tileRise : 0)], `${fmt(pitch)}\xB0 pitch`, -13);
          }
        }
        if (roofTiles) drawGutter();
        if (sideElevation) {
          drawHedge();
          drawHedgePlanting();
        }
        if (front) dimension(frontAt(0, 0), frontAt(0, H), [-43, 0], mm(H));
      }
      const bounds = [...shapes.flatMap(([, points]) => points), ...roof];
      if (iso || plan) bounds.push(...grade);
      else if (front) bounds.push(frontAt(-gradeMargin, slabBase), frontAt(W + gradeMargin, slabBase));
      else bounds.push([0, sideGradeEnd, slabBase]);
      if (!plan) bounds.push([0, 0, footingBase], [W, L, footingBase], [0, L, footingBase]);
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
      function node(tag, attrs, text2, parent = layer) {
        const el2 = document.createElementNS(ns, tag);
        for (const [key, value] of Object.entries(attrs)) el2.setAttribute(key, value);
        if (text2 !== void 0) el2.textContent = text2;
        parent.append(el2);
        return el2;
      }
      function stroke(a, b, attrs, parent = layer) {
        node("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], ...attrs }, void 0, parent);
      }
      function measurementSpecs(section) {
        const m = (key, label, a, b, visible2 = true, value = latest[key], gap = [0, -12]) => ({ key, label, a, b, visible: visible2, value, gap, vertical: a[2] !== b[2] && a[0] === b[0] && a[1] === b[1] });
        const left = view === "left", right = view === "right";
        const onFacade = iso || front;
        const x = pierColumns[0], y = pierRows[pierRows.length - 1];
        switch (section) {
          case "slab":
            return [
              m("width", "Slab width", [0, L, 0], [W, L, 0], iso || front || plan, W, [0, 16]),
              m("length", "Slab length", [0, 0, 0], [0, L, 0], !front, L, plan ? [-15, 0] : [0, 28]),
              m("slabThickness", "Slab thickness", [0, L, slabBase], [0, L, 0], !plan, slabThickness, [-16, 0])
            ];
          case "footings":
            return [
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
              m("offset", "Offset from house", [0, 0, 0], [0, door.start, 0], doorVisible, offset, [0, 12]),
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
            const w = windows[section], isFront = section === "front";
            const at = isFront ? frontAt : sideAt(W);
            const usable = isFront ? onFacade : right;
            const top = isFront ? H : wallTop(w.end);
            return [
              m(section + "Width", "Window width", at(w.start, w.top), at(w.end, w.top), usable || plan),
              m(section + "Height", "Window height", at(w.start, w.bottom), at(w.start, w.top), usable, void 0, [-14, 0]),
              m(section + "Bottom", "Bottom clearance", at(w.end, 0), at(w.end, w.bottom), usable, w.bottom, [12, 0]),
              m(section + "Top", "Top clearance", at(w.end, w.top), at(w.end, top), usable, top - w.top, [12, 0]),
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
            const centre = ([a, b]) => (a + b) / 2;
            const p = posts[0] || [0, studWidth], z = H * 0.4;
            const exposed = visible("studs") && (plan || onFacade && !["cover", "base", "wind", "exterior"].some(visible));
            const at = (u, z2) => frontSection(u, bands.studs[0], z2);
            return [
              m(
                "studSpacing",
                "Stud centres",
                at(pair > 0 ? centre(posts[pair - 1]) : 0, z),
                at(pair > 0 ? centre(posts[pair]) : studSpacing, z),
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
                [roofLeft, 0, flashing.bottom],
                [roofLeft, 0, flashing.top],
                roofTiles && !plan,
                latest.flashingHeight,
                [-12, 0]
              )
            ];
          case "roofTiles": {
            const y2 = L + F, x2 = roofLeft, z = E + roofDepth;
            return [
              m("tileWidth", "Tile covering width", [x2, y2, z], [x2 + tileWidth, y2, z], roofTiles && material === "tiles" && onFacade && tileWidth <= roofWidth),
              m("tileLength", "Exposed tile length", [x2, y2, z], [x2, y2 - tileRun, z + slope * tileRun], roofTiles && material === "tiles" && (iso || left || right) && tileRun <= y2),
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
            const startY = (L + F) / 2, startZ = R - slope * startY;
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
              )
            ];
          case "hedge":
            return [
              m(
                "hedgeDistance",
                "Distance from house",
                [0, 0, slabBase],
                [0, hedgeDistance, slabBase],
                sideElevation,
                hedgeDistance,
                [0, 17]
              ),
              m(
                "hedgeHeight",
                "Hedge height",
                [0, hedgeDistance, slabBase],
                [0, hedgeDistance, slabBase + hedgeHeight],
                sideElevation,
                hedgeHeight,
                side === "left" ? [20, 0] : [-20, 0]
              )
            ];
          default: {
            const basement = basementOpenings.find((w2) => w2.key === section);
            if (basement) {
              const centre = (basement.left + basement.right) / 2;
              const sill = slabBase + basement.sill, head = slabBase + basement.head;
              return [
                m(section + "Width", "Window width", houseBaseAt(basement.left, head), houseBaseAt(basement.right, head), onFacade),
                m(section + "Height", "Window height", houseBaseAt(basement.left, sill), houseBaseAt(basement.left, head), onFacade, void 0, [-12, 0]),
                m(section + "Offset", "Centre from origin", houseBaseAt(-slabOriginOffset, sill), houseBaseAt(centre, sill), onFacade, void 0, [0, 13]),
                m(section + "Sill", "Sill height", houseBaseAt(basement.right, slabBase), houseBaseAt(basement.right, sill), onFacade, void 0, [13, 0])
              ];
            }
            const w = houseOpenings.find((w2) => w2.key === section);
            if (!w) return [];
            const c = (w.left + w.right) / 2;
            return [
              m(section + "Width", "Window width", houseAt(w.left, w.head), houseAt(w.right, w.head), onFacade),
              m(section + "Height", "Window height", houseAt(w.left, w.sill), houseAt(w.left, w.head), onFacade, void 0, [-12, 0]),
              ...section === "houseUpper" ? [m(
                section + "Offset",
                "Centre from origin",
                houseAt(-slabOriginOffset, w.sill),
                houseAt(c, w.sill),
                onFacade,
                void 0,
                [0, 13]
              )] : [],
              m(section + "Sill", "Sill height", houseAt(w.right, slabBase), houseAt(w.right, w.sill), onFacade, void 0, [13, 0])
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
        const guide = (tag, attrs, text2) => node(tag, attrs, text2, overlay);
        function arrow([x, y], [u, v]) {
          const n = Math.hypot(u - x, v - y);
          const dx = (u - x) / n, dy = (v - y) / n;
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
          guide("text", { x: 54, y, class: "guide-key" }, `${spec.label}: ${spec.angle ? `${fmt(spec.value)}\xB0` : mm(spec.value)}`);
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
            const centre = w / 2, radius = w * 0.3, base = h * 0.85 - radius;
            const arch = (r, apron = 0) => [
              ...Array.from({ length: 25 }, (_, i) => [
                centre + r * Math.cos(i * Math.PI / 24),
                surface.depth,
                base + r * Math.sin(i * Math.PI / 24)
              ]),
              ...apron ? [[centre - r, surface.depth, base - apron], [centre + r, surface.depth, base - apron]] : []
            ];
            surface.parts.push(
              polygon(arch(radius + rim, rim), surface.colour, "glazing-frame"),
              polygon(arch(radius), glassColor, "glass")
            );
            const half = 6, reach = Math.sqrt(radius * radius - half * half);
            for (const angle of [Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4]) {
              const sin = Math.sin(angle), cos = Math.cos(angle);
              surface.parts.push(polygon([
                [centre - half / sin, surface.depth, base],
                [centre + half / sin, surface.depth, base],
                [centre + cos * reach + sin * half, surface.depth, base + sin * reach - cos * half],
                [centre + cos * reach - sin * half, surface.depth, base + sin * reach + cos * half]
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
      const names = { "3d": "3D porch sketch", front: "Front elevation", left: "Left elevation", right: "Right elevation", plan: "Top-down plan" };
      node("title", { id: "drawing-title" }, timberOnly ? `${names[view]} \u2014 wall timber` : names[view], group);
      paintDoor = void 0;
      doorButton.disabled = !doorVisible;
      doorButton.title = doorVisible ? "Preview the outward door swing" : "Available in 3D, Left, and Plan";
      for (const [tag, points, attrs, original] of shapes) {
        if (tag === "door-leaf") drawDoorLeaf();
        else drawShape(tag, points, attrs, original);
      }
      for (const { a, b, gap, text: text2 } of dims) {
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
        }, text2);
      }
      for (const { at, text: text2, dy, anchor } of labels) {
        const [x, y] = project(at);
        node("text", { x, y: y + dy, "text-anchor": anchor, class: "annotation" }, text2);
      }
      group.append(layer);
      drawingLayer = layer;
      applyZoom();
      svg.replaceChildren(group);
      paintMeasurements = drawMeasurements;
      paintMeasurements();
      groundButton.textContent = groundHidden ? "Show ground" : "Hide ground";
      const framingNotes = [];
      if (visible("studs") && !visible("cover")) framingNotes.push(`Studs: ${fmt(studWidth)} \xD7 ${mm(studDepth)} at ${mm(studSpacing)} centres.`);
      if (roofFraming) framingNotes.push(`Rafters: ${fmt(rafterWidth)} \xD7 ${mm(rafterDepth)} at ${mm(rafterSpacing)} centres.`);
      $("framing-summary").hidden = !framingNotes.length;
      $("framing-summary").textContent = [...framingNotes, "Framing is schematic; member sizes and spans are not structurally verified."].join(" ");
      if (persistenceEnabled && settingsValid) persistSettings();
    }
    form.addEventListener("toggle", () => {
      const section = activeSection();
      if (section !== guideSection) {
        guideSection = section;
        showMeasurements();
      }
    }, true);
    form.addEventListener("focusin", ({ target }) => {
      if (fields[target.id] === target) {
        guideSection = activeSection();
        showMeasurements(target.id);
      }
    });
    form.addEventListener("input", ({ target }) => {
      persistenceEnabled = true;
      if (target === trimColour || Object.values(windowMuntins).includes(target)) {
        render();
        return;
      }
      for (const side of Object.keys(anchors)) {
        if (target.name === side + "Top") anchors[side] = "Top";
        if (target.name === side + "Bottom") anchors[side] = "Bottom";
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
      anchors.front = anchors.right = "Bottom";
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
      if (!event.ctrlKey || !event.deltaY) return;
      event.preventDefault();
      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? 240 : 1;
      const next = Math.max(1, Math.min(4, zoom * Math.exp(-event.deltaY * unit * 2e-3)));
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
      render();
    });
    doorWindow.addEventListener("change", () => {
      persistenceEnabled = true;
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
    } else if (valid && restored && (adjustedStockSizes.length || adjustedRoofSettings || adjustedTrims || migratedHouseReference || roundedMillimetres)) {
      const notices = [];
      if (adjustedStockSizes.length) notices.push(`Saved dimensions adjusted to listed stock sizes: ${adjustedStockSizes.map((key) => `${key} = ${fields[key].value} mm`).join(", ")}. Review these changes before ordering.`);
      if (adjustedRoofSettings) notices.push("Saved roof settings were migrated to total roof width and door-side overhang, or adjusted to the selected tile module and pitch-dependent batten gauge.");
      if (adjustedTrims) notices.push("Saved opening trims were unified using the door trim width and colour.");
      if (migratedHouseReference) notices.push("Saved house and slab positions were converted to the left-window origin.");
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
