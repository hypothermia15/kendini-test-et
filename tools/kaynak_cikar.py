# -*- coding: utf-8 -*-
"""Soruların kaynaklarını çözer ve tools/kaynaklar.json dosyasını yazar.
Kullanım: python3 tools/kaynak_cikar.py <davranisin-biyolojisi notları .md> <davranisin-biyolojisi/tools> <sanat kaynaklar.json>
Bu betik yalnızca soru havuzu değiştiğinde çalıştırılır; olustur.py yalnızca kaynaklar.json dosyasını okur."""
import json, re, sys, importlib.util
from pathlib import Path
A = Path(__file__).resolve().parent
sys.path.insert(0, str(A))
import sorular_a, sorular_b, sorular_c, sorular_d, sorular_e, sorular_f, sorular_g, sorular_h, sorular_i, sorular_j, sorular_k, sorular_l, sorular_m, sorular_n
from kaynak_ek import EK, RUTTER, RUTTER_KUNYE, IACAPAP, IACAPAP_KUNYE, GABBARD, GABBARD_KUNYE, LEWIS, LEWIS_KUNYE
S = (sorular_a.SORULAR_A + sorular_b.SORULAR_B + sorular_c.SORULAR_C + sorular_d.SORULAR_D
     + sorular_e.SORULAR_E + sorular_f.SORULAR_F + sorular_g.SORULAR_G + sorular_h.SORULAR_H + sorular_i.SORULAR_I + sorular_j.SORULAR_J + sorular_k.SORULAR_K + sorular_l.SORULAR_L + sorular_m.SORULAR_M + sorular_n.SORULAR_N)

md = Path(sys.argv[1]).read_text(encoding="utf-8")
satirlar = [l[2:].strip() for l in md[md.index("## Kaynakça"):].splitlines() if l.startswith("- ")]
spec = importlib.util.spec_from_file_location("ekler", str(Path(sys.argv[2]) / "ekler.py"))
ek = importlib.util.module_from_spec(spec); sys.path.insert(0, sys.argv[2]); spec.loader.exec_module(ek)
satirlar += [l[2:].strip() for l in ek.EK_KAYNAKLAR]
sanat = json.loads(Path(sys.argv[3]).read_text(encoding="utf-8"))

def db_coz(etiket):
    soyad, yil = etiket.rsplit(" ", 1)
    ad = [l for l in satirlar if l.startswith(soyad + " ") or l.startswith(soyad + ",") or l.startswith(soyad + ".")]
    aday = [l for l in ad if re.search(r"\b%s[;.)]" % yil, l)]
    if len(aday) != 1:
        return None, [l[:110] for l in (aday or ad)]
    l = aday[0]
    m = re.search(r"\[doi:([^\]]+)\]\(https://doi\.org/\S+\)\s*$", l) or re.search(r"\[doi:([^\]]+)\]", l)
    doi = m.group(1) if m else ""
    metin = re.sub(r"\s*\[(doi:[^\]]+|bağlantı|PubMed[^\]]*)\]\(\S+\)\s*$", "", l).strip()
    assert "](" not in metin, metin
    return (metin, doi), None

out, hata = {}, []
for q in S:
    for k in q[5]:
        if k in out: continue
        tur, ad = k.split(":", 1)
        if tur == "r":
            out[k] = {"metin": RUTTER_KUNYE + (" Bölüm %s: %s." % (ad, RUTTER[int(ad)]) if int(ad) in RUTTER else " Bölüm %s." % ad), "doi": ""}
            continue
        if tur == "i":
            out[k] = {"metin": IACAPAP_KUNYE + (" Bölüm %s: %s." % (ad, IACAPAP[ad]) if ad in IACAPAP else " Bölüm %s." % ad), "doi": ""}
            continue
        if tur == "g":
            out[k] = {"metin": GABBARD_KUNYE + (" Bölüm %s: %s." % (ad, GABBARD[int(ad)]) if int(ad) in GABBARD else " Bölüm %s." % ad), "doi": ""}
            continue
        if tur == "l":
            out[k] = {"metin": LEWIS_KUNYE + (" Bölüm %s: %s." % (ad, LEWIS[ad]) if ad in LEWIS else " Bölüm %s." % ad), "doi": ""}
            continue
        if tur == "db":
            r, aday = db_coz(ad)
            if not r: hata.append((q[0], k, aday)); continue
            out[k] = {"metin": r[0], "doi": r[1]}
        elif tur == "s":
            if ad not in sanat: hata.append((q[0], k, "yok")); continue
            out[k] = {"metin": sanat[ad]["metin"].replace(", et al.", ", ve ark."), "doi": sanat[ad].get("doi", ""), "pmid": sanat[ad].get("pmid", "")}
        else:
            if ad not in EK: hata.append((q[0], k, "yok")); continue
            out[k] = {"metin": EK[ad][0], "doi": EK[ad][1], **({"pmid": EK[ad][2]} if len(EK[ad]) > 2 else {})}
for h in hata: print("ÇÖZÜLEMEDİ", h)
if not hata:
    (A / "kaynaklar.json").write_text(json.dumps(out, ensure_ascii=False, indent=1, sort_keys=True), encoding="utf-8")
    print(len(out), "kaynak yazıldı")
