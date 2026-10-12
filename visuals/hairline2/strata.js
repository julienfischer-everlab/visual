/* Hairline V2 · DEXA Body Composition & Bone Density
 * The report's panel: a standing body as a silhouette of cells, its two halves in two densities:
 * every cell on one side; on the other its outline, and one in four inside; a few cells at the hip in the accent.
 */
HL2.def({
  name: 'strata',
  title: 'DEXA Body Composition',
  build: function () {
    var cells = [], body = HL2.body(12, 1, 18, 1.1);
    for (var i = 0; i < HL2.COLS; i++) for (var j = 0; j < HL2.ROWS; j++) {
      var d = body(i + .5, j + .5); if (d > 0) continue;
      if (i < 12) cells.push({ i: i, j: j, b: .9, acc: j >= 10 && j <= 11 && i >= 10 });   // dense: every cell
      else if (d > -.95 || (i % 2 === 0 && j % 2 === 0)) cells.push({ i: i, j: j, b: .75, s: 1.15 });   // open: the outline kept, one cell in four inside
    }
    return { cells: cells };
  }
});
