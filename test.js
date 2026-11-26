/* Kendini Test Et: soru seçimi, süre, puanlama ve skor tablosu */
(function () {
  "use strict";
  var VERI = JSON.parse(document.getElementById("veri").textContent);
  var SORU_SAYISI = 20, SURE = 30000, TAM_PRIM = 3000, TABAN = 100, PRIM = 100, EN_ERKEN = 500;
  var API = "/api/skor", ANAHTAR = "kendini-test-et:v1";
  var $ = function (id) { return document.getElementById(id); };

  /* ── Yerel kayıt (yalnızca bu tarayıcı) ── */
  function oku() { try { return JSON.parse(localStorage.getItem(ANAHTAR) || "{}") || {}; } catch (e) { return {}; } }
  function yaz() { try { localStorage.setItem(ANAHTAR, JSON.stringify(durum)); } catch (e) { /* özel pencere */ } }
  var durum = oku();
  if (!Array.isArray(durum.gorulen)) durum.gorulen = [];
  if (typeof durum.rekor !== "number") durum.rekor = 0;
  if (typeof durum.rumuz !== "string") durum.rumuz = "";

  /* ── Rastgelelik ── */
  function rastgele(n) {
    if (window.crypto && crypto.getRandomValues) {
      var a = new Uint32Array(1), sinir = Math.floor(4294967296 / n) * n;
      do { crypto.getRandomValues(a); } while (a[0] >= sinir);
      return a[0] % n;
    }
    return Math.floor(Math.random() * n);
  }
  function karistir(d) {
    var a = d.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = rastgele(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* Her alandan belirlenen sayıda soru; önce bu tarayıcıda görülmemiş olanlar. */
  function testKur() {
    var gorulen = {}, secilen = [];
    durum.gorulen.forEach(function (i) { gorulen[i] = 1; });
    VERI.kat.forEach(function (_, k) {
      var hepsi = VERI.soru.filter(function (q) { return q.k === k; });
      var yeni = hepsi.filter(function (q) { return !gorulen[q.i]; });
      var gerek = VERI.dag[k];
      if (yeni.length < gerek) {            // alan tükendi: o alanın geçmişini sıfırla
        var kalan = yeni.map(function (q) { return q.i; });
        hepsi.forEach(function (q) { delete gorulen[q.i]; });
        var ek = karistir(hepsi.filter(function (q) { return kalan.indexOf(q.i) < 0; })).slice(0, gerek - yeni.length);
        secilen = secilen.concat(yeni, ek);
      } else {
        secilen = secilen.concat(karistir(yeni).slice(0, gerek));
      }
    });
    secilen.forEach(function (q) { gorulen[q.i] = 1; });
    durum.gorulen = Object.keys(gorulen);
    yaz();
    return karistir(secilen).map(function (q) {
      return { q: q, sira: karistir([0, 1, 2, 3]) };   // sira: ekrandaki konum → özgün seçenek no (0 = doğru)
    });
  }

  /* İki ya da üç cümleli kökü bağlam + soru olarak ayırır: soru cümlesi tek başına okunur. */
  function kokBol(s) {
    var n = Math.max(s.lastIndexOf(". "), s.lastIndexOf(": "));
    if (n < 12 || s.length - n < 14) return ["", s];
    return [s.slice(0, n + 1), s.slice(n + 2)];
  }
  function primHesap(ms) {
    if (ms <= TAM_PRIM) return PRIM;
    return Math.max(0, Math.round(PRIM * (1 - (ms - TAM_PRIM) / (SURE - TAM_PRIM))));
  }
  function sureYaz(ms) {
    var s = Math.round(ms / 1000), d = Math.floor(s / 60);
    return d ? d + " dk " + (s % 60) + " sn" : s + " sn";
  }
  function sayi(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function el(ad, sinif, metin) {
    var e = document.createElement(ad);
    if (sinif) e.className = sinif;
    if (metin != null) e.textContent = metin;
    return e;
  }

  /* ── Ekranlar ── */
  var EKRAN = ["giris", "oyun", "sonuc"];
  function goster(ad) {
    EKRAN.forEach(function (e) { $(e).hidden = e !== ad; });
    window.scrollTo(0, 0);
  }

  /* ── Oyun ── */
  var test = null, no = 0, puan = 0, yanitlar = [], t0 = 0, sayacNo = 0, kilit = true, gonderildi = false;
  var HARF = "ABCD";

  function basla() {
    test = testKur(); no = 0; puan = 0; yanitlar = []; gonderildi = false;
    $("puan").textContent = "0";
    goster("oyun");
    soruGoster();
  }

  function soruGoster() {
    var m = test[no], q = m.q;
    $("sira").textContent = "Soru " + (no + 1) + " / " + SORU_SAYISI;
    $("kat").textContent = VERI.kat[q.k];
    var parca = kokBol(q.s);
    $("baglam").textContent = parca[0];
    $("baglam").hidden = !parca[0];
    $("soru").textContent = parca[1];
    $("etiket").textContent = q.e || "";
    $("etiket").hidden = !q.e;
    var kutu = $("secenekler");
    kutu.textContent = "";
    m.sira.forEach(function (oz, konum) {
      var b = el("button", "secenek");
      b.type = "button";
      b.dataset.konum = konum;
      b.appendChild(el("span", "harf", HARF[konum]));
      b.appendChild(el("span", "metin", q.c[oz]));
      b.addEventListener("click", function () { yanitla(konum); });
      kutu.appendChild(b);
    });
    $("geri-bildirim").hidden = true;
    $("sayac-cubuk").parentNode.classList.remove("az", "durdu");
    kilit = false;
    t0 = performance.now();
    sayacCiz();
    $("soru").focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function sayacCiz() {
    cancelAnimationFrame(sayacNo);
    (function adim() {
      if (kilit) return;
      var gecen = performance.now() - t0, kalan = Math.max(0, SURE - gecen);
      $("sayac-cubuk").style.transform = "scaleX(" + (kalan / SURE) + ")";
      $("sayac-yazi").textContent = Math.ceil(kalan / 1000);
      $("sayac-cubuk").parentNode.classList.toggle("az", kalan <= 10000);
      if (kalan <= 0) { yanitla(-1); return; }
      sayacNo = requestAnimationFrame(adim);
    })();
  }
  /* Sekme arka plandayken requestAnimationFrame durur; süre yine de işler. */
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && !kilit && test) sayacCiz();
  });
  setInterval(function () {
    if (!kilit && test && performance.now() - t0 >= SURE) yanitla(-1);
  }, 500);

  function yanitla(konum) {
    if (kilit) return;
    var gecen = performance.now() - t0;
    if (gecen >= SURE) konum = -1;
    if (konum >= 0 && gecen < EN_ERKEN) return;   // yanlışlıkla çift dokunmayı yok say
    kilit = true;
    cancelAnimationFrame(sayacNo);
    var m = test[no], q = m.q;
    var ms = Math.min(SURE, Math.round(gecen));
    var oz = konum < 0 ? -1 : m.sira[konum];
    if (konum < 0) ms = SURE;
    var dogru = oz === 0, kazanc = dogru ? TABAN + primHesap(ms) : 0;
    puan += kazanc;
    yanitlar.push({ i: q.i, s: oz, ms: ms, kazanc: kazanc });
    $("puan").textContent = sayi(puan);
    $("sayac-cubuk").parentNode.classList.add("durdu");

    var dugmeler = $("secenekler").querySelectorAll("button");
    Array.prototype.forEach.call(dugmeler, function (b, k) {
      b.disabled = true;
      if (m.sira[k] === 0) b.classList.add("dogru");
      else if (k === konum) b.classList.add("yanlis");
      else b.classList.add("sonuk");
    });
    var h = $("hukum");
    h.className = "hukum " + (dogru ? "iyi" : "kotu");
    h.textContent = dogru
      ? "Doğru. +" + kazanc + " puan (" + TABAN + " taban, " + (kazanc - TABAN) + " hız primi; " + (ms / 1000).toFixed(1).replace(".", ",") + " sn)"
      : (konum < 0 ? "Süre doldu." : "Yanlış.") + " Doğru yanıt: " + q.c[0];
    $("aciklama").textContent = q.a;
    kaynakYaz($("kaynak"), q);
    $("sonraki").textContent = no + 1 < SORU_SAYISI ? "Sonraki soru" : "Sonucu gör";
    $("geri-bildirim").hidden = false;
    $("sonraki").focus({ preventScroll: true });
    $("geri-bildirim").scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function kaynakYaz(kutu, q) {
    kutu.textContent = "";
    var ac = el("details"), ozet = el("summary", "kaynak-ad", q.r.length > 1 ? "Kaynaklar" : "Kaynak");
    ac.appendChild(ozet);
    kutu.appendChild(ac);
    kutu = ac;
    q.r.forEach(function (ri) {
      var r = VERI.kaynak[ri], p = el("p", null, r.m + " ");
      var adres = r.d ? "https://doi.org/" + r.d : (r.p ? "https://pubmed.ncbi.nlm.nih.gov/" + r.p + "/" : "");
      if (adres) {
        var a = el("a", null, r.d ? "doi:" + r.d : "PubMed " + r.p);
        a.href = adres; a.target = "_blank"; a.rel = "noopener";
        p.appendChild(a);
      }
      kutu.appendChild(p);
    });
  }

  function sonraki() {
    if (!kilit || !test) return;
    no++;
    if (no < SORU_SAYISI) soruGoster(); else bitir();
  }

  /* ── Sonuç ── */
  function bitir() {
    var dogru = yanitlar.filter(function (y) { return y.s === 0; }).length;
    var sure = yanitlar.reduce(function (t, y) { return t + y.ms; }, 0);
    var yeniRekor = puan > durum.rekor;
    if (yeniRekor) { durum.rekor = puan; }
    durum.son = { puan: puan, dogru: dogru, sure: sure, t: Date.now() };
    yaz();
    $("sonuc-b").textContent = sayi(puan) + " puan";
    var ozet = $("ozet");
    ozet.textContent = "";
    [[dogru + " / " + SORU_SAYISI, "doğru yanıt"], [sureYaz(sure), "toplam yanıt süresi"],
     [(sure / SORU_SAYISI / 1000).toFixed(1).replace(".", ",") + " sn", "soru başına ortalama"],
     [sayi(durum.rekor), yeniRekor ? "bu cihazda yeni rekor" : "bu cihazdaki en iyi puan"]].forEach(function (c) {
      var li = el("li");
      li.appendChild(el("b", null, c[0]));
      li.appendChild(el("span", null, c[1]));
      ozet.appendChild(li);
    });
    var dokum = $("dokum");
    dokum.textContent = "";
    test.forEach(function (m, k) {
      var y = yanitlar[k], q = m.q, li = el("li", y.s === 0 ? "iyi" : "kotu");
      li.appendChild(el("p", "d-soru", q.s));
      li.appendChild(el("p", "d-yanit", y.s === 0
        ? "Doğru: " + q.c[0] + " (+" + y.kazanc + ")"
        : (y.s < 0 ? "Süre doldu" : "Yanıtınız: " + q.c[y.s]) + " · Doğru yanıt: " + q.c[0]));
      li.appendChild(el("p", "d-acik", q.a));
      var k2 = el("div", "kaynak");
      kaynakYaz(k2, q);
      li.appendChild(k2);
      dokum.appendChild(li);
    });
    $("rumuz").value = durum.rumuz || "";
    $("gonder-durum").textContent = "";
    $("gonder-durum").className = "gonder-durum";
    $("gonder-dugme").disabled = false;
    $("rumuz").disabled = false;
    goster("sonuc");
    $("sonuc-b").focus({ preventScroll: true });
  }

  /* ── Skor tablosu ── */
  var tablolar = null, secili = "ay", benim = "";
  function tabloCiz() {
    var kutu = $("tablo");
    kutu.textContent = "";
    if (!tablolar) { kutu.appendChild(el("p", "soluk", "Skor tablosuna şu anda ulaşılamıyor. Testi yine de çözebilirsiniz; puanınız bu cihazda saklanır.")); return; }
    var liste = tablolar[secili] || [];
    if (!liste.length) { kutu.appendChild(el("p", "soluk", secili === "ay" ? "Bu ay henüz skor yok. İlk sırayı siz alın." : "Henüz skor yok.")); return; }
    var t = el("table"), bas = el("thead"), tr = el("tr");
    ["#", "Rumuz", "Puan", "Doğru", "Süre"].forEach(function (b, k) {
      var th = el("th", k > 1 ? "sag" : null, b); th.scope = "col"; tr.appendChild(th);
    });
    bas.appendChild(tr); t.appendChild(bas);
    var govde = el("tbody");
    liste.forEach(function (s, k) {
      var r = el("tr", benim && s.ad.toLocaleLowerCase("tr") === benim.toLocaleLowerCase("tr") ? "ben" : null);
      r.appendChild(el("td", "no", k + 1));
      r.appendChild(el("td", "ad", s.ad));
      r.appendChild(el("td", "sag puan", sayi(s.puan)));
      r.appendChild(el("td", "sag", s.dogru + "/" + SORU_SAYISI));
      r.appendChild(el("td", "sag", sureYaz(s.sure)));
      govde.appendChild(r);
    });
    t.appendChild(govde);
    kutu.appendChild(t);
  }
  function tabloAl() {
    return fetch(API, { headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { tablolar = { ay: j.ay || [], tum: j.tum || [] }; })
      .catch(function () { tablolar = null; })
      .then(tabloCiz);
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-tablo]"), function (b) {
    b.addEventListener("click", function () {
      secili = b.dataset.tablo;
      Array.prototype.forEach.call(document.querySelectorAll("[data-tablo]"), function (x) {
        x.setAttribute("aria-pressed", x === b ? "true" : "false");
      });
      tabloCiz();
    });
  });

  var HATA = {
    ad: "Bu rumuz kabul edilmedi. 2–20 karakter; harf, rakam, boşluk, nokta, tire ve alt çizgi kullanılabilir.",
    hiz: "Yanıt süreleri olağan dışı bulundu; skor kaydedilmedi.",
    veri: "Skor verisi okunamadı; skor kaydedilmedi.",
    cok: "Çok sık istek gönderildi. Bir dakika sonra yeniden deneyin."
  };
  $("gonder").addEventListener("submit", function (e) {
    e.preventDefault();
    if (gonderildi || !test || yanitlar.length !== SORU_SAYISI) return;
    var ad = $("rumuz").value.replace(/\s+/g, " ").trim(), d = $("gonder-durum");
    if (ad.length < 2) { d.className = "gonder-durum kotu"; d.textContent = HATA.ad; return; }
    $("gonder-dugme").disabled = true;
    d.className = "gonder-durum"; d.textContent = "Gönderiliyor…";
    fetch(API, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ad: ad, yanitlar: yanitlar.map(function (y) { return { i: y.i, s: y.s, ms: y.ms }; }) })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, kod: r.status, j: j }; });
    }).then(function (s) {
      if (!s.ok) {
        d.className = "gonder-durum kotu";
        d.textContent = s.kod === 429 ? HATA.cok : (HATA[s.j.hata] || "Skor kaydedilemedi. Daha sonra yeniden deneyin.");
        $("gonder-dugme").disabled = false;
        return;
      }
      gonderildi = true; benim = s.j.ad || ad; durum.rumuz = benim; yaz();
      tablolar = { ay: s.j.ay || [], tum: s.j.tum || [] };
      $("rumuz").disabled = true;
      d.className = "gonder-durum iyi";
      d.textContent = "Kaydedildi. Bu ay " + (s.j.sira && s.j.sira.ay ? s.j.sira.ay + ". sıradasınız" : "ilk 100'ün dışındasınız") +
        (s.j.sira && s.j.sira.tum ? "; tüm zamanlarda " + s.j.sira.tum + ". sıra." : ".") +
        (s.j.eski ? " Aynı rumuzla daha yüksek bir puanınız olduğu için tabloda o puan duruyor." : "");
      tabloCiz();
    }).catch(function () {
      d.className = "gonder-durum kotu";
      d.textContent = "Skor tablosuna ulaşılamadı. Bağlantınızı denetleyip yeniden deneyin.";
      $("gonder-dugme").disabled = false;
    });
  });

  /* ── Olaylar ── */
  $("basla").addEventListener("click", basla);
  $("yeniden").addEventListener("click", basla);
  $("sonraki").addEventListener("click", sonraki);
  $("eve").addEventListener("click", function () { test = null; rekorYaz(); goster("giris"); tabloAl(); });
  document.addEventListener("keydown", function (e) {
    if ($("oyun").hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key.toLowerCase();
    if (!kilit) {
      var n = "1234".indexOf(k);
      if (n < 0) n = "abcd".indexOf(k);
      if (n >= 0 && k.length === 1) { e.preventDefault(); yanitla(n); }
    } else if (k === "enter" && document.activeElement !== $("sonraki")) {
      e.preventDefault(); sonraki();
    }
  });
  window.addEventListener("beforeunload", function (e) {
    if (test && !$("oyun").hidden) { e.preventDefault(); e.returnValue = ""; }
  });

  function rekorYaz() {
    var r = $("rekor");
    if (durum.rekor > 0) { r.hidden = false; r.textContent = "Bu cihazdaki en iyi puanınız: " + sayi(durum.rekor); }
  }
  rekorYaz();
  tabloAl();
})();
