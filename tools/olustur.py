# -*- coding: utf-8 -*-
"""Kendini Test Et: index.html üretici.
Kullanım: python3 tools/olustur.py   (çıktı: depo kökünde index.html)"""
import html, json, re, sys
from collections import Counter
from pathlib import Path

A = Path(__file__).resolve().parent
KOK = A.parent
sys.path.insert(0, str(A))
import sorular_a, sorular_b, sorular_c, sorular_d, sorular_e, sorular_f, sorular_g, sorular_h, sorular_i, sorular_j, sorular_k, sorular_l, sorular_m, sorular_n
from secenek_duzelt import DUZELT, DOGRU, SORU

S = (sorular_a.SORULAR_A + sorular_b.SORULAR_B + sorular_c.SORULAR_C + sorular_d.SORULAR_D
     + sorular_e.SORULAR_E + sorular_f.SORULAR_F + sorular_g.SORULAR_G + sorular_h.SORULAR_H + sorular_i.SORULAR_I + sorular_j.SORULAR_J + sorular_k.SORULAR_K + sorular_l.SORULAR_L + sorular_m.SORULAR_M + sorular_n.SORULAR_N)
KAYNAK = json.loads((A / "kaynaklar.json").read_text(encoding="utf-8"))
ADRES = "https://miracbarisusta.com/kendini-test-et/"
TEST_SORU = 20
# Bir testte her kategoriden kaç soru gelir (toplam 20).
DAGILIM = {sorular_a.GE: 2, sorular_a.DG: 3, sorular_a.NG: 3, sorular_a.DD: 2, sorular_a.KT: 2,
           sorular_a.PS: 3, sorular_a.FA: 1, sorular_a.BI: 3, sorular_a.KU: 1}
assert sum(DAGILIM.values()) == TEST_SORU

ONEKLER = [("DSM-5-TR'ye göre ", "DSM-5-TR"), ("Rutter'a göre ", "Rutter"), ("IACAPAP'a göre ", "IACAPAP"), ("ICD-11'e göre ", "ICD-11")]
TUR_ETIKET = {"r": "Rutter", "i": "IACAPAP", "g": "Gabbard", "l": "Lewis"}
OZEL_ETIKET = {"x:dsm5tr": "DSM-5-TR", "x:maudsley15": "Maudsley"}
kats = list(DAGILIM)
say = Counter(q[1] for q in S)
ref_sira, refs, veri = {}, [], []
kimlikler = set()
for kid, kat, soru, sec, acik, kay in S:
    soru = SORU.get(kid, soru)
    # Kaynak adını sorunun başından alıp etikete taşı: kök kısalır, çerçeve yine görünür.
    etiket = ""
    for on, ad in ONEKLER:
        if soru.startswith(on):
            kalan = soru[len(on):]
            soru = {"i": "İ", "ı": "I"}.get(kalan[0], kalan[0].upper()) + kalan[1:]
            etiket = ad
            break
    if not etiket:
        etiket = TUR_ETIKET.get(kay[0].split(":")[0], "") or OZEL_ETIKET.get(kay[0], "")
    sec = DUZELT.get(kid, sec)
    if kid in DOGRU:
        sec = [DOGRU[kid]] + list(sec[1:])
    assert re.fullmatch(r"q\d{3,4}", kid) and kid not in kimlikler, kid
    kimlikler.add(kid)
    assert kat in DAGILIM and len(sec) == 4 and len(set(sec)) == 4, kid
    assert soru.endswith("?") and acik and kay, kid
    for t in [soru, acik] + sec:
        assert "—" not in t and "  " not in t, (kid, t)
    idx = []
    for k in kay:
        if k not in ref_sira:
            r = KAYNAK[k]
            metin, pmid = r["metin"], r.get("pmid", "")
            m = re.search(r"\s*PMID:\s*(\d+)\s*$", metin)
            if m:
                pmid, metin = m.group(1), metin[:m.start()]
            ref_sira[k] = len(refs)
            refs.append({"m": metin.replace("–", "-"), **({"d": r["doi"]} if r.get("doi") else {}),
                         **({"p": pmid} if pmid and not r.get("doi") else {})})
        idx.append(ref_sira[k])
    veri.append({"i": kid, "k": kats.index(kat), "s": soru, "c": sec, "a": acik, "r": idx, **({"e": etiket} if etiket else {})})
