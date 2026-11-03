'use strict';

document.querySelectorAll('[data-share-link]').forEach(button => {
  button.addEventListener('click', async () => {
    const url = new URL(button.dataset.shareLink, window.location.href).href;
    const title = button.dataset.shareTitle || 'Yaylacı Kuyumculuk';
    const status = button.closest('section')?.querySelector('.campaign-share-status');
    if (status) status.textContent = '';
    try {
      if (navigator.share) {
        await navigator.share({title, url});
        return;
      }
      await navigator.clipboard.writeText(url);
      if (status) status.textContent = 'Hikâye bağlantısı kopyalandı.';
    } catch (error) {
      if (error.name === 'AbortError') return;
      if (status) status.textContent = 'Bağlantıyı adres çubuğundan kopyalayabilirsiniz: ' + url;
    }
  });
});
