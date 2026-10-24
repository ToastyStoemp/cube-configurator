# Cube Studio — artist alley booth planner

Run `python -m http.server 8766 --bind 127.0.0.1` and open http://127.0.0.1:8766.

Every design starts on a convention table (6 ft by default; 4 ft, 8 ft and half-table presets are in the Table tab). In Build mode, hover a panel edge and drag outward. Extensions snap to half-panel increments: 0.5, 1, 1.5 and more. Full lengths are split into separate full panels plus a half panel for any remainder; the edge's other dimension is preserved. Release to commit the green preview; red means overlap or out of bounds. Escape cancels. A whole drag is one undo step. Free edges show faint pull handles when you hover a panel, or always on touch screens.

The sidebar follows the mode: Build shows the style palette and new-plane tools, Select shows selection tools, Move shows section options and Products shows the item palette and editor. In Select mode, click or drag across panels to select them; choosing a colour or finish restyles the selection immediately as one undo step. Remove selected or the Delete key removes the selection; dragging an edge inward also removes panels. Press ? for the shortcut list (B, V, M, P switch modes, F fits the view).

A first-visit tour walks through the table, the edge pull and stocking the display. Booth readiness under the viewer tracks six goals: the display fits the table, it stays within the panels and connectors you own, it is under your convention's height limit (a red plane marks the limit when exceeded), it is stocked with products, it passes a light stability heuristic (raised shelves need support on at least two edges and tall columns need side bracing), and the print sheet is ready. Optional prices give an estimated kit cost. Visitor view puts the camera at standing eye level in the aisle in front of the table.

Panel size in cm applies to the whole design: width is the bay width, height the panel height and depth the shelf depth, so a 30 × 40 kit is set as 30 wide × 40 tall. Presets cover 30 × 30, 35 × 35, 40 wide × 30 and 30 wide × 40 tall. One size per design; mixing sizes in one layout is not supported. Mesh/plastic materials can be mixed. Parts and connector counts derive from the actual panels. Structural suitability and vendor connector compatibility are not simulated.

Your kit, in the Setup tab, records what your panels allow. Turn off half panels and edge pulls snap to whole panels. Turn on triangle panels and, in Build mode, grab a panel corner and pull it inward along the diagonal to cut it off; the preview turns green when the pull is far enough. Pull a cut corner outward to restore the square. Where several panels share a corner, the direction of the pull picks the panel. Select mode also offers Cut corner and Make square for whole selections. A triangle panel is a full-size square with one corner cut along the diagonal. Triangles count separately in the parts list, have three connector corners, print as triangles, and the two edges beside the cut corner cannot be pulled. Kit settings save in the design file.

Landscape phones and short laptop screens use a compact two-column layout so the 3D view fits on the first screen.

Version 2 JSON saves independent panels, including empty layouts. Version 1 cube designs and existing browser autosaves migrate automatically without adding duplicate shared panels. Undo/redo and CSV parts exports remain available. Kit counts, limits and prices are view preferences stored in the browser, not in the design file.

Spring assembly, merge flashes, count-up meters and shrinking removal animate presentation only. Optional sound is off by default; Calm mode (in the Settings menu on the viewer) and system reduced motion are supported.

Run `node --test model.test.cjs`. Three.js is vendored; see THREE-LICENSE.txt.

## Direction and connectors

Edge dragging chooses an extension direction from the mouse movement, including perpendicular planes. Press R during a drag to cycle and lock a direction, then move the pointer to update the preview. Hold Shift while dragging to place plastic panels; half and full sizes are both supported. Half-width edges use full-length increments so new quarter panels cannot be produced. Existing saved layouts are preserved. Preview corner joints and dark placed connectors are generic representations, not kit-specific hardware geometry.

## Style workflow

Choose material samples and colour swatches before building. Select mode supports Shift-click and brush-drag multi-selection, Select all, and Same style. Picking a style with a selection active applies it in one undo step. Assembly animations and optional sound remain.

## GitHub Pages

This is a static site with local, relative asset paths, including its vendored Three.js library. It works under a repository subpath without a server-side application or npm install.

1. Create a GitHub repository and push this folder to its `main` or `master` branch.
2. In Settings → Pages, choose **GitHub Actions** as the publishing source.
3. The included Publish Cube Studio workflow tests the code, packages only public site files into `_site`, and deploys. Pull requests run checks without publishing. You can also start the workflow manually.

Run `node build-site.cjs` to prepare the same static output locally. The repository has not been published automatically.

Browser autosaves are local to each origin. Export your local design as JSON before moving to the hosted URL, then open it there. Design files are not uploaded by the app.

## Booth planning tools

Open Products mode and the Item editor & library to create dimensioned items with optional artwork, or import/export a product library. Products mode drags items horizontally at their chosen base height, including shelf or hanging heights. Artwork preserves its proportions. Product geometry is a simple box preview; physical hanging and stability are not simulated.

Select panels and use Move mode to drag the section across the table; enable Duplicate while moving to copy it. Raise/lower moves half a grid height. Table edges snap within 3 cm with a configurable inset; turn snapping off for grid-only movement. Movement rejects overlapping panels and is one undo step. Product positions are independent of panel sections.

Print setup sheet opens the browser print dialog: use Save as PDF for a portable sheet. It includes numbered vector front/top panel views, a numbered parts list, connector count and product dimensions/positions. Numbers that would overlap are nudged apart.

## Surface placement and accessories

Products mode raycasts the actual grid panels: horizontal shelves support the item at its base; vertical panels orient it outwards. Away from panels it moves horizontally at its existing base height. This is visual placement rather than a mechanical attachment or load check.

Choose Metal display hook or Tiered acrylic stand in the product form. Width/height/depth are editable and acrylic stands support 1–8 tiers. Shapes are generic adjustable references, not verified Amazon models. The Amazon links supplied lacked accessible product details.

Open display-stand editor launches a bundled local editor in a dialog. Open a saved display-stand JSON there or design a new stand, then choose Add current stand to booth. Actual triangulated geometry is transferred in cm and included in booth saves and product libraries. Transfers are snapshots; re-edit in the embedded editor and transfer again to update the shape. Imported geometry dimensions can also be scaled in the booth product form. The bundled editor is independent of the original project's server and works on GitHub Pages.

### Item palette

Drag cards from Products, Hooks, Acrylic, or Custom onto the 3D display. Hooks offer 5/10/15/20 cm presets and attach to vertical panels; acrylic stands offer 2–5 levels and attach to horizontal panels or the tabletop. The full-size preview shows placement before release; Escape cancels. Use Create / edit an item for dimensions, artwork, import/export, and deletion. Transferred custom stands retain their colors and appear as reusable cards. Preset dimensions are editable starting points.
