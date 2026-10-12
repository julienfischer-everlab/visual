/* Hairline V2 · Microbiome & Gut Health
 * The report's panel: a short pathway folding back and forth four times, as one hairline, with
 * four organised communities on it: sparse, medium, dense (in the accent) and very fine.
 */
HL2.def({
  name: 'gut-map',
  title: 'Microbiome & Gut Health',
  build: function () {
    var A = 4.5, B = 19.5, Y = [3.5, 7.5, 11.5, 15.5], R = 2, path = [], k, n;
    for (n = 0; n < Y.length; n++) {
      var x0 = n % 2 ? B : A, x1 = n % 2 ? A : B;
      for (k = 0; k <= 10; k++) path.push([x0 + (x1 - x0) * k / 10, Y[n]]);
      if (n < Y.length - 1) { var c = (Y[n] + Y[n + 1]) / 2, right = n % 2 === 0;   // the fold: a half circle at the run's end
        for (k = 1; k < 10; k++) { var a = -Math.PI / 2 + k / 10 * Math.PI; path.push([x1 + (right ? 1 : -1) * Math.cos(a) * R, c + Math.sin(a) * R]); } }
    }
    var cells = [], block = function (i0, j0, w, h, keep, o) { for (var i = i0; i < i0 + w; i++) for (var j = j0; j < j0 + h; j++) if (keep(i - i0, j - j0)) cells.push(Object.assign({ i: i, j: j, b: .85 }, o || {})); };
    block(6, 2, 5, 3, function (x, y) { return (x + y) % 2 === 0; }, { b: .7 });     // sparse
    block(12, 6, 4, 3, function (x, y) { return !(x === 3 && y === 0); });            // medium
    block(7, 10, 5, 3, function () { return true; }, { acc: true, b: .95 });          // dense: the community the report is about
    block(12, 14, 6, 3, function () { return true; }, { s: .55, b: .85 });            // very fine
    return { cells: cells, bright: [path] };
  }
});
