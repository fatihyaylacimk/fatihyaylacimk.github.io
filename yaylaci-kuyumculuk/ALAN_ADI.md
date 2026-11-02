# Yaylacı Kuyumculuk için özel alan adı

Şu an çalışan adres: `https://fatihyaylacimk.github.io/yaylaci-kuyumculuk/`

`yaylacikuyumculuk.com` gibi bir adres, önce bir alan adı kayıt firmasından satın alınıp size ait olmalıdır. Bu örnek adresin boşta veya size ait olduğu varsayılmıyor.

## Neden mevcut depoya doğrudan CNAME eklenmedi?

Bu site, `fatihyaylacimk.github.io` adlı **kullanıcı sitesi deposunun** `yaylaci-kuyumculuk/` alt klasöründe duruyor. GitHub Pages'te bu deponun özel alan adı ayarı tüm kullanıcı sitesinin kök adresini etkiler. Dolayısıyla kök depoya bir `CNAME` eklemek, kuyumculuk sitesini tek başına alan adının ana sayfasına taşımaz; kişisel sitenin adresini de değiştirir.

## Bağlama planı

1. Kullanılacak alan adını satın alın veya zaten sahip olduğunuz adı belirleyin.
2. Kuyumculuk dosyalarını tek başına yayımlayan ayrı bir GitHub deposu hazırlayın. Bu depoda `index.html`, `assets/`, `koleksiyon/`, CSS ve JavaScript dosyaları yayın kökünde olacak.
3. Yeni deponun **Settings → Pages → Custom domain** alanına sahip olduğunuz alan adını yazın. GitHub'ın önerdiği alan adı doğrulamasını yapın.
4. Alan adını aldığınız firmanın DNS panelinde, seçilen `www` alt alan adı için GitHub'ın tarif ettiği `CNAME` kaydını; kök alan adını da kullanacaksanız ilgili `A`/`ALIAS` kayıtlarını ekleyin. Değerleri kurulum gününde GitHub'ın güncel belgelerine göre kontrol edin.
5. GitHub Pages'te **Enforce HTTPS** kullanılabilir olduğunda açın. DNS yayılımını ve hem `www` hem kök adresin doğru sayfaya gittiğini kontrol edin.
6. Taşıma sırasında bu sayfalardaki canonical ve sosyal paylaşım adreslerini yeni alan adına güncelleyin. Eski `github.io` adresinin yönlendirme davranışını ayrıca doğrulayın.

Alan adını satın alma ve DNS paneline erişim olmadan bu işlemi tamamlamak mümkün değildir. Mevcut GitHub Pages bağlantısı çalışmaya devam eder.

Resmî GitHub belgeleri:
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
