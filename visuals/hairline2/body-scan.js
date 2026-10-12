/* Hairline V2 · Whole Body MRI & CT Chest
 * The report's panel: a standing body as a silhouette of cells (a bright rim, a sparse inside),
 * crossed by four thin scan slices; the chest in the accent (the CT chest).
 */
HL2.def({
  name: 'body-scan',
  title: 'Whole Body MRI & CT Chest',
  build: function () {
    var cells = [], lines = [], body = HL2.body(12, 1.5, 17);
    for (var i = 0; i < HL2.COLS; i++) for (var j = 0; j < HL2.ROWS; j++) {
      var d = body(i + .5, j + .5); if (d > 0) continue;
      var rim = d > -.95, chest = j >= 5 && j <= 8 && Math.abs(i + .5 - 12) < 2.6;
      if (rim) cells.push({ i: i, j: j, b: .95 });
      else if (chest) cells.push({ i: i, j: j, b: .9, acc: true });
      else if ((i + j) % 2 === 0) cells.push({ i: i, j: j, b: .45 });   // the inside: every other cell, dim
    }
    [4.6, 8.9, 12.9, 16.9].forEach(function (y) { lines.push([[1.2, y], [22.8, y]]); });   // the scan slices
    return { cells: cells, lines: lines };
  }
});
