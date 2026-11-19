# Farstu Designer

Farstu Designer is a browser-based porch planner with a lumber bill of materials (BOM) and price estimate. There is no build step or npm setup.

## Launch locally

1. In VS Code, open the project folder and start a terminal in the folder containing [index.html](./index.html).
2. With Python 3 installed, start a local web server:

   ```sh
   python -m http.server 8000 --bind 127.0.0.1
   ```

   If `python` is not recognized, use `py -3` in Windows PowerShell or `python3` in WSL/macOS/Linux in place of `python`.

3. Keep the terminal running and open [http://127.0.0.1:8000/](http://127.0.0.1:8000/) in a browser. Edit the porch in **Designer**, then select **Lumber BOM & prices** to see the estimate.

Press `Ctrl+C` in the terminal to stop the server.

## If the BOM button does nothing

- **Check the address bar.** Double-clicking [index.html](./index.html) opens it as a `file://` URL. The HTML can appear even when the browser blocks the JavaScript modules, leaving the buttons inactive. Use the `http://127.0.0.1:8000/` address instead.
- **If you see a directory listing or a 404**, check that you started the server in the folder containing [index.html](./index.html).
- **If port 8000 is in use**, try `8001` in both the command and the browser URL. Saved designs and quotes are specific to the browser and address (including the port).

The BOM uses a Derome catalogue snapshot, not live stock or prices. Enter quoted prices in SEK per piece or per metre to calculate totals.

## Windows

Under **Parameters → Openings**, choose a muntin pattern for each porch window. Use **Front** or **Right** to see its casing and metal flashings, or **Plan** to see how the frame sits near the outside face of the wall. Window dimensions describe rough openings. The BOM includes the side and head casing only; it does not price window units or installation materials.

Enter editable window widths and heights in 100 mm (10 cm) increments, starting at 100 mm. Clearances, offsets and sill heights are not restricted to these increments. Older saved window sizes are rounded down to the next valid size, with a minimum of 100 mm.

Under **Parameters → Existing house → Wall dimensions**, set **Basement recession** to offset the concrete basement face behind the upper wall. The stepped profile is shown in the 3D drawing and the Left and Right elevations. Older saved configurations without this setting default to a 100 mm recession.
