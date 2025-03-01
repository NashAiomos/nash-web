var initImg = function() {
  var images = document.querySelectorAll("img")
  Array.prototype.forEach.call(images, function (img) {
    img.addEventListener("click", function () {
      BigPicture({
        el: img,
      });
    });
  });
};
window.addEventListener('mousemove', initImg);

var initAll = function() {

  // 文章评论
  // var script = document.createElement("script");
  // script.type = "text/javascript";
  // script.src = "https://giscus.app/client.js";
  // script.async = true;
  // script.crossOrigin = "anonymous";
  // script.setAttribute("data-repo", "NeutronStarPRO/NeutronStarDAO");
  // script.setAttribute("data-repo-id", "R_kgDOG9yfww");
  // script.setAttribute("data-category", "General");
  // script.setAttribute("data-category-id", "DIC_kwDOG9yfw84COxIc");
  // script.setAttribute("data-mapping", "specific");
  // script.setAttribute("data-term", "blog");
  // script.setAttribute("data-reactions-enabled", "1");
  // script.setAttribute("data-emit-metadata", "0");
  // script.setAttribute("data-input-position", "top");
  // script.setAttribute("data-strict", "1");
  // script.setAttribute("crossorigin", "anonymous");
  // // script.setAttribute("data-theme", "preferred_color_scheme");
  // script.setAttribute("data-lang", "en");
  // // 预先加载评论会更好，这样用户读到那边时，评论就加载好了
  // script.setAttribute("data-loading", "lazy");
  // document.getElementById("giscus-container").appendChild(script);

};
window.addEventListener('load', initAll);
