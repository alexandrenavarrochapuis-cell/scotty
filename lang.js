const gtDiv = document.createElement('div');
gtDiv.id = 'google_translate_element';
gtDiv.style.display = 'none';
document.body.appendChild(gtDiv);

window.googleTranslateElementInit = function() {
  new google.translate.TranslateElement({
    pageLanguage: 'en',
    includedLanguages: 'es,ja,fr,en',
    autoDisplay: false
  }, 'google_translate_element');
};

const gtScript = document.createElement('script');
gtScript.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
document.head.appendChild(gtScript);

const style = document.createElement('style');
style.textContent = `
  body { top: 0 !important; }
  .goog-te-banner-frame { display: none !important; }
  .skiptranslate { display: none !important; }
  #goog-gt-tt { display: none !important; }
  .goog-text-highlight { background-color: transparent !important; box-shadow: none !important; }
`;
document.head.appendChild(style);

document.addEventListener("DOMContentLoaded", () => {
  let currentLang = 'en';
  const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/);
  if (match) {
    currentLang = match[1];
  }
  
  const langBtns = document.querySelectorAll(".lang-btn");
  langBtns.forEach(btn => {
    if (btn.getAttribute("data-lang") === currentLang) {
      document.querySelector(".lang-btn.active")?.classList.remove("active");
      btn.classList.add("active");
    }
    
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector(".lang-btn.active")?.classList.remove("active");
      btn.classList.add("active");
      
      const lang = btn.getAttribute("data-lang");
      
      if (lang === 'en') {
        const domain = window.location.hostname;
        document.cookie = 'googtrans=/en/en; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        if (domain) {
           document.cookie = 'googtrans=/en/en; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=' + domain + '; path=/;';
        }
        window.location.reload();
        return;
      }

      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        combo.value = lang;
        combo.dispatchEvent(new Event('change'));
      } else {
        document.cookie = `googtrans=/en/${lang}; path=/;`;
        window.location.reload();
      }
    });
  });
});
