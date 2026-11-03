(function(){
  "use strict";
  /* Motion: candle intro, fade-ins, size-on-scroll, page fades. Does nothing for reduced-motion visitors. */
  var h = document.documentElement, intro = document.getElementById("intro"), each = function(list, fn){ Array.prototype.forEach.call(list, fn); };
  window.__mo = 1;
  if (!h.classList.contains("motion")) { if (intro) intro.remove(); return; }

  /* ---- sections drift up softly as they come into view ---- */
  var started = false;
  function startReveal(){
    if (started) return; started = true;
    each(document.querySelectorAll(".rvs"), function(g){ each(g.children, function(c, i){ c.style.setProperty("--dl", (i * .13).toFixed(2) + "s"); }); });
    var els = document.querySelectorAll(".rv,.rvs");
    if (!("IntersectionObserver" in window)) { each(els, function(e){ e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function(list){
      list.forEach(function(en){ if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, {rootMargin:"0px 0px -6% 0px", threshold:.06});
    each(els, function(e){ io.observe(e); });
  }

  /* ---- cozy candle-lighting intro (first page of a visit); tap, key or scroll skips it ---- */
  if (intro && h.classList.contains("intro-on")) {
    var ended = false, evs = ["pointerdown", "keydown", "wheel", "touchstart"];
    var aim = function(){   /* the light spreads out from the flame */
      var g = intro.querySelector(".i-glow"); if (!g) return;
      var r = g.getBoundingClientRect();
      intro.style.setProperty("--fx", Math.round(r.left + r.width / 2) + "px");
      intro.style.setProperty("--fy", Math.round(r.top + r.height / 2) + "px");
    };
    var end = function(){ if (ended) return; ended = true; h.classList.remove("intro-on", "intro-skip"); intro.remove(); evs.forEach(function(ev){ removeEventListener(ev, skip, true); }); removeEventListener("resize", aim); };
    var skip = function(){ if (ended || h.classList.contains("intro-skip")) return; h.classList.add("intro-skip"); intro.style.pointerEvents = "none"; startReveal(); setTimeout(end, 520); };
    evs.forEach(function(ev){ addEventListener(ev, skip, {capture:true, passive:true}); });
    addEventListener("resize", aim);
    aim(); setTimeout(aim, 1100);
    setTimeout(function(){ intro.style.pointerEvents = "none"; }, 4000);   /* page is usable while the light spreads */
    setTimeout(startReveal, 4100);
    setTimeout(end, 5550);
  } else {
    if (intro) intro.remove();
    startReveal();
  }

  /* ---- items grow toward the middle of the screen and shrink toward the edges, easing softly ---- */
  var items = [], dirty = true, raf = 0, last = 0, cur = new WeakMap();
  function req(){ if (!raf) raf = requestAnimationFrame(frame); }
  function frame(t){
    raf = 0;
    var dt = last ? Math.min(64, t - last) : 16.7, a = 1 - Math.pow(1 - .14, dt / 16.7), moving = false; last = t;
    if (dirty) { items = Array.prototype.slice.call(document.querySelectorAll(".sz")); dirty = false; }
    var vh = innerHeight || 1;
    h.classList.toggle("scrolled", (window.scrollY || window.pageYOffset || 0) > 12);
    var rs = items.map(function(el){ var r = el.getBoundingClientRect(); return (!r.width || r.bottom < -vh * .3 || r.top > vh * 1.3) ? null : r; });
    items.forEach(function(el, i){
      var r = rs[i]; if (!r) { cur.delete(el); return; }
      var min = parseFloat(el.getAttribute("data-sz")) || .88, outOnly = el.hasAttribute("data-sz-out");
      var d = (r.top + r.height / 2 - vh / 2) / (vh / 2);
      var k = Math.min(1, Math.max(0, (Math.abs(d) - .38) / .62)); k = k * k * (3 - 2 * k);
      if (d < 0) { if (!outOnly) k *= .6; } else if (outOnly) k = 0;
      var s = 1 - k * (1 - min), o = Math.max(.3, 1 - k * (1 - min) * 4.5), c = cur.get(el);
      if (!c) c = {s:s, o:o};
      else { c.s += (s - c.s) * a; c.o += (o - c.o) * a;
        if (Math.abs(s - c.s) > .0012 || Math.abs(o - c.o) > .004) moving = true; else { c.s = s; c.o = o; } }
      cur.set(el, c);
      el.style.scale = c.s.toFixed(4);
      el.style.opacity = c.o.toFixed(3);
    });
    if (moving) req(); else last = 0;
  }
  addEventListener("scroll", req, {passive:true});
  addEventListener("resize", function(){ dirty = true; req(); });
  addEventListener("load", req);
  new MutationObserver(function(){ dirty = true; req(); }).observe(document.body, {childList:true, subtree:true});
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(req);
  req();

  /* ---- page to page: a soft fade where the browser has no View Transitions ---- */
  if (!("onpagereveal" in window)) {
    document.addEventListener("click", function(e){
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest ? e.target.closest("a[href]") : null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      var u; try { u = new URL(a.getAttribute("href"), location.href); } catch(x) { return; }
      if (u.origin !== location.origin || u.pathname === location.pathname) return;
      e.preventDefault();
      try { sessionStorage.setItem("anneshop-arrive", "1"); } catch(x) {}
      h.classList.add("leaving");
      setTimeout(function(){ location.href = u.href; }, 300);
    });
    addEventListener("pageshow", function(e){ if (e.persisted) h.classList.remove("leaving"); });
  }
})();
