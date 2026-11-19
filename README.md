# Farstu Designer

Farstu Designer is a browser-based porch planner with a lumber bill of materials (BOM) and price estimate.

## Launch locally

Open [index.html](./index.html) directly in a browser. Edit the porch in **Designer**, then select **Lumber BOM & prices** to see the estimate. No server, Python, or installation is needed to use the app; keep the accompanying `css` and `js` folders alongside the HTML file.

Design settings and quotes are saved in browser storage. Storage for local files varies between browsers and can be disabled. **Export settings** downloads a record of the design, but the app does not currently import it. Settings previously saved on `http://127.0.0.1:8000/` are separate from those saved when opening the file.

The BOM uses a Derome catalogue snapshot, not live stock or prices. Enter quoted prices in SEK per piece or per metre to calculate totals.

## Development & regression checks

The application has no third-party runtime dependencies. Its source uses ES modules: domain calculations live in [framing.js](./js/framing.js), [bom.js](./js/bom.js), [roofing.js](./js/roofing.js) and [loads.js](./js/loads.js); the corresponding views handle DOM rendering. [controls.js](./js/controls.js) builds dimension controls, [storage.js](./js/storage.js) handles design persistence/export, and [designer.js](./js/designer.js) coordinates validation, the SVG scene and interaction.

After changing JavaScript source, regenerate and commit [app.bundle.js](./js/app.bundle.js). With Node.js and npm installed, run:

```sh
npm ci
npm run build
```

The bundle is included so users do not need to run these commands. The regression suites themselves use ES modules and still need a local server. For example, with Python 3:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open the test URLs at `http://127.0.0.1:8000/`; stop the server with `Ctrl+C`.

With the local server running, open each suite and check its final `PASS` result:

- [Application reliability](./tests/application.html): saved-design round trips, quote bounds and synchronization, validation/storage-error reporting, and frame-coalesced pointer interaction with keyboard fallback.
- [Door rendering](./tests/door.html): glazing styles, trim occlusion, animation and saved settings.
- [Roofing](./tests/roofing.html): modular widths, input limits, migration and consistency between views.

Use a test-only origin or a separate browser profile. These tests temporarily replace and then restore local settings (the application suite also replaces quotes); do not run suites concurrently or edit another designer tab on the same origin while they run.

Only the last-edited window clearance is an input: its opposite clearance is recalculated, including when restoring saved designs. A calculated clearance can exceed the manual input limit. Quote prices loaded from storage use the same 0–10,000,000 SEK bounds as entered prices. Invalid quote drafts remain visible while unrelated quotes are edited; changing the design rebuilds the estimate rows and discards uncommitted drafts. Storage failures are reported without discarding prices already applied to the current session.

## Windows

Under **Parameters → Openings**, choose a muntin pattern for each porch window. Use **Front** or **Right** to see its casing and metal flashings, or **Plan** to see how the frame sits near the outside face of the wall. Window dimensions describe rough openings. The BOM includes the side and head casing only; it does not price window units or installation materials.

