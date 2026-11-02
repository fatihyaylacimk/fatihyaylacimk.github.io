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
motionButton.addEventListener('click', () => {
  const paused = document.querySelector('.hero').classList.toggle('motion-paused');
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.setAttribute('aria-label', paused ? 'Görsel hareketini sürdür' : 'Görsel hareketini duraklat');
  motionButton.querySelector('path').setAttribute('d', paused ? 'm7 4 8 6-8 6Z' : 'M7 5v10M13 5v10');
});

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

const guideItems = [
  {kicker: 'BİRLİKTE BAŞLAYAN HİKÂYELER', title: 'Bir söz, iki hayat.', copy: 'Birlikte atılan ilk adımı hatırlatan sade bir detay. Alyans ve yüzük ilhamına yakından bakın.', image: 'assets/bands.webp', alt: 'Traverten üzerinde iki altın alyans', gallery: 4},
  {kicker: 'İÇTEN GELEN BİR HEDİYE', title: 'Hatırlanacak bir an.', copy: 'Bazen küçük bir kutu, söylemek istediğiniz her şeyi anlatır. Küpe ilhamına yakından bakın.', image: 'assets/earrings.webp', alt: 'Traverten ve kadife üzerinde altın küpeler', gallery: 1},
  {kicker: 'KENDİNİZE AYIRDIĞINIZ AN', title: 'Işıltı sizinle başlar.', copy: 'Günlük stilinize eşlik eden ince bir çizgi. Bileklik ilhamına yakından bakın.', image: 'assets/bracelet.webp', alt: 'Açık renk taş üzerinde ince altın bileklik', gallery: 5}
];
const guideTabs = [...document.querySelectorAll('.guide-tab')];
const guidePanel = document.getElementById('guide-panel');
function selectGuide(index, focus = false) {
  const item = guideItems[index];
  guideTabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
  });
  guidePanel.setAttribute('aria-labelledby', guideTabs[index].id);
  document.getElementById('guide-image').src = item.image;
  document.getElementById('guide-image').alt = item.alt;
  document.getElementById('guide-number').textContent = String(index + 1).padStart(2, '0') + ' / 03';
  document.getElementById('guide-kicker').textContent = item.kicker;
  document.getElementById('guide-result-title').textContent = item.title;
  document.getElementById('guide-result-copy').textContent = item.copy;
  document.getElementById('guide-open').dataset.gallery = String(item.gallery);
  if (focus) guideTabs[index].focus();
}
guideTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectGuide(index));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % guideTabs.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + guideTabs.length - 1) % guideTabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = guideTabs.length - 1;
    else return;
    event.preventDefault();
    selectGuide(next, true);
  });
});

document.getElementById('copy-address').addEventListener('click', async () => {
  const address = 'Yaylacı Kuyumculuk, Kapalı Çarşı, Malatya';
  const status = document.getElementById('copy-status');
  try {
    await navigator.clipboard.writeText(address);
    status.textContent = 'Adres kopyalandı.';
  } catch {
    status.textContent = 'Adresi seçerek kopyalayabilirsiniz: ' + address;
  }
});
