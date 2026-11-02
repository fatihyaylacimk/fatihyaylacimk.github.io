'use strict';

const photos = [...document.querySelectorAll('[data-photo]')];
const dialog = document.getElementById('detail-dialog');
const frame = document.getElementById('detail-dialog-image');
const image = document.getElementById('detail-dialog-photo');
const zoom = document.getElementById('detail-zoom');
let current = 0;
let opener = null;

function resetZoom() {
  frame.classList.remove('zoomed');
  zoom.setAttribute('aria-pressed', 'false');
  zoom.textContent = 'Yakınlaştır +';
  frame.scrollTo(0, 0);
}
function display(index) {
  current = (index + photos.length) % photos.length;
  const source = photos[current].querySelector('img');
  image.src = source.src;
  image.alt = source.alt;
  document.getElementById('detail-count').textContent = String(current + 1).padStart(2, '0') + ' / ' + String(photos.length).padStart(2, '0');
  resetZoom();
}
photos.forEach((photo, index) => photo.addEventListener('click', () => {
  opener = photo;
  display(index);
  dialog.showModal();
  document.body.classList.add('modal-open');
  document.getElementById('detail-close').focus();
}));
document.getElementById('detail-close').addEventListener('click', () => dialog.close());
document.getElementById('detail-prev').addEventListener('click', () => display(current - 1));
document.getElementById('detail-next').addEventListener('click', () => display(current + 1));
zoom.addEventListener('click', () => {
  const active = frame.classList.toggle('zoomed');
  zoom.setAttribute('aria-pressed', String(active));
  zoom.textContent = active ? 'Uzaklaştır −' : 'Yakınlaştır +';
  frame.scrollTo(0, 0);
});
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); display(current - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); display(current + 1); }
});
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  resetZoom();
  opener?.focus({preventScroll: true});
});
