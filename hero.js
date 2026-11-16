/* Live hero scene: curved spacetime around a black hole, a holographic
   boundary with bulk geodesics, gravitational ripples and Hawking pairs. */
(function () {
  var canvas = document.getElementById("spacetime");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var band = canvas.parentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var W = 0, H = 0, dpr = 1, cx = 0, cy = 0, f = 0, mobile = false;
  var CAM = 24, TILT = 0.44, R = 10, RH = 1.6;
  var stars = [], pairs = [], lastSpawn = 0;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function resize() {
    var r = band.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mobile = W < 760;
    if (mobile) { cx = W * 0.5; cy = 175; f = Math.min(W * 0.95, 420) * 2.4 * 0.82; }
    else { cx = W * 0.75; cy = H * 0.47; f = Math.min(W * 0.36, 470) * 2.4; }
    f = f * 0.62;
    stars = [];
    var n = Math.round(W * H / 5200);
    for (var i = 0; i < n; i++) stars.push({ x: rand(0, W), y: rand(0, H), r: rand(0.3, 1.25), p: rand(0, 6.28), s: rand(0.4, 1.6) });
  }

  // embedding "funnel" of the spatial slice + travelling ripples
  function depth(r, t) {
    var base = -7.5 / (r / 1.2 + 0.45);
    var ripple = 0.26 * Math.sin(1.7 * r - 2.2 * t) * Math.exp(-r / 7);
    return base + 1.5 + ripple;
  }

  function project(x, y, z, rot) {
    var c = Math.cos(rot), s = Math.sin(rot);
    var x1 = c * x + s * z, z1 = -s * x + c * z;
    var ct = Math.cos(TILT), st = Math.sin(TILT);
    var y2 = ct * y - st * z1, z2 = st * y + ct * z1;
    var zc = z2 + CAM;
    return { x: cx + f * x1 / zc, y: cy - f * y2 / zc, z: z2 };
  }

  function drawStars(t) {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var a = 0.35 + 0.35 * Math.sin(t * s.s + s.p);
      ctx.fillStyle = "rgba(220,230,255," + a.toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill();
    }
  }

  function drawGrid(t, rot) {
    ctx.lineWidth = 1;
    // rings
    for (var k = 0; k < 15; k++) {
      var r = RH + 0.25 + Math.pow(k / 14, 1.35) * (R - RH - 0.25);
      var alpha = 0.10 + 0.32 * (1 - k / 14);
      ctx.strokeStyle = "rgba(90,200,255," + alpha.toFixed(3) + ")";
      ctx.beginPath();
      for (var j = 0; j <= 96; j++) {
        var a = j / 96 * 6.2832;
        var p = project(r * Math.cos(a), depth(r, t), r * Math.sin(a), rot);
        if (j === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    // spokes
    for (var m = 0; m < 40; m++) {
      var ang = m / 40 * 6.2832;
      ctx.strokeStyle = "rgba(90,200,255,0.16)";
      ctx.beginPath();
      for (var q = 0; q <= 40; q++) {
        var rr = RH + 0.25 + (q / 40) * (R - RH - 0.25);
        var pp = project(rr * Math.cos(ang), depth(rr, t), rr * Math.sin(ang), rot);
        if (q === 0) ctx.moveTo(pp.x, pp.y); else ctx.lineTo(pp.x, pp.y);
      }
      ctx.stroke();
    }
  }

  // holographic boundary ring and boundary-anchored geodesics
  var GEOS = [[0.3, 2.2], [1.4, 3.9], [2.6, 5.4], [4.1, 6.0], [5.0, 7.3], [3.2, 4.4], [0.9, 1.9]];
  function geoPoint(a1, a2, s, t, rot) {
    var d = a2 - a1;
    var rmin = Math.max(RH + 0.7, R * Math.cos(Math.min(d, 3.0) / 2) * 0.95);
    var a = a1 + d * s;
    var r = R - (R - rmin) * Math.pow(Math.abs(Math.sin(Math.PI * s)), 1.15);
    return project(r * Math.cos(a), depth(r, t) + 0.02, r * Math.sin(a), rot);
  }
  function drawHolography(t, rot) {
    // boundary
    ctx.save();
    ctx.shadowColor = "rgba(190,140,255,0.9)"; ctx.shadowBlur = 14;
    ctx.strokeStyle = "rgba(205,170,255,0.85)"; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (var j = 0; j <= 160; j++) {
      var a = j / 160 * 6.2832;
      var p = project(R * Math.cos(a), depth(R, t), R * Math.sin(a), rot);
      if (j === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
    // geodesics
    for (var g = 0; g < GEOS.length; g++) {
      var a1 = GEOS[g][0], a2 = GEOS[g][1];
      ctx.strokeStyle = "rgba(196,150,255,0.30)"; ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (var i = 0; i <= 60; i++) {
        var p2 = geoPoint(a1, a2, i / 60, t, rot);
        if (i === 0) ctx.moveTo(p2.x, p2.y); else ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
      // boundary anchor points
      var e1 = geoPoint(a1, a2, 0, t, rot), e2 = geoPoint(a1, a2, 1, t, rot);
      ctx.fillStyle = "rgba(235,215,255,0.95)";
      ctx.beginPath(); ctx.arc(e1.x, e1.y, 2.2, 0, 6.2832); ctx.arc(e2.x, e2.y, 2.2, 0, 6.2832); ctx.fill();
      // travelling pulse
      var s = (t * 0.16 + g * 0.37) % 1;
      if (!(s >= 0.02 && s <= 0.98)) continue;
      var pk = geoPoint(a1, a2, s, t, rot);
      var grd = ctx.createRadialGradient(pk.x, pk.y, 0, pk.x, pk.y, 9);
      grd.addColorStop(0, "rgba(255,240,255,0.95)"); grd.addColorStop(1, "rgba(190,140,255,0)");
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(pk.x, pk.y, 9, 0, 6.2832); ctx.fill();
    }
  }

  function diskColor(u, b) { // u: 0 inner -> 1 outer
    var r = 255, g = Math.round(235 - 150 * u), bl = Math.round(190 - 170 * u);
    return "rgba(" + r + "," + g + "," + bl + "," + Math.max(0, Math.min(1, b)).toFixed(3) + ")";
  }
  function drawDiskHalf(bx, by, rs, t, front) {
    var rings = 9;
    for (var k = 0; k < rings; k++) {
      var u = k / (rings - 1);
      var rx = rs * (1.55 + 1.5 * u), ry = rx * 0.2;
      var a0 = front ? 0 : Math.PI, a1 = front ? Math.PI : 2 * Math.PI;
      var segs = 48;
      ctx.lineWidth = rs * 0.13;
      for (var j = 0; j < segs; j++) {
        var a = a0 + (a1 - a0) * j / segs, b2 = a0 + (a1 - a0) * (j + 1.15) / segs;
        var dop = 0.62 + 0.38 * Math.cos(a + 0.2);           // approaching side brighter
        var turb = 0.78 + 0.22 * Math.sin(7 * a - t * 1.7 + k * 1.3);
        var br = (1 - 0.75 * u) * dop * turb * (front ? 1 : 0.8);
        ctx.strokeStyle = diskColor(u, br * 0.9);
        ctx.beginPath(); ctx.ellipse(bx, by, rx, ry, 0, a, b2); ctx.stroke();
      }
    }
  }
  function drawBlackHole(t, rot) {
    var c = project(0, 0.25, 0, rot);
    var bx = c.x, by = c.y, rs = f * 1.75 / CAM;
    // halo
    var halo = ctx.createRadialGradient(bx, by, rs * 0.8, bx, by, rs * 5.2);
    halo.addColorStop(0, "rgba(255,170,90,0.28)"); halo.addColorStop(0.45, "rgba(150,90,255,0.08)"); halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(bx, by, rs * 5.2, 0, 6.2832); ctx.fill();
    // far side of the disk
    drawDiskHalf(bx, by, rs, t, false);
    // lensed image of the far disk, bent over the top of the shadow
    ctx.save();
    ctx.shadowColor = "rgba(255,190,110,0.9)"; ctx.shadowBlur = rs * 0.6;
    for (var k = 0; k < 5; k++) {
      var u = k / 4;
      ctx.strokeStyle = diskColor(u, (0.85 - 0.6 * u));
      ctx.lineWidth = rs * 0.11;
      ctx.beginPath();
      ctx.ellipse(bx, by + rs * 0.06, rs * (1.2 + 0.32 * u), rs * (1.12 + 0.38 * u), 0, Math.PI * 1.04, Math.PI * 1.96);
      ctx.stroke();
    }
    ctx.restore();
    // shadow
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(bx, by, rs, 0, 6.2832); ctx.fill();
    // photon ring
    ctx.save();
    ctx.shadowColor = "rgba(255,225,180,1)"; ctx.shadowBlur = rs * 0.35;
    ctx.strokeStyle = "rgba(255,236,205,0.95)"; ctx.lineWidth = Math.max(1.2, rs * 0.045);
    ctx.beginPath(); ctx.arc(bx, by, rs * 1.03, 0, 6.2832); ctx.stroke();
    ctx.restore();
    // near side of the disk
    drawDiskHalf(bx, by, rs, t, true);
    return { x: bx, y: by, rs: rs };
  }

  // Hawking pairs: created at the horizon, one partner falls in, one escapes
  function stepPairs(t, dt, bh) {
    if (!reduce && t - lastSpawn > 0.45) {
      lastSpawn = t;
      var a = rand(0, 6.2832);
      pairs.push({ a: a, born: t, v: rand(0.8, 1.3) });
    }
    for (var i = pairs.length - 1; i >= 0; i--) {
      var p = pairs[i], age = t - p.born, life = 2.6;
      if (age > life) { pairs.splice(i, 1); continue; }
      var fade = 1 - age / life;
      var r0 = bh.rs * 1.09;
      var outR = r0 + age * bh.rs * 1.25 * p.v, inR = Math.max(bh.rs * 0.55, r0 - age * bh.rs * 0.35);
      var ox = bh.x + Math.cos(p.a) * outR, oy = bh.y + Math.sin(p.a) * outR * 0.9;
      var ix = bh.x + Math.cos(p.a + 0.15) * inR, iy = bh.y + Math.sin(p.a + 0.15) * inR * 0.9;
      dot(ox, oy, 2.4, "rgba(150,235,255," + (0.95 * fade).toFixed(3) + ")", 10);
      if (inR > bh.rs * 0.97) dot(ix, iy, 2.0, "rgba(255,120,200," + (0.9 * fade).toFixed(3) + ")", 8);
    }
  }
  function dot(x, y, r, col, glow) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, glow);
    g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, glow, 0, 6.2832); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, 6.2832); ctx.fill();
  }

  var t0 = performance.now(), last = t0, running = true;
  function frame(now) {
    var t = reduce ? 3.0 : Math.max(0, (now - t0) / 1000);
    var dt = (now - last) / 1000; last = now;
    var rot = 0.6 + t * 0.05;
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.8);
    bg.addColorStop(0, "#121a33"); bg.addColorStop(0.5, "#0a0f1f"); bg.addColorStop(1, "#05070d");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    drawStars(t);
    drawGrid(t, rot);
    drawHolography(t, rot);
    var bh = drawBlackHole(t, rot);
    stepPairs(t, dt, bh);
    if (!reduce && running) requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", function () { resize(); if (reduce) requestAnimationFrame(frame); });
  if ("IntersectionObserver" in window && !reduce) {
    new IntersectionObserver(function (es) {
      var vis = es[0].isIntersecting;
      if (vis && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
      running = vis;
    }).observe(band);
  }
  requestAnimationFrame(frame);
})();