for kat, n in DAGILIM.items():
    assert say[kat] >= 3 * n, (kat, say[kat])   # art arda üç testte yinelenmeyecek kadar soru

paket = {"kat": kats, "dag": [DAGILIM[k] for k in kats], "soru": veri, "kaynak": refs}
veri_json = json.dumps(paket, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")

N = len(veri)
AD = "Kendini Test Et"
DESC = (f"Çocuk ve ergen psikiyatrisi ağırlıklı bilgi yarışı: {N} soruluk havuzdan her seferinde rastgele 20 soru, "
        "doğruluk ve hıza göre puan, yanıttan sonra açıklama ve kaynak, herkese açık skor tablosu.")
e = html.escape

kat_li = "".join(f"<li><span>{e(k)}</span><b>{say[k]}</b></li>" for k in kats)
sayfa = f"""<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{AD} · Çocuk psikiyatrisi bilgi yarışı · Doç. Dr. Miraç Barış Usta</title>
<meta name="description" content="{e(DESC)}">
<meta name="author" content="Miraç Barış Usta">
<meta name="theme-color" content="#fbf7f0">
<meta property="og:title" content="{AD}: çocuk psikiyatrisi bilgi yarışı">
<meta property="og:description" content="{e(DESC)}">
<meta property="og:type" content="website">
<meta property="og:url" content="{ADRES}">
<link rel="canonical" href="{ADRES}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Lora:ital,wght@0,600;0,700;1,500&amp;display=swap">
<link rel="stylesheet" href="test.css">
<script src="test.js" defer></script>
</head>
<body>
<a class="atla" href="#icerik">İçeriğe geç</a>
<header class="ust">
  <a class="geri" href="https://miracbarisusta.com/rehberler/"><span aria-hidden="true">←</span> Rehberler</a>
  <a class="marka" href="./">{AD}</a>
</header>
<main id="icerik">

<section id="giris" class="ekran">
  <p class="ust-yazi">Çocuk ve ergen psikiyatrisi · bilgi yarışı</p>
  <h1>20 soru. Hem doğru, hem hızlı.</h1>
  <p class="spot">{N} soruluk havuzdan her seferinde farklı 20 soru gelir. Her yanıttan sonra doğru seçeneği,
  kısa açıklamayı ve kaynağı görürsünüz.</p>
  <ul class="kural">
    <li><b>100</b><span>her doğru yanıt için taban puan</span></li>
    <li><b>+100</b><span>hız primi: ilk 3 saniyede tam, sonra saniye saniye azalır</span></li>
    <li><b>30 sn</b><span>soru başına süre; süre dolunca soru boş geçer</span></li>
    <li><b>4.000</b><span>bir testte alınabilecek en yüksek puan</span></li>
  </ul>
  <p class="eylem"><button type="button" class="ana" id="basla">Teste başla</button>
  <span class="ipucu">Klavye: seçenekler için 1–4 ya da A–D, ilerlemek için Enter.</span></p>
  <p class="rekor" id="rekor" hidden></p>

  <section class="tablo-kutu" aria-labelledby="tablo-b">
    <div class="tablo-ust">
      <h2 id="tablo-b">Skor tablosu</h2>
      <div class="sekme" role="group" aria-label="Skor tablosu dönemi">
        <button type="button" data-tablo="ay" aria-pressed="true">Bu ay</button>
        <button type="button" data-tablo="tum" aria-pressed="false">Tüm zamanlar</button>
      </div>
    </div>
    <div id="tablo" class="tablo" aria-live="polite"><p class="soluk">Skor tablosu yükleniyor…</p></div>
    <p class="soluk kucuk">Sıralama puana, eşitlikte toplam süreye göre yapılır. Aynı rumuzun en iyi sonucu görünür.</p>
  </section>

  <details class="havuz">
    <summary>Soru havuzu: {N} soru, {len(kats)} alan</summary>
    <ul class="kat-liste">{kat_li}</ul>
    <p class="kucuk">Her testte alanlardan belirli sayıda soru çekilir; daha önce gördüğünüz sorular, havuz tükenene dek yeniden gelmez.</p>
  </details>
</section>

<section id="oyun" class="ekran" hidden>
  <div class="durum">
    <span id="sira" class="sira"></span>
    <span id="kat" class="kat"></span>
    <span id="etiket" class="etiket" hidden></span>
    <span class="puan-kutu">Puan <b id="puan">0</b></span>
  </div>
  <div class="sayac" role="timer" aria-label="Kalan süre"><i id="sayac-cubuk"></i><span id="sayac-yazi">30</span></div>
  <p id="baglam" class="baglam" hidden></p>
  <h2 id="soru" tabindex="-1"></h2>
  <div id="secenekler" class="secenekler"></div>
  <div id="geri-bildirim" class="geri-bildirim" aria-live="polite" hidden>
    <p id="hukum" class="hukum"></p>
    <p id="aciklama"></p>
    <div id="kaynak" class="kaynak"></div>
    <p class="eylem"><button type="button" class="ana" id="sonraki">Sonraki soru</button></p>
  </div>
</section>

<section id="sonuc" class="ekran" hidden>
  <p class="ust-yazi">Test bitti</p>
  <h1 id="sonuc-b" tabindex="-1"></h1>
  <ul class="ozet" id="ozet"></ul>
  <form id="gonder" class="gonder" autocomplete="off">
    <label for="rumuz">Skor tablosu için rumuz</label>
    <div class="gonder-satir">
      <input id="rumuz" name="rumuz" type="text" minlength="2" maxlength="20" required placeholder="2–20 karakter" autocapitalize="words" spellcheck="false">
      <button type="submit" class="ana" id="gonder-dugme">Skoru gönder</button>
    </div>
    <p class="kucuk soluk">Rumuzunuz, puanınız, doğru sayınız ve süreniz herkese açık tabloda görünür. Gerçek adınızı yazmanız gerekmez; başka bir bilgi kaydedilmez.</p>
    <p id="gonder-durum" class="gonder-durum" role="status"></p>
  </form>
  <p class="eylem"><button type="button" class="ana ikincil" id="yeniden">Yeni test</button>
  <button type="button" class="duz" id="eve">Skor tablosuna dön</button></p>
  <h2>Sorular ve açıklamalar</h2>
  <ol id="dokum" class="dokum"></ol>
</section>

</main>
<footer class="alt">
  <p><strong>Hazırlayan:</strong> Doç. Dr. Miraç Barış Usta · Kasım 2026 · <a href="https://miracbarisusta.com">miracbarisusta.com</a></p>
  <p>Sorular DSM-5-TR’ye, Rutter’s Child and Adolescent Psychiatry and Psychology’ye (7. baskı), Lewis’s Child and Adolescent Psychiatry’ye (6. baskı), IACAPAP e-Textbook’a, Gabbard’ın Psychodynamic Psychiatry in Clinical Practice kitabına (5. baskı), Maudsley Prescribing Guidelines’a (15. baskı), kuramcıların özgün yapıtlarına ve araştırma makalelerine dayanır; her sorunun kaynağı
  yanıttan sonra gösterilir. Sitedeki <a href="https://miracbarisusta.com/cocuk-psikiyatrisi-sanati/">Çocuk Psikiyatrisinin Sanatı</a>
  ve <a href="https://miracbarisusta.com/davranisin-biyolojisi/">Davranışın Biyolojisi</a> rehberleriyle birlikte çalışılabilir.</p>
  <p>Eğitim amaçlıdır; bilgiler Kasım 2026 itibarıyladır. Klinik karar yerine geçmez. Skor tablosu eğlence amaçlıdır;
  puanlar tarayıcıda hesaplandığı için bir sınav ya da yeterlik ölçümü sayılmaz.</p>
</footer>
<script type="application/json" id="veri">{veri_json}</script>
</body>
</html>
"""
(KOK / "index.html").write_text(sayfa, encoding="utf-8")
print(f"{N} soru, {len(refs)} kaynak, {len(kats)} alan; index.html {len(sayfa.encode('utf-8'))//1024} KB")
print("Alan dağılımı:", ", ".join(f"{k}: {say[k]}" for k in kats))
