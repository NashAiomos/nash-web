/* global BigPicture */
// Delegation also covers images rendered after client-side navigation.
document.addEventListener('click', function (event) {
  var img = event.target instanceof Element ? event.target.closest('main .prose img') : null
  if (!img || img.closest('a') || typeof BigPicture !== 'function') return
  BigPicture({ el: img, imgSrc: img.dataset.originalSrc || img.currentSrc || img.src })
})
