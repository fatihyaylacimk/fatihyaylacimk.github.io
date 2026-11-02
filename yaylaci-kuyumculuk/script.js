'use strict';

const menuButton = document.getElementById('menu-button');
const navigation = document.getElementById('navigation');
function closeMenu() {
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Menüyü aç');
}
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(expanded));
  menuButton.setAttribute('aria-label', expanded ? 'Menüyü kapat' : 'Menüyü aç');
  navigation.classList.toggle('open', expanded);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!navigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
});

const motionButton = document.getElementById('motion-button');
const hero = document.querySelector('.hero');
const heroSlides = [...document.querySelectorAll('.hero-slide')];
const heroDots = [...document.querySelectorAll('.hero-dot')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let slideIndex = 0;
let slideTimer;
function showSlide(index) {
  slideIndex = (index + heroSlides.length) % heroSlides.length;
  heroSlides.forEach((slide, i) => slide.classList.toggle('is-active', i === slideIndex));
  heroDots.forEach((dot, i) => {
    dot.classList.toggle('is-active', i === slideIndex);
    if (i === slideIndex) dot.setAttribute('aria-current', 'true');
    else dot.removeAttribute('aria-current');
  });
}
function scheduleSlides() {
  clearInterval(slideTimer);
  if (!hero.classList.contains('motion-paused') && !reducedMotion.matches) {
    slideTimer = setInterval(() => showSlide(slideIndex + 1), 6500);
  }
}
heroDots.forEach(dot => dot.addEventListener('click', () => {
  showSlide(Number(dot.dataset.slide));
  scheduleSlides();
}));
motionButton.addEventListener('click', () => {
  const paused = hero.classList.toggle('motion-paused');
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.setAttribute('aria-label', paused ? 'Görsel geçişlerini sürdür' : 'Görsel geçişlerini duraklat');
  motionButton.querySelector('path').setAttribute('d', paused ? 'm7 4 8 6-8 6Z' : 'M7 5v10M13 5v10');
  scheduleSlides();
});
reducedMotion.addEventListener('change', scheduleSlides);
scheduleSlides();

const galleryItems = [
  {title: 'Yüzükler', subtitle: 'Bir başlangıcın ışığı', image: 'assets/ring.webp', alt: 'Doğal taş üzerinde zarif altın yüzük'},
  {title: 'Küpeler', subtitle: 'Her bakışta bir detay', image: 'assets/earrings.webp', alt: 'Traverten taş ve bordo kadife üzerinde altın küpeler'},
  {title: 'Bilezikler', subtitle: 'Zamansız bir dokunuş', image: 'assets/bangle.webp', alt: 'Koyu taş üzerinde dokulu altın bilezik'},
  {title: 'Kolyeler', subtitle: 'Hep size yakın', image: 'assets/necklace.webp', alt: 'Bordo kadife üzerine serilmiş altın kolye'},
  {title: 'Alyanslar', subtitle: 'Birlikte atılan adımlar', image: 'assets/bands.webp', alt: 'Traverten taş üzerinde iki altın alyans'},
  {title: 'Bileklikler', subtitle: 'Günlük zarafetin izi', image: 'assets/bracelet.webp', alt: 'Açık renk taş üzerinde ince altın bileklik'}
];
const gallery = document.getElementById('gallery-dialog');
const galleryImage = document.getElementById('gallery-image');
const galleryFrame = document.getElementById('gallery-image-frame');
const zoomButton = document.getElementById('zoom-button');
let galleryIndex = 0;
let galleryOpener = null;
function resetZoom() {
  galleryFrame.classList.remove('zoomed');
  zoomButton.setAttribute('aria-pressed', 'false');
  zoomButton.textContent = 'Yakınlaştır +';
  galleryFrame.scrollTo(0, 0);
}
function renderGallery(index) {
  galleryIndex = (index + galleryItems.length) % galleryItems.length;
  const item = galleryItems[galleryIndex];
  galleryImage.src = item.image;
  galleryImage.alt = item.alt;
  document.getElementById('gallery-title').textContent = item.title;
  document.getElementById('gallery-subtitle').textContent = item.subtitle;
  document.getElementById('gallery-count').textContent = String(galleryIndex + 1).padStart(2, '0') + ' / ' + String(galleryItems.length).padStart(2, '0');
  resetZoom();
}
document.querySelectorAll('[data-gallery]').forEach(button => {
  button.addEventListener('click', () => {
    galleryOpener = button;
    renderGallery(Number(button.dataset.gallery));
    gallery.showModal();
    document.body.classList.add('modal-open');
    document.getElementById('close-gallery').focus();
  });
});
document.getElementById('close-gallery').addEventListener('click', () => gallery.close());
document.getElementById('gallery-prev').addEventListener('click', () => renderGallery(galleryIndex - 1));
document.getElementById('gallery-next').addEventListener('click', () => renderGallery(galleryIndex + 1));
gallery.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); renderGallery(galleryIndex - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); renderGallery(galleryIndex + 1); }
});
gallery.addEventListener('click', event => {
  if (event.target === gallery) {
    const rect = gallery.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) gallery.close();
  }
});
gallery.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  resetZoom();
  galleryOpener?.focus({preventScroll: true});
});
zoomButton.addEventListener('click', () => {
  const zoomed = galleryFrame.classList.toggle('zoomed');
  zoomButton.setAttribute('aria-pressed', String(zoomed));
  zoomButton.textContent = zoomed ? 'Uzaklaştır −' : 'Yakınlaştır +';
  galleryFrame.scrollTo(0, 0);
});
document.getElementById('gallery-visit').addEventListener('click', () => gallery.close());

