/* global BigPicture */
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
