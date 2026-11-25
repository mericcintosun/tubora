// Inline, so it runs before any /_next/static chunk is requested and still works when one of
// those chunks is the thing that failed. If a chunk 404s (an HTML page from one deployment
// asking a newer deployment for its old build files), the page reloads once to get HTML and
// chunks from the same build. A sessionStorage key per path stops it from looping.
const SCRIPT = `(function(){
  var KEY = "tubora-chunk-reload:" + location.pathname;
  function recover(src){
    try {
      if (sessionStorage.getItem(KEY)) { console.warn("Tubora: a build file did not load after one reload", src); return; }
      sessionStorage.setItem(KEY, "1");
    } catch (e) { return; }
    location.reload();
  }
  window.addEventListener("error", function(ev){
    var t = ev.target;
    var src = t && (t.src || t.href);
    if (src && src.indexOf("/_next/static/") !== -1) recover(src);
  }, true);
  window.addEventListener("unhandledrejection", function(ev){
    var r = ev.reason;
    if (r && (r.name === "ChunkLoadError" || /Loading chunk .* failed/.test(String(r.message)))) recover(String(r.message));
  });
  window.addEventListener("load", function(){
    setTimeout(function(){ try { sessionStorage.removeItem(KEY); } catch (e) {} }, 10000);
  });
})();`;

export function ChunkRecovery() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