New porch windows use Swedish module dimensions M5–M15 (500–1500 mm) in 100 mm increments for width and height. These describe rough openings, not frame outer dimensions; verify the specific combination and window type with a supplier. See [Byggmax's explanation of window modules](https://www.byggmax.se/montera-fonster).

Existing-house and basement windows accept measured, non-standard sizes in 1 mm increments. Their dimensions are bounded for planning and must still fit the house façade or concrete base.

Under **Parameters → Existing house → Position and window spacing**, the origin is at ground level directly below the left edge of the left main window, viewed facing the house. Set the signed distance to the slab's left edge and the clear gap between the main windows; a negative gap represents overlap. The wall's left edge and the upper and basement window centres are also measured from the origin. Window sills and wall height are measured above ground, independently of slab thickness. Moving or resizing the slab therefore does not move the existing house. Older saved designs are converted to these references without changing their geometry.

Under **Parameters → Existing house → Wall dimensions**, set **Basement recession** to offset the concrete basement face behind the upper wall. The stepped profile is shown in the 3D drawing and the Left and Right elevations. Older saved configurations without this setting default to a 100 mm recession.

Under **Parameters → Existing house**, configure the left and right basement windows independently. Their sill heights are measured from the bottom of the concrete base, and each opening must fit within the base. Older saved configurations use the default basement-window settings.

The roof remains a single-slope porch roof. Choose Benders concrete tiles or standing-seam metal. The default pitch is 14°. Tile roofs below 14° are rejected; tiles from 14° to 22° need sealed high-grade underlayment. Standing-seam metal below 14° uses double-seamed joints and is rejected below 6°. The drawing and roof schedule cover the underlayment, fascia, flashings, gutter, and downpipe; the schedule accepts manual SEK quotes. Snow guards and roof-access equipment are not modeled. Confirm manufacturer limits, snow and wind loads, drainage, and local safety requirements before construction.

## Roof tile modules and overlap

Tile dimensions are product-specific, not a single Swedish standard. The planner offers these commonly sold concrete tile systems:

| Tile | Physical width × length | Effective covering width | Nominal side overlap |
| --- | --- | --- | --- |
| [Benders Palema, two-wave](https://www.benders.se/sortiment/tak/betongtakpannor/palema/betongtakpanna-palema-2-kupig---0200xx/) | 330 × 420 mm | 300 mm | 30 mm |
| [Benders Exklusiv, one-wave](https://www.benders.se/sortiment/tak/betongtakpannor/exklusiv/betongtakpanna-exklusiv-1-kupig---0100xx/) | 280 × 420 mm | 250 mm | 30 mm |

**Exposed tile length / batten gauge** is measured along the slope. The [manufacturer's laying guide, pages 5–6](https://docs.keskofiles.com/f/btt/ASSET_MISC_41480342) gives 310–320 mm at 14°–17°, 310–340 mm at 18°–21°, and up to 375 mm from 22°. The planner uses the lower band's limit until the next threshold, including fractional pitches. Headlap is 420 mm minus the gauge: 45–110 mm overall, at least 100 mm below 18°, and at least 80 mm below 22°. The default gauge is 310 mm. More exposed sites may require tighter spacing. Profile rise remains a schematic valley-to-crown setting rather than total tile construction height.

Under **Roof → Pitch, width & overhangs**, configure **Total roof width** and **Door-side overhang (left)** separately. The opposite (right) overhang is calculated as `roof width - slab width - door-side overhang` and displayed below the controls. Both overhangs must be between 0 and 1000 mm, so the roof always covers the slab. Changing the door-side overhang shifts the roof sideways without changing its total width; the overhangs need not be equal. Door-side overhang accepts half-millimetre increments to preserve existing saved designs.

In **3D** and **Plan**, soft-edged green ground surrounds the porch, and a subtle shadow shows the roof's vertical footprint, including both side overhangs and the front overhang. It is a straight-down projection, not a sunlight simulation, and remains visible with the roof covering hidden. **Hide ground** hides the shadow as well.

With tiles selected, `roof width = whole tile count × covering width`. The roof-width spinner uses 250 or 300 mm steps, and typed non-multiples are rejected without changing the last valid drawing. Switching to tiles, changing the tile system or loading a design aligns roof width to the nearest feasible module; ties round up. These adjustments never change the slab width or door-side overhang. Metal roofs use 1 mm width steps. Editing slab width or door-side overhang can make the chosen roof width invalid; adjust roof width to restore both overhangs to the allowed range. Drawing, rafter takeoff, roof schedule and load estimates use the same asymmetric roof position and width.

This is a **nominal covering grid**, not a finished verge dimension: the guide notes that the final edge tile occupies an extra 30 mm beyond its covering module. That allowance and any special verge tiles must be coordinated with the bargeboards/flashing; the drawing does not model this edge allowance. Whole-width modules do not remove the need for course layout, eave/abutment cuts or project-specific detailing. Older saved symmetric overhangs migrate to total roof width and door-side overhang with a notice. Non-standard tile covering widths migrate to the nearest listed module; saved batten gauges above the pitch limit are reduced with a notice.

With the local server running, open [the roof tile regression tests](./tests/roofing.html) in a browser to check asymmetric layout bounds, width stepping, pitch limits, saved-design migration and estimate consistency. The tests temporarily replace and then restore the saved Designer settings.

## Component dimensions

- The door has a solid leaf, visible from both sides and edge-on while opening or closing in 3D, Left and Plan. The leaf and casing are depth-sorted together: closed leaf edges sit behind the trim, while the outward-opening leaf passes in front of it. Configure its visual thickness from 40 to 100 mm (default 70 mm). Opening width and height use Swedish module choices; thickness does not change the area-based mass assumption. Open [the door rendering regression tests](./tests/door.html) through the local server to verify trim occlusion and animation.
- Under **Openings → Left-side door → Door window**, choose **No window**, **Vertical skinny window (handle side)**, **Rectangular window** (default), or **Half-circle window**. Framed glazing is drawn on both sides of the animated leaf; the narrow upper light mirrors with the handle, and the semicircular fanlight has radial muntins. These schematic styles reflect Swedish retail designs such as [Diplomat Mikaela](https://www.diplomatdorrar.se/vara-produkter/diplomatdorrar/diplomat-ytterdorrar/mikaela-glas/) (narrow light), [Karin](https://www.diplomatdorrar.se/vara-produkter/diplomatdorrar/diplomat-ytterdorrar/karin-glas/) (upper glazing) and [Christine](https://www.diplomatdorrar.se/vara-produkter/diplomatdorrar/diplomat-ytterdorrar/christine-glas/) (semicircular fanlight), not exact product replicas or glass-cutting dimensions. Confirm model availability, safety glazing and thermal/security performance with the supplier. The choice is saved/exported with the design; older settings retain rectangular glazing, and Reset restores it. Glazing does not change the existing area-based door mass estimate.
- Studs and rafters offer the sections in the existing [Derome catalogue snapshot](./js/derome.js): 45 mm width with depths 70, 95, 120, 145, 170, 195, 220 or 245 mm, and 70 × 70 mm. Width selection filters the depth choices. Stud spacing is 300–600 mm; rafter spacing is 300–1200 mm.
- New cladding base and cover boards and opening trim use 22 mm boards in retail widths 70, 95, 120, 145, 170 and 195 mm. **Openings → Trims** sets one shared width and colour for the door and both farstu windows (default 95 mm and off-white); zero width hides all three casings. Existing-house window trims are unchanged. The shared settings are saved/exported, and Reset restores their defaults. Older designs use the door trim settings for all three openings, with a notice if the window trims differed. Cladding widths are independent of spacing, with at least 20 mm overlap each side; the drawing, BOM and mass estimate use the selected sizes. Battens use the catalogue's 25 × 48 mm section.
- Pier diameters are 150, 190, 251, 302 and 403 mm, following [K-Bygg casting tubes](https://k-bygg.se/kategori/byggmaterial/block-sten-och-sand/gjutror). New designs and Reset use a 3 × 2 grid (three piers across the slab width, two along its length), 251 mm diameter and 400 mm depth. Saved custom settings are preserved. Depth is configurable from 300 to 3000 mm; this does not establish a safe foundation or frost-free depth.
- Other geometry has bounded planning ranges, including slab dimensions 1200–6000 mm, slab thickness 80–400 mm, front wall height 2000–3500 mm, wall thickness 120–600 mm and overhangs 0–1000 mm. These limits prevent implausible inputs; they are not structural or regulatory checks.

Older saved designs gain defaults for new fields. Non-standard stock dimensions are moved to the nearest listed choice with an explicit notice; existing-house measurements are preserved. Saved dimensions outside the new numeric bounds are rejected with a notice instead of being silently clamped. Stock choices are not guarantees of local availability, structural suitability or a particular supplier's window combinations.

## Floor & pier loads

Select **Floor & pier loads** (beside the BOM button) for a top view of the slab and cylindrical piers. It estimates the dead weight of the slab, walls (from the stud layout, wall heights and openings) and roof, plus three standing adults of 80 kg each, and shows the load on each pier and the bearing pressure under its base. The shading shows where load is applied to the slab. The page updates whenever a Designer parameter changes.

Choose whether the high roof edge rests on a beam between the side walls (whole roof on the slab) or on a ledger on the house wall. Place the adults with a preset, or drag them in the diagram (or focus one and use the arrow keys). Loads are shared between neighbouring piers with the lever rule, using typical material densities listed on the page. Snow, wind, furniture and dynamic loads are not included; this is not a structural design.
