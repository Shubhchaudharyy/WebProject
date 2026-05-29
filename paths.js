/* Fix CSS/JS paths for GitHub Pages project sites and subfolders */
(function () {
  if (document.querySelector("base[data-sv-base]")) return;

  var base = "./";
  if (location.protocol === "http:" || location.protocol === "https:") {
    var path = location.pathname;
    if (path.endsWith(".html")) {
      base = path.slice(0, path.lastIndexOf("/") + 1);
    } else if (!path.endsWith("/")) {
      base = path + "/";
    } else {
      base = path;
    }
  }

  var el = document.createElement("base");
  el.href = base;
  el.setAttribute("data-sv-base", "1");
  document.head.appendChild(el);
})();
