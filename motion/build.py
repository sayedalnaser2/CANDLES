"""Build the shared motion code into index.html, about.html and events.html.

Run after editing anything in motion/. Safe to run again: it replaces the marked blocks.
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
M = ROOT / "motion"
css = (M / "motion.css").read_text(encoding="utf-8").strip()
js = (M / "motion.js").read_text(encoding="utf-8").strip()
intro = (M / "intro.html").read_text(encoding="utf-8").strip()

HEAD = ('/*motion-head*/var c="boot",m=false;try{m=!matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}'
        'if(m){c+=" motion";try{if(!sessionStorage.getItem("anneshop-intro")){sessionStorage.setItem("anneshop-intro","1");c+=" intro-on"}'
        'if(sessionStorage.getItem("anneshop-arrive")){sessionStorage.removeItem("anneshop-arrive");c+=" arrive"}}catch(e){}'
        'try{if(window.CSS&&CSS.registerProperty){CSS.registerProperty({name:"--hole",syntax:"<length>",inherits:false,initialValue:"-240px"});c+=" hole"}}catch(e){}'
        'setTimeout(function(){if(!window.__mo)h.classList.add("rv-off")},4000)}h.className=c;/*/motion-head*/')


def put(s, start, end, body, anchor_old, anchor_new):
    block = start + body + end
    pat = re.compile(re.escape(start) + r".*?" + re.escape(end), re.S)
    if pat.search(s):
        return pat.sub(lambda _: block, s, count=1)
    if anchor_old not in s:
        sys.exit("anchor not found: " + anchor_old[:60])
    return s.replace(anchor_old, anchor_new.replace("@@", block), 1)


for name in ("index.html", "about.html", "events.html"):
    p = ROOT / name
    s = p.read_text(encoding="utf-8")
    s = put(s, "/*motion-head*/", "/*/motion-head*/", HEAD[len("/*motion-head*/"):-len("/*/motion-head*/")],
            'h.className="boot";', "@@")
    s = put(s, "/*motion-css*/\n", "\n/*/motion-css*/", css, "\n</style>", "\n@@\n</style>")
    s = put(s, "<!--motion-intro-->\n", "\n<!--/motion-intro-->", intro, "<body>\n", "<body>\n@@\n")
    s = put(s, "<!--motion-js--><script>\n", "\n</script><!--/motion-js-->", js, "\n</body>", "\n@@\n</body>")
    p.write_text(s, encoding="utf-8")
    print("built", name, len(s), "bytes")
