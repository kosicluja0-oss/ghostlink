

# Krok 2: Ulozeni Webhook Signing Secret

## Co se stane
Zobrazim ti bezpecny formular pro vlozeni tveho Webhook Signing Secret (`whsec_...`). Tento secret najdes ve Stripe Dashboardu u prave vytvoreneho webhooku v sekci "Signing secret".

## Postup
1. Aktualizuji secret **STRIPE_WEBHOOK_SECRET** na tvuj novy live signing secret
2. Po ulozeni bude webhook overovat podpisy vsech prichozich eventu z produkce

## Technicky detail
Secret `STRIPE_WEBHOOK_SECRET` jiz v projektu existuje (pouzival se pro testovaci webhook). Bude nahrazen tvojim novym live hodnotou.

