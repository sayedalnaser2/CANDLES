(function(){
  "use strict";
  /* Motion: candle intro, fade-ins, size-on-scroll, page fades. Does nothing for reduced-motion visitors. */
  var h = document.documentElement, intro = document.getElementById("intro"), each = function(list, fn){ Array.prototype.forEach.call(list, fn); };
  window.__mo = 1;
  if (!h.classList.contains("motion")) { if (intro) intro.remove(); return; }

  /* ---- sections fade up as they come into view ---- */
  var started = false;
  function startReveal(){
    if (started) return; started = true;
    each(document.querySelectorAll(".rvs"), function(g){ each(g.children, function(c, i){ c.style.setProperty("--dl", (i * .09).toFixed(2) + "s"); }); });
    var els = document.querySelectorAll(".rv,.rvs");
    if (!("IntersectionObserver" in window)) { each(els, function(e){ e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function(list){
      list.forEach(function(en){ if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, {rootMargin:"0px 0px -6% 0px", threshold:.06});
    each(els, function(e){ io.observe(e); });
  }

  /* ---- candle-lighting intro (first page of a visit), tap or key to skip ---- */
  if (intro && h.classList.contains("intro-on")) {
    var ended = false, evs = ["pointerdown", "keydown", "wheel", "touchstart"];
    var end = function(){ if (ended) return; ended = true; h.classList.remove("intro-on", "intro-skip"); intro.remove(); evs.forEach(function(ev){ removeEventListener(ev, skip, true); }); };
    var skip = function(){ if (ended || h.classList.contains("intro-skip")) return; h.classList.add("intro-skip"); startReveal(); setTimeout(end, 300); };
    evs.forEach(function(ev){ addEventListener(ev, skip, {capture:true, passive:true}); });
    setTimeout(startReveal, 1650);
    setTimeout(end, 2300);
  } else {
    if (intro) intro.remove();
    startReveal();
  }

  /* ---- items grow toward the middle of the screen and shrink toward the edges ---- */
  var items = [], dirty = true, raf = 0;
  function req(){ if (!raf) raf = requestAnimationFrame(frame); }
  function frame(){
    raf = 0;
    if (dirty) { items = Array.prototype.slice.call(document.querySelectorAll(".sz")); dirty = false; }
    var vh = innerHeight || 1;
    h.classList.toggle("scrolled", (window.scrollY || window.pageYOffset || 0) > 12);
    var rs = items.map(function(el){ var r = el.getBoundingClientRect(); return (!r.width || r.bottom < -vh * .3 || r.top > vh * 1.3) ? null : r; });
    items.forEach(function(el, i){
      var r = rs[i]; if (!r) return;
      var min = parseFloat(el.getAttribute("data-sz")) || .88, outOnly = el.hasAttribute("data-sz-out");
      var d = (r.top + r.height / 2 - vh / 2) / (vh / 2);
      var k = Math.min(1, Math.max(0, (Math.abs(d) - .38) / .62)); k = k * k * (3 - 2 * k);
      if (d < 0) { if (!outOnly) k *= .6; } else if (outOnly) k = 0;
      el.style.scale = (1 - k * (1 - min)).toFixed(4);
      el.style.opacity = Math.max(.3, 1 - k * (1 - min) * 4.5).toFixed(3);
    });
  }
  addEventListener("scroll", req, {passive:true});
  addEventListener("resize", function(){ dirty = true; req(); });
  addEventListener("load", req);
  new MutationObserver(function(){ dirty = true; req(); }).observe(document.body, {childList:true, subtree:true});
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(req);
  req();

  /* ---- page to page: a short fade where the browser has no View Transitions ---- */
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
      setTimeout(function(){ location.href = u.href; }, 210);
    });
    addEventListener("pageshow", function(e){ if (e.persisted) h.classList.remove("leaving"); });
  }
})();
