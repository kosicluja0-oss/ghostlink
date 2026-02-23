

# Stripe Live Mode - Krok 1: Ulozeni Live Secret Key

## Co se stane
Po schvaleni tohoto planu ti zobrazim bezpecny formular pro vlozeni tveho Live Secret Key (`sk_live_...`). Klic bude bezpecne ulozen jako secret v backendu a nahrazni stavajici testovaci klic.

## Postup
1. Aktualizuji secret **STRIPE_SECRET_KEY** na tvuj novy live klic
2. Po ulozeni bude klic okamzite pouzivan vsemi backend funkcemi (checkout, webhook, portal)

## Dalsi kroky (po ulozeni klice)
Po tomto kroku budeme pokracovat s:
- **Krok 2**: Nastaveni webhooku a ulozeni Webhook Signing Secret
- **Krok 3**: Ziskani 4 Live Price IDs a aktualizace kodu
- **Krok 4**: Aktualizace Price IDs v kodu a webhook funkci

