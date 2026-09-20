# Cube Studio — artist alley panel planner

Run `python -m http.server 8766 --bind 127.0.0.1` and open http://127.0.0.1:8766.

In Build mode, hover near a panel edge and drag outward. Extensions snap to half-panel increments: 0.5, 1, 1.5 and more. Full lengths are split into separate full panels plus a half panel for any remainder; the edge's other dimension is preserved. Release to commit the green preview; red means overlap or out of bounds. Escape cancels. A whole drag is one undo step. No floating attachment dots are shown.

Extensions stay in the original panel plane. Choose an orientation and use Add starter panel to start another plane at the origin, or begin with a preset. Select edits one panel; Remove deletes only that panel. Empty canvas allows a fresh start.

Grid dimensions in cm apply to the whole design. Mesh/plastic materials can be mixed. Parts and connector counts derive from the actual panels. Structural suitability and vendor connector compatibility are not simulated.

Version 2 JSON saves independent panels, including empty layouts. Version 1 cube designs and existing browser autosaves migrate automatically without adding duplicate shared panels. Undo/redo and CSV parts exports remain available.

Spring assembly, +1 panel feedback and shrinking removal animate presentation only. Optional sound is off by default; Calm mode and system reduced motion are supported.

Run `node --test model.test.cjs`. Three.js is vendored; see THREE-LICENSE.txt.

## Direction and connectors

Edge dragging chooses an extension direction from the mouse movement, including perpendicular planes. Press R during a drag to cycle and lock a direction, then move the pointer to update the preview. Hold Shift while dragging to place plastic panels; half and full sizes are both supported. Half-width edges use full-length increments so new quarter panels cannot be produced. Existing saved layouts are preserved. Preview corner joints and dark placed connectors are generic representations, not kit-specific hardware geometry.

## Style workflow

Choose material samples and colour swatches before building. Select mode supports Shift-click multi-selection, Select all, and Same style. Apply style updates the whole selection in one undo step. Paint mode brushes the chosen style across panels; release commits one stroke, Escape cancels. Placement pop-ups have been removed; assembly animations and optional sound remain.

## GitHub Pages

This is a static site with local, relative asset paths, including its vendored Three.js library. It works under a repository subpath without a server-side application or npm install.

1. Create a GitHub repository and push this folder to its `main` or `master` branch.
2. In Settings → Pages, choose **GitHub Actions** as the publishing source.
3. The included Publish Cube Studio workflow tests the code, packages only public site files into `_site`, and deploys. Pull requests run checks without publishing. You can also start the workflow manually.

Run `node build-site.cjs` to prepare the same static output locally. The repository has not been published automatically.

Browser autosaves are local to each origin. Export your local design as JSON before moving to the hosted URL, then open it there. Design files are not uploaded by the app.

## Booth planning tools

Open Products, prints & signs in Build & style to create dimensioned items with optional artwork, or import/export a product library. Products mode drags items horizontally at their chosen base height, including shelf or hanging heights. Artwork preserves its proportions. Product geometry is a simple box preview; physical hanging and stability are not simulated.

Select panels and use Move to drag the section across the table; enable Duplicate while moving to copy it. Raise/lower moves half a grid height. Table edges snap within 3 cm with a configurable inset; turn snapping off for grid-only movement. Movement rejects overlapping panels and is one undo step. Product positions are independent of panel sections.

Print setup sheet opens the browser print dialog: use Save as PDF for a portable sheet. It includes numbered vector front/top panel views, a numbered parts list, connector count and product dimensions/positions. Dense views can have overlapping numbers; the parts table identifies every panel.

## Surface placement and accessories

Products mode raycasts the actual grid panels: horizontal shelves support the item at its base; vertical panels orient it outwards. Away from panels it moves horizontally at its existing base height. This is visual placement rather than a mechanical attachment or load check.

Choose Metal display hook or Tiered acrylic stand in the product form. Width/height/depth are editable and acrylic stands support 1–8 tiers. Shapes are generic adjustable references, not verified Amazon models. The Amazon links supplied lacked accessible product details.

Open display-stand editor launches a bundled local editor in a dialog. Open a saved display-stand JSON there or design a new stand, then choose Add current stand to booth. Actual triangulated geometry is transferred in cm and included in booth saves and product libraries. Transfers are snapshots; re-edit in the embedded editor and transfer again to update the shape. Imported geometry dimensions can also be scaled in the booth product form. The bundled editor is independent of the original project's server and works on GitHub Pages.

### Item palette

Drag cards from Products, Hooks, Acrylic, or Custom onto the 3D display. Hooks offer 5/10/15/20 cm presets and attach to vertical panels; acrylic stands offer 2–5 levels and attach to horizontal panels or the tabletop. The full-size preview shows placement before release; Escape cancels. Use Create / edit an item for dimensions, artwork, import/export, and removal. Transferred custom stands retain their colors and appear as reusable cards. Preset dimensions are editable starting points.
