/* Research group section. To add or remove a member, edit the MEMBERS list below. */
(function () {
  var MEMBERS = [
    { name: "Ertuğrul Ekzi", level: "phd",
      en: "Physics Engineering, Istanbul Technical University",
      tr: "Fizik Mühendisliği, İstanbul Teknik Üniversitesi" },
    { name: "Enes Bal", level: "msc",
      en: "Physics Engineering, Istanbul Technical University",
      tr: "Fizik Mühendisliği, İstanbul Teknik Üniversitesi" },
    { name: "Mert Acar", level: "bsc",
      en: "",
      tr: "" }
  ];

  var TR = (document.documentElement.lang || "").indexOf("tr") === 0;
  var T = TR ? {
    nav: "Grup", title: "Araştırma Grubu",
    intro: "Lorentz-dışı kütleçekim ve sicim teorisi üzerine birlikte çalıştığım öğrenciler.",
    badge: { phd: "Doktora öğrencisi", msc: "Yüksek lisans öğrencisi", bsc: "Lisans öğrencisi" },
    joinT: "Gruba katılın",
    joinP: "Bir doktora sonrası araştırmacı ve bir lisansüstü öğrenci için açık pozisyonlar →"
  } : {
    nav: "Group", title: "Research Group",
    intro: "Students I work with on non-Lorentzian gravity and string theory.",
    badge: { phd: "Ph.D. student", msc: "M.Sc. student", bsc: "Undergraduate student" },
    joinT: "Join the group",
    joinP: "Open positions for one postdoc and one graduate student →"
  };

  var research = document.getElementById("research");
  if (!research || document.getElementById("group")) return;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function initials(n) { return n.split(/\s+/).map(function (w) { return w.charAt(0); }).join("").slice(0, 2); }

  var html = '<section id="group"><h2>' + T.title + '</h2><p class="group-intro">' + T.intro + '</p><div class="members">';
  MEMBERS.forEach(function (m) {
    html += '<div class="member ' + m.level + '">' +
      '<span class="avatar" aria-hidden="true">' + esc(initials(m.name)) + '</span>' +
      '<div><span class="badge">' + T.badge[m.level] + '</span>' +
      '<h3>' + esc(m.name) + '</h3>' + ((TR ? m.tr : m.en) ? '<p>' + esc(TR ? m.tr : m.en) + '</p>' : '') + '</div></div>';
  });
  html += '<a class="member join" href="#positions"><span class="avatar" aria-hidden="true">+</span>' +
    '<div><h3>' + T.joinT + '</h3><p>' + T.joinP + '</p></div></a>';
  html += '</div></section>';
  research.insertAdjacentHTML("afterend", html);

  // menu link right after "Research"
  var navLink = document.querySelector('.nav a[href="#research"]');
  if (navLink) navLink.insertAdjacentHTML("afterend", '<a href="#group">' + T.nav + '</a>');

  // styles
  var st = document.createElement("style");
  st.textContent =
    '.group-intro{color:var(--muted);margin:0 0 18px}' +
    '.members{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px}' +
    '.member{display:flex;gap:14px;align-items:flex-start;padding:18px;border-radius:14px;background:var(--surface);border:1px solid var(--line);transition:transform .25s ease,box-shadow .25s ease}' +
    '.member:hover{transform:translateY(-3px);box-shadow:0 10px 28px -14px color-mix(in srgb,var(--violet,#6b4fd6) 55%,transparent)}' +
    '.member h3{margin:6px 0 4px;font-size:1.08rem}' +
    '.member p{margin:0;font-size:.9rem;color:var(--muted);line-height:1.45}' +
    '.member .avatar{flex:none;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;font:600 1.05rem var(--sans);color:#fff;letter-spacing:.02em}' +
    '.member.phd .avatar{background:linear-gradient(135deg,var(--accent),var(--violet,#6b4fd6))}' +
    '.member.msc .avatar{background:linear-gradient(135deg,#2a8fb8,var(--accent))}' +
    '.member.bsc .avatar{background:linear-gradient(135deg,#d89a3c,#c0603a)}' +
    '.member .badge{display:inline-block;font-size:.7rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:2px 8px;border-radius:999px;background:var(--accent-soft);color:var(--accent)}' +
    '.member.join{border-style:dashed;text-decoration:none;color:inherit}' +
    '.member.join:hover{text-decoration:none;border-color:var(--violet,#6b4fd6)}' +
    '.member.join .avatar{background:transparent;border:2px dashed var(--violet,#6b4fd6);color:var(--violet,#6b4fd6);font-size:1.5rem}' +
    '.member.join h3{color:var(--violet,#6b4fd6)}';
  document.head.appendChild(st);

  // gentle reveal, same as the other parts
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return;
  var els = document.querySelectorAll("#group h2, #group .member");
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  [].forEach.call(els, function (e) {
    if (e.getBoundingClientRect().top < window.innerHeight) return;
    e.classList.add("reveal"); io.observe(e);
  });
})();
