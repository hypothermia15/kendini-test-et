# Kendini Test Et

Çocuk ve ergen psikiyatrisi ağırlıklı bilgi yarışı. [miracbarisusta.com/kendini-test-et](https://miracbarisusta.com/kendini-test-et/) adresinde yayımlanır.

- 625 soruluk havuzdan her testte rastgele 20 soru gelir; seçeneklerin sırası her gösterimde karışır.
- Her doğru yanıt 100 taban puan ve en çok 100 hız primi kazandırır. Hız primi ilk 3 saniyede tamdır, 30. saniyede sıfırlanır.
- Yanıttan sonra doğru seçenek, kısa açıklama ve kaynak gösterilir.
- Skorlar rumuzla herkese açık tabloya gönderilebilir (bu ay ve tüm zamanlar).

## Dosyalar

| Dosya | İçerik |
| --- | --- |
| `index.html` | Üretilen sayfa; soru havuzu sayfanın içindedir. Elle düzenlenmez. |
| `test.js`, `test.css` | Test motoru ve biçim. |
| `tools/sorular_a.py` … `sorular_i.py` | Soru havuzu. Doğru yanıt her soruda ilk seçenektir. |
| `tools/secenek_duzelt.py` | Seçenek uzunluklarını dengeleyen düzeltmeler (doğru yanıt uzunluğuyla belli olmasın). |
| `tools/kaynaklar.json` | Soruların kaynakları. |
| `tools/kaynak_ek.py`, `tools/kaynak_cikar.py` | Kaynak listesini üreten yardımcılar. |
| `tools/olustur.py` | `index.html` üreticisi. |

## Soru eklemek

1. Soruyu `tools/sorular_*.py` dosyalarından birine yeni bir kimlikle (`q626`…) ekleyin. Kimlikler kalıcıdır; silinen sorunun kimliği yeniden kullanılmaz.
2. Kaynak öteki rehberlerin kaynakçasında yoksa `tools/kaynak_ek.py` dosyasına ekleyin ve `tools/kaynak_cikar.py` betiğini çalıştırın.
3. `python3 tools/olustur.py` ile sayfayı yeniden üretin.

Site her derlemede bu deponun son sürümünü alır.

## Skor tablosu

Skorları sitenin `/api/skor` adresindeki sunucu işlevi tutar (kaynağı site deposunda: `netlify/functions/skor/`). İşlev puanı gönderilen yanıtlardan yeniden hesaplar, rumuzu denetler ve aynı rumuzun yalnızca en iyi sonucunu saklar. Puan kuralları `test.js` ile işlevde aynı olmalıdır.

Sorular ve yanıtlar tarayıcıya gönderildiği için tablo hileye karşı tam korunamaz; eğlence amaçlıdır, sınav yerine geçmez.

## Kaynaklar ve lisans

Sorular DSM-5-TR'ye, Rutter's Child and Adolescent Psychiatry and Psychology'ye (7. baskı; sorular kitabın metninden çıkarılmış, bölüm numarasıyla kaynak gösterilmiştir), Maudsley Prescribing Guidelines'a (15. baskı), kuramcıların özgün yapıtlarına ve araştırma makalelerine dayanır. DOI ya da PubMed bağlantısı taşıyan makale künyeleri PubMed üzerinden doğrulanmıştır; kitaplar ve eski makaleler bağlantısız, yalnızca künyeyle verilir. DSM-5-TR ve Maudsley soruları kitap düzeyinde kaynak gösterir; sayfa numarası verilmemiştir. Eğitim amaçlıdır; klinik karar yerine geçmez. Lisans için `LICENSE` dosyasına bakın.
