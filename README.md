# Farstu Designer

Plan an enclosed entrance porch (*farstu*) against an existing house: explore its appearance, estimate materials and compare how its weight is shared by the foundation piers.

## Part 1: Using the app

### Open the planner

**[Open Farstu Designer on GitHub Pages](https://doulaiz.github.io/farstu/)**

> GitHub Pages is not yet enabled for this repository; this link returns 404 until publishing is configured.

You can also download and extract the [project ZIP](https://github.com/doulaiz/farstu/archive/refs/heads/master.zip), then open `index.html` in your browser. Keep the accompanying folders together. There is nothing to install to use the downloaded app.

### The three workspaces

Use the buttons at the top to switch workspaces; all share the same design.

| Workspace | What it is for |
| --- | --- |
| **Designer** | Set dimensions and explore the porch in 3D, elevations and plan. |
| **Lumber BOM & prices** | Review a lumber bill of materials, cut lists, stock matches and a separate roofing and drainage schedule. Enter supplier quotes to estimate costs. |
| **Floor & pier loads** | Explore estimated weights, load distribution and bearing pressures for the selected pier layout. |

#### Designer

Start with the existing house, then place and size the new porch:

1. **Existing house:** enter the wall, windows and basement measurements. The reference origin is at ground level directly below the left edge of the left main window, viewed facing the house. Set the distance from that origin to the slab's left edge and the clear gap between the main windows. House window sills are measured above ground; basement window sills are measured above the bottom of the concrete base.
2. **Foundation:** set the slab width, length and thickness, then choose the pier grid, diameter and depth. Width runs across the front; length runs out from the house.
3. **Openings:** configure the left-side door and the front and right windows. Choose door glazing, handing, window muntins and shared opening trim. Window sizes describe rough openings, not finished frames. Editing a window's top or bottom clearance recalculates the opposite clearance.
4. **Walls:** choose wall thickness, cladding, framing sections and spacing. Each window has doubled studs beneath both sill ends; its bottom clearance must exceed twice the stud width.
5. **Roof:** choose standing-seam metal or concrete tiles, pitch, total width and overhangs. Left and right overhangs need not be equal. Adjust the height of the roof-to-house standing flashing (*ståndskiva*); a warning appears if it or its apron touches the existing upper central window or its surround.

Use the drawing controls to inspect your design:

- **3D, Front, Left, Right and Plan** show different projections. Not every feature is visible from every direction.
- **Roof display** switches between the covering and details, rafters, or a hidden roof.
- **Wall layers** lets you inspect the wall build-up or expose the timber. Hiding layers does not remove materials or weight from the estimates.
- **Open door / Close door** animates the door where it is visible.
- **Hide ground / Show ground** toggles the ground and roof-footprint shadow, which is not a sunlight simulation.
- Open a parameter section or focus a dimension to display temporary measurement arrows.
- Use **Ctrl + mouse wheel** to zoom, and **R** to reset the zoom when you are not typing in a field.

Invalid dimensions are highlighted; correct them to update the drawing and estimates. Normally the last valid design remains visible. The flashing-contact warning is advisory and does not block editing.

#### Lumber BOM & prices

Expand cut lists to inspect required pieces. Follow **Derome article** links to check proposed stock and request prices.

- Enter lumber quotes in **SEK per piece or per metre**.
- Enter roofing and drainage quotes in **SEK per displayed unit**.
- Check stock substitutions and cuts without a stock match before ordering.
- A **quoted subtotal** is incomplete: some items remain unpriced or unmatched.
- Use the same VAT basis for every quote. Unquoted delivery costs and taxes are not added automatically.

Review the separate roofing and drainage schedule, and **Window installation items to quote separately**, before budgeting.

#### Floor & pier loads

Choose whether the rear roof support rests on a beam between the side walls or on a ledger attached to the house. This changes how much roof weight reaches the slab.

The page includes three adults of **80 kg each**. Choose a placement preset or drag them in the diagram. You can also focus an adult and use the arrow keys; hold **Shift** for larger movements.

The house is at the top of the diagram. Shading shows applied loads; tables show component weights, pier reactions and bearing pressures. Open **Method and material assumptions** for calculation details.

### Keeping your work

Settings and quotes are saved in the current browser when storage is available, not in a cloud account. Other browsers, devices and site addresses have separate storage.

**Export settings** downloads a design record, but there is **no import feature**. **Reset** restores design defaults. Read any storage or migration notices when opening saved designs.

### Limits: a planning aid, not a construction design

- **Scope:** one rectangular slab, three new walls and a single-slope roof against a house.
- **Safety:** geometry and connections are schematic, not structural or regulatory approvals. Have spans, fixings, house attachments, foundations, soil capacity, frost protection and weatherproofing checked professionally.
- **Loads:** typical densities and simplified load sharing; no snow, wind, furniture or dynamic loads. Placement presets do not establish worst-case loading.
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
| [js/loads.js](./js/loads.js) | Weight estimates and pier-load calculations. |
| [js/bom-view.js](./js/bom-view.js), [js/loads-view.js](./js/loads-view.js) | Estimate workspaces. |
| [js/storage.js](./js/storage.js) | Settings persistence and export. |
| [js/app.bundle.js](./js/app.bundle.js) | Generated browser bundle loaded by the app. |

esbuild bundles ES modules into a classic script so the app also works directly from disk. The generated bundle is checked in; do not edit it by hand.

Geometry uses slab-local coordinates: x across the front, y away from the house and z above the slab. House measurements are converted from the fixed house origin. Shared framing calculations feed drawings and estimates.

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

This downloads the server tool if needed. Open [the local app](http://127.0.0.1:8000/); stop the server with **Ctrl+C**.

Run these browser suites **one at a time** and check the final `PASS` result:

| Local suite | Coverage |
| --- | --- |
| [Application](http://127.0.0.1:8000/tests/application.html) | Framing, flashing, validation, storage, quotes and interactions. |
| [Roofing](http://127.0.0.1:8000/tests/roofing.html) | Roof geometry, views, schedules and loads. |
| [Door](http://127.0.0.1:8000/tests/door.html) | Glazing, animation, occlusion and persistence. |

Use a test-only origin or browser profile: suites temporarily replace and restore settings and quotes. Do not edit another designer tab on that origin while tests run. After JavaScript changes, also check the app directly from disk.

### Publish on GitHub Pages

1. Push the HTML, CSS, JavaScript and rebuilt bundle to the repository.
2. In the repository's **Settings > Pages**, choose **Deploy from a branch**.
3. Select **master** and **/ (root)**, then save.
4. Wait for the Pages deployment to finish and check <https://doulaiz.github.io/farstu/>.

Pages serves the checked-in files; no deployment build is needed.