const giftForm = document.getElementById('gift-form');
const giftPaths = {
  partner: {anniversary: 4, birthday: 3, everyday: 0},
  family: {anniversary: 2, birthday: 1, everyday: 5},
  friend: {anniversary: 1, birthday: 5, everyday: 3},
  self: {anniversary: 0, birthday: 2, everyday: 5}
};
const giftCopy = [
  'Ölçü ve formun birlikte seçilmesi yüzükte fark yaratır. Sade çizgilerden başlayın.',
  'Yüzü çevreleyen küçük bir ayrıntı, bütün görünümü değiştirebilir. Küpe ilhamına bakın.',
  'Bilekte güçlü bir çizgi arayanlar için bilezik formlarına yakından bakın.',
  'Boyna yakın bir hat ya da daha uzun bir siluet: Kolye seçiminde uzunluk kadar his de önemlidir.',
  'Birlikte kurulan hikâyeye eşlik edecek zamansız bir detay. Farklı formları yakından inceleyin.',
  'Gün içinde kolayca eşlik eden ince bir çizgi. Bileklik detaylarından ilham alın.'
];
const occasions = {anniversary: 'ÖZEL BİR GÜN', birthday: 'DOĞUM GÜNÜ', everyday: 'İÇİMDEN GELDİ'};
const styles = {classic: 'ZAMANSIZ', minimal: 'SADE', bold: 'DİKKAT ÇEKEN'};
const slugs = ['yuzukler', 'kupeler', 'bilezikler', 'kolyeler', 'alyanslar', 'bileklikler'];
function updateGift() {
  const choices = new FormData(giftForm);
  const recipient = choices.get('recipient');
  const occasion = choices.get('occasion');
  const style = choices.get('style');
  let index = giftPaths[recipient][occasion];
  if (style === 'minimal' && [2, 4].includes(index)) index = recipient === 'partner' ? 0 : 5;
  if (style === 'bold' && [0, 5].includes(index)) index = recipient === 'self' ? 2 : 1;
  const item = galleryItems[index];
  document.getElementById('guide-image').src = item.image;
  document.getElementById('guide-image').alt = item.alt;
  document.getElementById('guide-kicker').textContent = occasions[occasion] + ' · ' + styles[style];
  document.getElementById('guide-result-title').textContent = item.title;
  document.getElementById('guide-result-copy').textContent = giftCopy[index];
  const link = document.getElementById('guide-open');
  link.href = 'koleksiyon/' + slugs[index] + '/';
  link.firstChild.textContent = item.title + ' koleksiyonunu keşfedin ';
  document.getElementById('guide-preview').dataset.gallery = String(index);
}
giftForm.addEventListener('change', updateGift);
updateGift();

document.getElementById('copy-address').addEventListener('click', async () => {
  const address = 'Yaylacı Kuyumculuk, İnönü Kapalı Çarşısı, Malatya';
  const status = document.getElementById('copy-status');
  try {
    await navigator.clipboard.writeText(address);
    status.textContent = 'Adres kopyalandı.';
  } catch {
    status.textContent = 'Adresi seçerek kopyalayabilirsiniz: ' + address;
  }
});
