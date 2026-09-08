# ALCOM — კომპანიის საიტი

სტატიკური საიტი (HTML/CSS/JS), CMS-ის გარეშე. ჰოსტინგისთვის საკმარისია GitHub Pages.

## სტრუქტურა

```
index.html        მთავარი
products.html     ყველა პროდუქტი
product.html      ერთი პროდუქტი (product.html?p=pergola)
about.html        ჩვენ შესახებ
projects.html     მიმდინარე / დასრულებული პროექტები
video.html        ვიდეო გალერეა
contact.html      კონტაქტი + ფორმა + რუკა
assets/css/style.css
assets/js/products.js   ← პროდუქტების სია და ტექსტები (რედაქტირება აქ)
assets/js/main.js       ← მენიუ, footer, პროდუქტების გამოტანა
assets/img/             ← სურათები
```

## რა უნდა ჩასვათ

| ფაილი | რა არის |
|---|---|
| `assets/img/logo.png` | ლოგო (~48px სიმაღლე). სანამ არ არის, ტექსტური "ALCOM" ჩანს |
| `assets/img/favicon.png` | ბრაუზერის ხატულა |
| `assets/img/about.jpg` | ფოტო "ჩვენ შესახებ" ბლოკისთვის |
| `assets/img/products/<slug>.jpg` | პროდუქტის ფოტო, მაგ. `pergola.jpg` (slug-ები `products.js`-შია) |
| `assets/img/projects/current-1.jpg` ... | პროექტების ფოტოები |

სურათი რომ არ იყოს, ავტომატურად ნაცრისფერი ჩარჩო გამოჩნდება — საიტი არ იშლება.

- **პროდუქტის ტექსტის შეცვლა / დამატება:** `assets/js/products.js`
- **ვიდეო:** `video.html`-ში `VIDEO_ID` შეცვალეთ YouTube-ის ID-ით
- **ტელეფონი/მისამართი:** `assets/js/main.js` ზედა `SITE` ობიექტში და `contact.html`-ში
- **ფორმა:** ამჟამად mailto-ს ხსნის. სერვერული გაგზავნისთვის ჩართეთ [Formspree](https://formspree.io) — `<form action="https://formspree.io/f/XXXX" method="POST">`

## GitHub-ზე ატვირთვა

1. GitHub-ზე შექმენით ახალი რეპოზიტორია, მაგ. `alcom-site` (ცარიელი, README-ს გარეშე).
2. ტერმინალში ამ საქაღალდეში:

```bash
git init
git add .
git commit -m "ALCOM საიტი"
git branch -M main
git remote add origin https://github.com/<თქვენი-username>/alcom-site.git
git push -u origin main
```

## GitHub Pages-ზე გაშვება

რეპოზიტორია → **Settings → Pages → Source: Deploy from a branch → main / (root) → Save**.
რამდენიმე წუთში საიტი იქნება `https://<username>.github.io/alcom-site/`.

საკუთარი დომენისთვის (alcom.ge): Pages-ის პარამეტრებში ჩაწერეთ **Custom domain**, ხოლო DNS-ში დაამატეთ CNAME `www → <username>.github.io` და A ჩანაწერები GitHub-ის IP-ებზე (185.199.108.153, .109.153, .110.153, .111.153).
