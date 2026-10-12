/* Hairline V2 · Advanced Blood Testing
 * The report's panel: four compact data rows, each a short label, a track, its range as dim
 * cells and the result as a small square marker; one result in the accent.
 */
HL2.def({
  name: 'assay',
  title: 'Advanced Blood Testing',
  build: function () {
    var cells = [], lines = [], rows = [[3, 10, 16, 14], [7.5, 12, 18, 20], [12, 8, 15, 12], [16.5, 11, 19, 16]];
    rows.forEach(function (r, n) {
      var y = r[0];
      lines.push([[1.5, y], [5, y]]);                                    // the label
      lines.push([[7, y], [22.5, y]]);                                   // the track
      for (var i = r[1]; i <= r[2]; i++) cells.push({ i: i, j: Math.floor(y), b: .7, grey: true });   // the range
      for (var a = 0; a < 2; a++) for (var c = 0; c < 2; c++) cells.push({ i: r[3] + a, j: Math.floor(y) - 1 + c, b: 1, acc: n === 1 });   // the result
    });
    return { cells: cells, lines: lines };
  }
});
