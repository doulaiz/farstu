# Farstu Designer

Plan an enclosed entrance porch (*farstu*) against an existing house: explore the design, estimate materials, and produce preliminary Swedish *Anmälan* drawings.

## Part 1: Using the app

### Open the planner

**[Open Farstu Designer on GitHub Pages](https://doulaiz.github.io/farstu/index.html)**

You can also download and extract the [project ZIP](https://github.com/doulaiz/farstu/archive/refs/heads/master.zip), then open [index.html](./index.html) in your browser. Keep the accompanying folders together. There is nothing to install to use the downloaded app.

### The three workspaces

Use the buttons at the top to switch workspaces; all share the same design.

| Workspace | What it is for |
| --- | --- |
| **Designer** | Set dimensions and explore the porch in 3D, elevations and Top view. |
| **Lumber BOM & prices** | Review a lumber bill of materials, cut lists, stock matches and a separate roofing and drainage schedule. Enter supplier quotes to estimate costs. |
| **Drawings** | Review four preliminary Swedish Anmälan sheets and print them as an A3 PDF. |

#### Designer

Start with the existing house, then place and size the new porch:

Lengths are entered and displayed in whole millimetres; calculated geometry retains its precision. Older fractional dimensions are rounded on loading, with a notice. Angles, areas and prices can still show decimals.

Designer and estimate views use non-breaking spaces to group thousands, decimal points and SI-style spacing before unit and percent symbols.

1. **Existing house:** enter the wall, cladding, entry and window measurements. The two window tables contain five house and four basement windows, with dimensions in millimetres. Centres are measured from the origin at ground level below the left edge of the left main window, viewed facing the house. The left main centre follows its width; the right main centre follows the clear gap in **Position and window spacing**. House sills are above ground; basement sills are above the bottom of the concrete base. The four additional windows are present by default, including in older saved designs; their assumed dimensions and positions must be checked and updated. Set existing cladding widths and thicknesses independently of the porch boards; their spacing is shared.
2. **Foundation:** set the slab width, length and thickness, then choose the pier grid, diameter and depth. Width runs across the front; length runs from the basement face (or the façade if there is no concrete base).
3. **Openings:** configure the left-side door and the front and right windows. Window sizes describe rough openings, not finished frames. Bottom clearance is above the slab; left clearance is from the inside corner of the clear wall span as viewed from outside (the left wall for the front window, the front wall for the right). Choose door glazing, handing, window muntins and shared opening trim.
4. **Walls:** choose wall thickness, cladding, framing sections and spacing. Each window has doubled studs beneath both sill ends; its bottom clearance must exceed twice the stud width.
5. **Roof:** choose standing-seam metal or concrete tiles, pitch, total width and overhangs. Left and right overhangs need not be equal. Adjust the height of the roof-to-house standing flashing (*ståndskiva*); a warning appears if it or its apron touches an existing house window or its surround.

Use the drawing controls to inspect your design:

The porch and existing house share a yellow façade hue; the existing house is lighter.

- **3D, Front, Left, Right and Top view** show different projections. Not every feature is visible from every direction.
- **Top view** shows the existing wall up to 1 m beyond either side of the slab, limited by the configured house wall, and the existing entry with configurable dimensions and position. Its two stair runs each show two schematic 250 mm deep treads; check actual stair dimensions and local requirements. Where there is a concrete base, the slab meets the basement face and the existing wall projects over it by the recession. The green roof footprint runs from the façade to the front overhang. Flashing and gutter are hidden; the hedge is a schematic 900 mm deep band, not a measured length.
- **Property line** is a schematic Designer overlay. Set its distance from the façade under Existing house. It appears in 3D, Top and side views, but it does not set the boundary distances on the A-1 site plan.
- **Roof display** switches between the covering and details, rafters, or a hidden roof.
- **Wall layers** lets you inspect the wall build-up or expose the timber. Hiding layers does not remove materials from the estimate.
- **Open door / Close door** animates the door where it is visible.
- **Hide ground / Show ground** toggles the ground and vertical roof-footprint projection, which is not a sunlight simulation. Elevations show the footprint edge-on as a green ground segment.
- Open a parameter section or focus a dimension to display temporary measurement arrows.
- Use **Alt + mouse wheel** to zoom, and **R** to reset the zoom when you are not typing in a field.

Invalid dimensions are highlighted; correct them to update the drawing and estimates. Normally the last valid design remains visible. The flashing-contact warning is advisory and does not block editing.

#### Lumber BOM & prices

Expand cut lists to inspect required pieces. Follow **Derome article** links to check proposed stock and request prices.

- Enter lumber quotes in **SEK per piece or per metre**.
- Enter roofing and drainage quotes in **SEK per displayed unit**.
- Check stock substitutions and cuts without a stock match before ordering.
- A **quoted subtotal** is incomplete: some items remain unpriced or unmatched.
- Use the same VAT basis for every quote. Unquoted delivery costs and taxes are not added automatically.

Review the separate roofing and drainage schedule, and **Window installation items to quote separately**, before budgeting.

#### Drawings

Use the sheet selector to preview the four A3 SVGs. They update from the latest valid Designer model; if an edit is invalid, the last valid set stays visible and printing is disabled.

Select a drawing in the toolbar or tap/click it on the sheet. Use the zoom and arrow buttons, drag with a mouse or finger, or pinch with two fingers. With the sheet focused, use **+ / −** to zoom and arrow keys to move; **Alt + mouse wheel** zooms under the pointer. **Reset sheet zoom** restores all views on the selected sheet. Navigation changes the preview only; PDF and SVG exports retain their original scales and positions.

| Sheet | Contents | Scale |
| --- | --- | --- |
| **A-1 Situationsplan** | Schematic plot and house, boundary distances, north arrow and estimated BTA/ÖA | 1:400 |
| **A-2 Planritning & grundplan** | Openings, door swing, roof outline, concrete slab, piers and entry step | 1:100 / 1:50 |
| **A-3 Fasadritningar** | Three affected elevations with roof heights and existing/proposed grade | 1:100 |
| **A-4 Sektionsritning & konstruktionsdetaljer** | Section, frost-depth comparison and schematic house-connection and pier details | 1:50 / 1:20 |

1. Open **Site & Permit Details** to set the address, property ID, drawn-by name, orientation, boundary distances from the slab edges, house depth and ridge height, ground offsets from finished floor (FG), frost depth and local snow load for the drawing notes. Blank measurements use the displayed assumptions, such as 4,500 mm boundary offsets and 1.5 kN/m² snow load.
2. Before submitting, use the **KONTROLLERAS** clouds and **Komplettering** notes to identify what still needs verification. Replace the schematic site plan with the municipality's required base map and confirm the applicable permit route and area rules. The 4.5 m and 15 m² warnings are not approvals or evidence of neighbour consent.
3. Choose **Download All Sheets as PDF** to print all four sheets, regardless of which is selected. In the browser dialog, choose **Save as PDF**, **A3 landscape**, **100% / actual size**, and turn off headers and footers. Check the printed scale bar. **Download All Sheets as SVG** downloads four separate A3 SVG files; allow multiple downloads if the browser asks.

### Keeping your work

Settings and quotes are saved in the current browser when storage is available, not in a cloud account. Other browsers, devices and site addresses have separate storage.

**Export settings** downloads a Designer record, but there is **no import feature**. **Reset** restores Designer defaults. Site & Permit Details save separately in this browser and are not included in the Designer export or reset. Read any storage or migration notices when opening saved designs.

### Limits: a planning aid, not a construction design

- **Scope:** one rectangular slab, three new walls and a single-slope roof against a house.
- **Safety:** geometry and connections are schematic, not structural or regulatory approvals. Have spans, fixings, house attachments, foundations, soil capacity, frost protection and weatherproofing checked professionally.
- **Loads:** the app does not calculate structural loads or pier reactions. The snow-load value in the drawings is an unverified note, not a calculation.
- **Costs:** catalogue snapshots are not live stock or prices. Foundations, insulation, labour, window units and installation accessories need separate costing. Lumber allocation is approximate, with a 3 mm saw kerf and no general waste allowance; roof allowances are listed separately.
- **Components:** listed sizes do not guarantee supplier availability. Porch windows use 100 mm modules; existing-house windows accept measured dimensions.
- **Roofs:** minimum pitch is 14 degrees for tiles and 6 degrees for metal; low pitches need additional detailing. Tile modules omit finished verge allowances and special pieces. Snow guards and roof-access equipment are excluded. Flashing warnings do not approve weatherproofing or clearance.

Useful supplier references:

- [Derome timber catalogue](https://www.derome.se/handla-online/produkter/traeprodukter) - verify stock sections, lengths and quotes.
- [Byggmax window module guide](https://www.byggmax.se/montera-fonster) - understand nominal opening sizes.
- [Benders Palema](https://www.benders.se/sortiment/tak/betongtakpannor/palema/betongtakpanna-palema-2-kupig---0200xx/) and [Benders Exklusiv](https://www.benders.se/sortiment/tak/betongtakpannor/exklusiv/betongtakpanna-exklusiv-1-kupig---0100xx/) - check the tile systems represented.
- [Tile laying guide](https://docs.keskofiles.com/f/btt/ASSET_MISC_41480342) - verify pitch, gauge and overlap requirements for the actual project.
- [K-Bygg casting tubes](https://k-bygg.se/kategori/byggmaterial/block-sten-och-sand/gjutror) - check pier-form options; these do not establish foundation suitability.

---

## Part 2: How it is made and how to develop it

### Architecture

Static HTML, CSS and JavaScript, with SVG drawings and browser storage. There is no backend or third-party runtime dependency.

| Files | Responsibility |
| --- | --- |
| [index.html](./index.html), [css/](./css/) | Page structure, controls and styling. |
| [js/main.js](./js/main.js), [js/designer.js](./js/designer.js), [js/controls.js](./js/controls.js) | Startup, controls, validation, geometry and drawing. |
| [js/framing.js](./js/framing.js), [js/windows.js](./js/windows.js) | Shared framing layout and window drawing details. |
| [js/bom.js](./js/bom.js), [js/roofing.js](./js/roofing.js), [js/derome.js](./js/derome.js) | Lumber takeoff, roof calculations and catalogue data. |
| [js/foundation.js](./js/foundation.js) | Shared pier layout geometry. |
| [js/bom-view.js](./js/bom-view.js) | Materials estimate workspace. |
| [js/drawings.js](./js/drawings.js), [js/drawing-svg.js](./js/drawing-svg.js) | Four sheet generators and shared SVG projection, layers, annotations and title blocks. |
| [js/drawings-view.js](./js/drawings-view.js), [js/permit-settings.js](./js/permit-settings.js), [css/drawings.css](./css/drawings.css) | Sheet selector, permit settings, and A3 print layout. |
| [js/storage.js](./js/storage.js) | Settings persistence and export. |
| [js/app.bundle.js](./js/app.bundle.js) | Generated browser bundle loaded by the app. |

esbuild bundles ES modules into a classic script so the app also works directly from disk. The generated bundle is checked in; do not edit it by hand.

Geometry uses slab-local coordinates: x across the front, y away from the house and z above the slab. The slab starts at the basement face, or the façade if there is no concrete base. With a base, the upper façade and roof's rear support are forward by the basement recession. The roof ends at the slab front plus the configured overhang. House measurements are converted from the fixed house origin. Shared framing calculations feed drawings and estimates.

### Local setup and build

Install Git and a current Node.js LTS release with npm, then:

```sh
git clone https://github.com/doulaiz/farstu.git
cd farstu
npm ci
npm run build
```

Open [index.html](./index.html) in a browser. Re-run `npm run build` after changing JavaScript source, then reload the page. Commit the regenerated bundle along with its source changes.

[package.json](./package.json) defines only `build`; there are no start, test or watch scripts.

### Serve the app for browser regression tests

Tests import source modules and require HTTP. From the repository directory:

```sh
npx --yes http-server@14.1.1 . -a 127.0.0.1 -p 8000 -c-1
```

This downloads the server tool if needed. Open [the local app](http://127.0.0.1:8000/index.html); stop the server with **Ctrl+C**.

Run these browser suites **one at a time** and check the final `PASS` result:

| Local suite | Coverage |
| --- | --- |
| [Application](http://127.0.0.1:8000/tests/application.html) | Framing, flashing, validation, storage, quotes, interactions, and drawing scales, warnings and print setup. |
| [Roofing](http://127.0.0.1:8000/tests/roofing.html) | Roof geometry, views and schedules. |
| [Door](http://127.0.0.1:8000/tests/door.html) | Glazing, animation, occlusion and persistence. |

Use a test-only origin or browser profile: suites temporarily replace and restore settings and quotes. Do not edit another designer tab on that origin while tests run. After JavaScript changes, also check the app directly from disk.

### Publish on GitHub Pages

1. Push the HTML, CSS, JavaScript and rebuilt bundle to the repository.
2. In the repository's **Settings > Pages**, choose **Deploy from a branch**.
3. Select **master** and **/ (root)**, then save.
4. Wait for the Pages deployment to finish and check <https://doulaiz.github.io/farstu/index.html>.

Pages serves the checked-in files; no deployment build is needed.
