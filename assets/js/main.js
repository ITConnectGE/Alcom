(function () {
  const SITE = {
    name: "ALCOM",
    phone: "(+995 032) 2 11 00 72",
    mobile: "(+995) 599 19 83 82",
    email: "info@alcom.ge",
    address: "პეტრე სარაჯიშვილის ქუჩა 13, თბილისი Tbilisi, Georgia",
    facebook: "https://www.facebook.com/alcomi.ge",
    logo: "https://cdn.gweb.ge/buffer/1003953/pictures/logo/1f36010c4df95ab44417912311fdde6b.png"
  };

  const NAV = [
    { href: "index.html", label: "მთავარი" },
    { href: "products.html", label: "პროდუქტები", children: true },
    { href: "about.html", label: "ჩვენს შესახებ" },
    { href: "projects.html", label: "პროექტები" },
    { href: "video.html", label: "ვიდეო გალერეა" },
    { href: "contact.html", label: "კონტაქტი" }
  ];

  const products = window.ALCOM_PRODUCTS || [];
  const page = location.pathname.split("/").pop() || "index.html";

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function imgFor(p) {
    // ცდილობს ჩატვირთოს assets/img/products/<slug>.jpg, წარუმატებლობისას placeholder
    return `<img src="assets/img/products/${p.slug}.jpg" alt="${p.name}" loading="lazy"
      onerror="this.onerror=null;this.src='assets/img/placeholder.svg';this.classList.add('is-placeholder')">`;
  }

  /* ---------- Header ---------- */
  const header = document.getElementById("site-header");
  if (header) {
    const items = NAV.map(n => {
      const active = page === n.href ? ' aria-current="page"' : "";
      if (n.children) {
        const sub = products.map(p => `<li><a href="product.html?p=${p.slug}">${p.name}</a></li>`).join("");
        return `<li class="has-sub"><a href="${n.href}"${active}>${n.label}</a>
          <button class="sub-toggle" aria-label="ქვემენიუს გახსნა" aria-expanded="false"></button>
          <ul class="sub">${sub}</ul></li>`;
      }
      return `<li><a href="${n.href}"${active}>${n.label}</a></li>`;
    }).join("");

    header.replaceWith(el(`
      <header class="site-header">
        <div class="topbar">
          <div class="wrap">
            <a href="tel:${SITE.phone.replace(/[^\d+]/g, "")}">${SITE.phone}</a>
            <a href="mailto:${SITE.email}">${SITE.email}</a>
            <a href="${SITE.facebook}" target="_blank" rel="noopener">Facebook</a>
          </div>
        </div>
        <div class="wrap navbar">
          <a class="brand" href="index.html">
            <img src="assets/img/logo.png" alt="${SITE.name}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'brand-text',textContent:'${SITE.name}'}))">
          </a>
          <button class="nav-toggle" aria-label="მენიუ" aria-expanded="false" aria-controls="main-nav">
            <span></span><span></span><span></span>
          </button>
          <nav id="main-nav" class="nav"><ul>${items}</ul></nav>
        </div>
      </header>`));

    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("main-nav");
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
      document.body.classList.toggle("nav-open", open);
    });
    document.querySelectorAll(".sub-toggle").forEach(b => {
      b.addEventListener("click", () => {
        const li = b.parentElement;
        const open = li.classList.toggle("open");
        b.setAttribute("aria-expanded", open);
      });
    });
  }

  /* ---------- Footer ---------- */
  const footer = document.getElementById("site-footer");
  if (footer) {
    footer.replaceWith(el(`
      <footer class="site-footer">
        <div class="wrap footer-grid">
          <div>
            <p class="footer-brand">${SITE.name}</p>
            <p>შემინვის სისტემები, ალუმინის კარ-ფანჯარა და საფასადე გადაწყვეტები — პროექტირებიდან მონტაჟამდე.</p>
          </div>
          <div>
            <p class="footer-title">კონტაქტი</p>
            <address>
              ${SITE.address}<br>
              <a href="tel:${SITE.phone.replace(/[^\d+]/g, "")}">${SITE.phone}</a><br>
              <a href="tel:${SITE.mobile.replace(/[^\d+]/g, "")}">${SITE.mobile}</a><br>
              <a href="mailto:${SITE.email}">${SITE.email}</a>
            </address>
          </div>
          <div>
            <p class="footer-title">გვერდები</p>
            <ul>${NAV.map(n => `<li><a href="${n.href}">${n.label}</a></li>`).join("")}</ul>
          </div>
        </div>
        <div class="wrap footer-bottom">
          <span>© ${new Date().getFullYear()} ${SITE.name}. ყველა უფლება დაცულია.</span>
          <a href="${SITE.facebook}" target="_blank" rel="noopener">Facebook</a>
        </div>
      </footer>`));
  }

  /* ---------- Product grid (index & products page) ---------- */
  document.querySelectorAll("[data-product-grid]").forEach(grid => {
    const limit = parseInt(grid.dataset.limit || products.length, 10);
    grid.innerHTML = products.slice(0, limit).map(p => `
      <a class="product-card" href="product.html?p=${p.slug}">
        <figure>${imgFor(p)}</figure>
        <h3>${p.name}</h3>
        <p>${p.short}</p>
      </a>`).join("");
  });

  /* ---------- Single product page ---------- */
  const single = document.getElementById("product-page");
  if (single) {
    const slug = new URLSearchParams(location.search).get("p");
    const i = products.findIndex(p => p.slug === slug);
    const p = products[i];
    if (!p) {
      single.innerHTML = `<div class="wrap section"><h1>პროდუქტი ვერ მოიძებნა</h1>
        <p>ეს ბმული აღარ არსებობს ან შეცდომითაა შეყვანილი.</p>
        <p><a class="btn" href="products.html">ყველა პროდუქტის ნახვა</a></p></div>`;
    } else {
      document.title = `${p.name} — ${SITE.name}`;
      const prev = products[(i - 1 + products.length) % products.length];
      const next = products[(i + 1) % products.length];
      single.innerHTML = `
        <div class="wrap section product-single">
          <nav class="crumbs" aria-label="ნავიგაცია"><a href="index.html">მთავარი</a> / <a href="products.html">პროდუქტები</a> / <span>${p.name}</span></nav>
          <div class="product-layout">
            <figure class="product-hero">${imgFor(p)}</figure>
            <div>
              <h1>${p.name}</h1>
              <p class="lead">${p.short}</p>
              <p>${p.body}</p>
              <p><a class="btn" href="contact.html">მოითხოვეთ ფასის შეთავაზება</a></p>
            </div>
          </div>
          <div class="product-nav">
            <a href="product.html?p=${prev.slug}">← ${prev.name}</a>
            <a href="product.html?p=${next.slug}">${next.name} →</a>
          </div>
        </div>`;
    }
  }

  /* ---------- Contact form (mailto fallback; შეცვალეთ Formspree-ით სურვილისამებრ) ---------- */
  const form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const d = new FormData(form);
      const body = `სახელი: ${d.get("name")}\nტელეფონი: ${d.get("phone")}\n\n${d.get("message")}`;
      location.href = `mailto:${SITE.email}?subject=${encodeURIComponent("შეკითხვა საიტიდან")}&body=${encodeURIComponent(body)}`;
      form.querySelector(".form-note").textContent = "იხსნება თქვენი ელ.ფოსტის პროგრამა — გაგზავნეთ წერილი.";
    });
  }
})();
