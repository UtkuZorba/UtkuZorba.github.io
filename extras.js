/* Visual extras: speed-of-light dial, publication chart, career ribbon,
   scroll reveal. Works on both the English and Turkish pages. */
(function () {
  var TR = (document.documentElement.lang || "").indexOf("tr") === 0;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  var me = document.currentScript;
  var sheet = document.createElement("link");
  sheet.rel = "stylesheet";
  sheet.href = me ? me.src.replace(/extras\.js(\?.*)?$/, "extras.css") : "extras.css";
  document.head.appendChild(sheet);
  var SVGNS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /* ---------- 0. Add the new page parts (dial, icons, career strip) ---------- */
  (function () {
    var G = [
      '<path d="M6 36h24l12-7H18z" opacity=".45"/><path class="v" d="M6 25h24l12-7H18z"/><path d="M6 14h24l12-7H18z"/>',
      '<path d="M24 5v38" opacity=".45"/><path class="v" d="M24 24 21 7M24 24l3-17M24 24l-3 17M24 24l3 17"/><ellipse cx="24" cy="7" rx="3" ry="1.2"/><ellipse cx="24" cy="41" rx="3" ry="1.2"/><circle cx="24" cy="24" r="2" fill="currentColor"/>',
      '<ellipse cx="11" cy="24" rx="4" ry="10"/><path d="M11 14c12-4 18 4 27 4M11 34c12 4 18-4 27-4"/><ellipse class="v" cx="38" cy="24" rx="2.5" ry="6"/>',
      '<circle cx="12" cy="24" r="7"/><circle class="v" cx="36" cy="24" r="7"/><path d="M20 20h8l-3-3M28 28h-8l3 3"/>',
      '<path d="M24 24 8 10M24 24 40 10M24 24 8 38M24 24l16 14" opacity=".55"/><ellipse class="v" cx="24" cy="10" rx="16" ry="3.5"/><ellipse class="v" cx="24" cy="38" rx="16" ry="3.5"/><circle cx="24" cy="24" r="2.2" fill="currentColor"/>',
      '<circle cx="24" cy="24" r="17" opacity=".3"/><circle class="v" cx="24" cy="24" r="11.5"/><circle cx="24" cy="24" r="6.5" fill="currentColor"/>'
    ];
    var research = document.getElementById("research");
    if (research) {
      [].forEach.call(research.querySelectorAll(".card"), function (card, i) {
        if (!G[i]) return;
        card.insertAdjacentHTML("afterbegin", '<svg class="glyph" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + G[i] + '</svg>');
      });
      var D = TR ? {
        k: "Etkileşimli · kaydırıcıyı sürükleyin", h: "Işık hızı bir ayar düğmesi olsaydı?",
        p: "Görelilikte ışık hızı <i>c</i>, uzayı ve zamanı birbirine bağlar. Araştırmalarım bu düğmenin iki ucunda neler olduğunu inceliyor: <i>c</i> sıfıra gittiğinde (Carroll) ve sonsuza gittiğinde (Galile).",
        a: "Işık hızı", g: "Galile"
      } : {
        k: "Interactive · drag the slider", h: "What if the speed of light were a dial?",
        p: "In relativity, the speed of light <i>c</i> links space and time. My research follows what happens at the two ends of this dial: when <i>c</i> goes to zero (Carroll) and when it goes to infinity (Galilei).",
        a: "Speed of light", g: "Galilei"
      };
      research.insertAdjacentHTML("beforebegin",
        '<div class="dial" id="dial"><div>' +
        '<p class="kicker">' + D.k + '</p><h2>' + D.h + '</h2><p>' + D.p + '</p>' +
        '<div class="dial-ctl"><input type="range" id="c-range" min="-1" max="1" step="0.001" value="0" aria-label="' + D.a + '">' +
        '<div class="dial-ends"><span><b>Carroll</b> c → 0</span><span id="c-value">c = 1</span><span><b>' + D.g + '</b> c → ∞</span></div></div>' +
        '<p id="c-state"></p></div><canvas id="cones" aria-hidden="true"></canvas></div>');
    }
    var cvTitle = document.querySelector("#cv h2");
    if (cvTitle && !document.getElementById("career")) cvTitle.insertAdjacentHTML("afterend", '<div id="career"></div>');
  })();

  /* ---------- 1. The c dial: light cones from Carroll to Galilei ---------- */
  (function () {
    var canvas = document.getElementById("cones");
    var range = document.getElementById("c-range");
    var state = document.getElementById("c-state");
    var readout = document.getElementById("c-value");
    if (!canvas || !range) return;
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, dpr = 1, touched = false, s = 0;

    var TEXT = TR ? {
      car: "<b>Carroll limiti (c → 0).</b> Işık konileri kapanır, parçacıklar hareket edemez ve uzay mutlak hâle gelir. Bu geometri kara delik ufuklarında ve düz uzay holografisinin sahnesi olan ışıksı sonsuzda ortaya çıkar.",
      lor: "<b>Einstein’ın görelilik kuramı.</b> c sonlu; ışık konileri 45°’de açılır ve uzay ile zaman birbirine bağlıdır.",
      gal: "<b>Galile limiti (c → ∞).</b> Işık konileri yassılaşarak açılır, zaman mutlak hâle gelir ve kütleçekim Newton–Cartan geometrisine dönüşür."
    } : {
      car: "<b>Carroll limit (c → 0).</b> Light cones close up, particles cannot move and space becomes absolute. This geometry appears on black hole horizons and at null infinity, the stage of flat-space holography.",
      lor: "<b>Einstein’s relativity.</b> c is finite, light cones open at 45°, and space and time are tied together.",
      gal: "<b>Galilean limit (c → ∞).</b> Light cones open flat, time becomes absolute and gravity turns into Newton–Cartan geometry."
    };

    function resize() {
      var r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function smooth(a, b, x) { var u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); }
    function rgba(hex, a) {
      hex = hex.replace("#", "");
      if (hex.length === 3) hex = hex.replace(/(.)/g, "$1$1");
      var n = parseInt(hex, 16);
      return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
    }

    function draw(time) {
      var c = Math.pow(10, 1.7 * s);              // c from ~0.02 to ~50
      var ink = css("--ink") || "#1d232b", fut = css("--violet") || "#6b4fd6", past = css("--accent") || "#1f5a7a";
      ctx.clearRect(0, 0, W, H);
      var u = Math.min(W, H) / 2.4;               // pixels per unit, same on both axes
      var ox = W / 2, oy = H / 2;
      function X(x) { return ox + x * u; }
      function Y(t) { return oy - t * u; }
      var xmax = W / 2 / u, tmax = H / 2 / u;

      // absolute time slices (Galilei) and absolute space lines (Carroll)
      var gA = 0.55 * smooth(0.35, 1.4, Math.log(c) / Math.LN10);
      var cA = 0.55 * smooth(0.35, 1.4, -Math.log(c) / Math.LN10);
      ctx.lineWidth = 1;
      for (var k = -6; k <= 6; k++) {
        if (gA > 0.01) { ctx.strokeStyle = rgba(fut, gA * 0.5); ctx.beginPath(); ctx.moveTo(0, Y(k * 0.32)); ctx.lineTo(W, Y(k * 0.32)); ctx.stroke(); }
        if (cA > 0.01) { ctx.strokeStyle = rgba(past, cA * 0.5); ctx.beginPath(); ctx.moveTo(X(k * 0.32), 0); ctx.lineTo(X(k * 0.32), H); ctx.stroke(); }
      }

      // axes
      ctx.strokeStyle = rgba(ink, 0.35); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(14, oy); ctx.lineTo(W - 14, oy); ctx.moveTo(ox, H - 10); ctx.lineTo(ox, 12); ctx.stroke();
      ctx.fillStyle = rgba(ink, 0.6); ctx.font = "italic 15px 'Source Serif 4', Georgia, serif";
      ctx.fillText("t", ox + 8, 24); ctx.fillText("x", W - 24, oy - 8);

      // light cones at a few events
      var events = [[0, 0, 1], [-1.15, 0.55, 0.62], [1.1, -0.6, 0.62], [-0.95, -0.75, 0.5], [1.05, 0.7, 0.5]];
      for (var i = 0; i < events.length; i++) {
        var ex = events[i][0], et = events[i][1], sc = events[i][2];
        var L = 0.62 * sc;                        // cone length in time
        var w = Math.min(c * L, xmax * 1.6);      // half width at the end
        var h = (c * L > xmax * 1.6) ? xmax * 1.6 / c : L;
        for (var dir = -1; dir <= 1; dir += 2) {
          var col = dir > 0 ? fut : past;
          var g = ctx.createLinearGradient(X(ex), Y(et), X(ex), Y(et + dir * h));
          g.addColorStop(0, rgba(col, 0.42)); g.addColorStop(1, rgba(col, 0.04));
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.moveTo(X(ex), Y(et));
          ctx.lineTo(X(ex - w), Y(et + dir * h)); ctx.lineTo(X(ex + w), Y(et + dir * h)); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = rgba(col, 0.75); ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(X(ex - w), Y(et + dir * h)); ctx.lineTo(X(ex), Y(et)); ctx.lineTo(X(ex + w), Y(et + dir * h)); ctx.stroke();
        }
        ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(X(ex), Y(et), 3, 0, 6.2832); ctx.fill();
      }

      // a particle world line: its speed always stays below c
      var om = 2.4, v = 0.8 * c, A = Math.min(v / om, xmax * 0.8);
      var ph = reduce ? 0 : time * 0.0012;
      ctx.strokeStyle = rgba(ink, 0.85); ctx.lineWidth = 2;
      ctx.beginPath();
      for (var j = 0; j <= 120; j++) {
        var tt = -tmax + 2 * tmax * j / 120;
        var xx = A * Math.sin(om * tt + ph);
        if (j === 0) ctx.moveTo(X(xx), Y(tt)); else ctx.lineTo(X(xx), Y(tt));
      }
      ctx.stroke();

      // text
      var mode = s < -0.33 ? "car" : (s > 0.33 ? "gal" : "lor");
      if (state.getAttribute("data-mode") !== mode) { state.innerHTML = TEXT[mode]; state.setAttribute("data-mode", mode); }
      readout.textContent = "c = " + (c < 1 ? c.toFixed(2) : c < 10 ? c.toFixed(1) : Math.round(c));
      range.value = s.toFixed(3);
    }

    var running = true, visible = true;
    function loop(now) {
      if (!touched && !reduce) s = Math.sin(now * 0.00032) * 0.95;
      draw(now);
      if (running && visible && !reduce) requestAnimationFrame(loop);
    }
    range.addEventListener("input", function () {
      touched = true; s = parseFloat(range.value);
      if (reduce) draw(0);
    });
    resize();
    function refit() { resize(); draw(performance.now()); }
    window.addEventListener("resize", refit);
    if ("ResizeObserver" in window) new ResizeObserver(refit).observe(canvas);
    sheet.addEventListener("load", refit);
    if ("IntersectionObserver" in window && !reduce) {
      new IntersectionObserver(function (es) {
        var was = visible; visible = es[0].isIntersecting;
        if (visible && !was) requestAnimationFrame(loop);
      }).observe(canvas);
    }
    if (reduce) { s = 0; draw(0); } else requestAnimationFrame(loop);
  })();

  /* ---------- 2. Publications: papers per year + journals ---------- */
  (function () {
    var sec = document.getElementById("publications");
    if (!sec) return;
    var lists = sec.querySelectorAll("ol.pubs");
    if (lists.length < 2) return;
    var items = [], years = {}, journals = {};
    function add(li, y, pre) {
      li.setAttribute("data-year", y); items.push(li);
      years[y] = years[y] || { j: 0, p: 0 };
      years[y][pre ? "p" : "j"]++;
    }
    [].forEach.call(lists[0].children, function (li) {
      var m = li.textContent.match(/arXiv:(\d\d)\d\d\./);
      if (m) add(li, 2000 + parseInt(m[1], 10), true);
    });
    [].forEach.call(lists[1].children, function (li) {
      var j = li.querySelector(".j");
      var m = j && j.textContent.match(/\((20\d\d)\)/);
      if (!m) return;
      add(li, parseInt(m[1], 10), false);
      var name = j.querySelector("i");
      if (name) journals[name.textContent] = (journals[name.textContent] || 0) + 1;
    });
    var ys = Object.keys(years).map(Number);
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var maxN = 1;
    for (var y = y0; y <= y1; y++) if (years[y]) maxN = Math.max(maxN, years[y].j + years[y].p);

    var wrap = document.createElement("div"); wrap.className = "pub-viz";
    var n = y1 - y0 + 1, BW = 46, GAP = 14, PH = 120, top = 18;
    var Wd = n * BW + (n - 1) * GAP, Hd = top + PH + 30;
    var svg = el("svg", { viewBox: "0 0 " + Wd + " " + Hd, role: "img",
      "aria-label": TR ? "Yıllara göre yayın sayısı" : "Papers per year" }, wrap);
    var active = null;
    function setActive(yr) {
      active = (active === yr) ? null : yr;
      sec.classList.toggle("filtering", active !== null);
      items.forEach(function (li) { li.classList.toggle("hit", +li.getAttribute("data-year") === active); });
      [].forEach.call(svg.querySelectorAll(".bar"), function (b) { b.classList.toggle("on", +b.getAttribute("data-year") === active); });
    }
    for (var i = 0; i < n; i++) {
      var yr = y0 + i, d = years[yr] || { j: 0, p: 0 }, x = i * (BW + GAP);
      var g = el("g", { "class": "bar", "data-year": yr, tabindex: (d.j + d.p) ? 0 : -1 }, svg);
      var unit = PH / maxN;
      el("rect", { x: x, y: top, width: BW, height: PH, "class": "bar-bg", rx: 6 }, g);
      var hj = d.j * unit, hp = d.p * unit;
      if (d.j) el("rect", { x: x, y: top + PH - hj, width: BW, height: hj, rx: 6, "class": "bar-j" }, g);
      if (d.p) el("rect", { x: x + 1, y: top + PH - hj - hp + 1, width: BW - 2, height: hp - 3, rx: 6, "class": "bar-p" }, g);
      if (d.j + d.p) { var tl = el("text", { x: x + BW / 2, y: top + PH - hj - hp - 6, "class": "bar-n" }, g); tl.textContent = d.j + d.p; }
      var yl = el("text", { x: x + BW / 2, y: top + PH + 20, "class": "bar-y" }, g); yl.textContent = yr;
      if (d.j + d.p) {
        (function (yr) {
          g.addEventListener("click", function () { setActive(yr); });
          g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActive(yr); } });
        })(yr);
      }
    }
    var legend = document.createElement("div"); legend.className = "pub-legend";
    legend.innerHTML =
      '<span class="key"><i class="sw sw-j"></i>' + (TR ? "Dergi makalesi" : "Journal article") + '</span>' +
      '<span class="key"><i class="sw sw-p"></i>' + (TR ? "Ön baskı" : "Preprint") + '</span>' +
      '<span class="hint">' + (TR ? "Bir yıla tıklayınca o yılın makaleleri öne çıkar." : "Click a year to highlight its papers.") + '</span>';
    var jl = document.createElement("div"); jl.className = "journals";
    Object.keys(journals).sort(function (a, b) { return journals[b] - journals[a]; }).forEach(function (k) {
      var s = document.createElement("span"); s.className = "jchip";
      s.innerHTML = k + " <b>" + journals[k] + "</b>"; jl.appendChild(s);
    });
    wrap.appendChild(legend); wrap.appendChild(jl);
    var note = sec.querySelector(".note");
    note.parentNode.insertBefore(wrap, note.nextSibling);
  })();

  /* ---------- 3. Career ribbon ---------- */
  (function () {
    var host = document.getElementById("career");
    if (!host) return;
    var L = TR ? {
      home: "İstanbul", away: "Yurt dışı", now: "bugün",
      bars: [[2013, 2021, "İTÜ", 0], [2021, 2023, "Boğaziçi", 0], [2023, 2024, "İTÜ", 0], [2024, 2026.9, "İÜC", 0, 1],
             [2019, 2020, "Groningen", 1], [2025.75, 2025.92, "Kopenhag · NBI", 1]],
      dots: [[2010, "Lisans"], [2014, "Y. Lisans"], [2021, "Doktora"]]
    } : {
      home: "Istanbul", away: "Abroad", now: "now",
      bars: [[2013, 2021, "ITU", 0], [2021, 2023, "Boğaziçi", 0], [2023, 2024, "ITU", 0], [2024, 2026.9, "IUC", 0, 1],
             [2019, 2020, "Groningen", 1], [2025.75, 2025.92, "Copenhagen · NBI", 1]],
      dots: [[2010, "B.Sc."], [2014, "M.Sc."], [2021, "Ph.D."]]
    };
    var A = 2009.5, B = 2027, PADL = 78, Wd = 760, Hd = 150;
    function X(y) { return PADL + (y - A) / (B - A) * (Wd - PADL - 10); }
    var svg = el("svg", { viewBox: "0 0 " + Wd + " " + Hd, role: "img",
      "aria-label": TR ? "Kariyer zaman çizelgesi" : "Career timeline" }, host);
    var lanes = [28, 66], axisY = 106;
    el("text", { x: 0, y: lanes[0] + 15, "class": "lane" }, svg).textContent = L.home;
    el("text", { x: 0, y: lanes[1] + 15, "class": "lane" }, svg).textContent = L.away;
    for (var y = 2010; y <= 2026; y += 2) {
      el("line", { x1: X(y), x2: X(y), y1: 16, y2: axisY, "class": "grid" }, svg);
      el("text", { x: X(y), y: axisY + 38, "class": "tick" }, svg).textContent = y;
    }
    el("line", { x1: X(2010), x2: X(2026.9), y1: axisY, y2: axisY, "class": "axis" }, svg);
    L.bars.forEach(function (b) {
      var x1 = X(b[0]), x2 = Math.max(X(b[1]), x1 + 8), lane = lanes[b[3]];
      el("rect", { x: x1, y: lane, width: x2 - x1 - 2, height: 22, rx: 5, "class": "seg" + (b[3] ? " away" : "") + (b[4] ? " current" : "") }, svg);
      var inside = (x2 - x1) > b[2].length * 7.4 + 10;
      var flip = !inside && x2 + 6 + b[2].length * 7.4 > Wd;
      var t = el("text", { x: inside ? (x1 + x2) / 2 - 1 : flip ? x1 - 6 : x2 + 6, y: lane + 15, "class": inside ? "seg-l" : "seg-o" }, svg);
      t.textContent = b[2];
      if (inside) t.setAttribute("text-anchor", "middle");
      if (flip) t.setAttribute("text-anchor", "end");
    });
    L.dots.forEach(function (d) {
      el("circle", { cx: X(d[0]), cy: axisY, r: 6, "class": "deg" }, svg);
      el("text", { x: X(d[0]), y: axisY + 20, "class": "deg-l" }, svg).textContent = d[1];
    });
  })();

  /* ---------- 4. Gentle reveal on scroll ---------- */
  (function () {
    if (reduce || !("IntersectionObserver" in window)) return;
    var els = document.querySelectorAll("main h2, .card, .course, .timeline li, .pub-viz, .dial, #career");
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    [].forEach.call(els, function (e) {
      if (e.getBoundingClientRect().top < window.innerHeight) return;
      e.classList.add("reveal"); io.observe(e);
    });
  })();
})();
