
## Přidání kontaktního odkazu do Settings

### Co se změní
Do patičky Settings stránky (vedle "Download My Data" a "Delete Account") přidám třetí ghost tlačítko **"Contact Support"** s ikonou obálky, které otevře mailto odkaz (např. `support@ghostlink.app`) nebo externím odkaz na kontaktní formulář.

### Implementace

**Soubor: `src/pages/Settings.tsx`**

- Do footer sekce (řádek ~816) přidám nové tlačítko před stávající dvě:

```tsx
<Button
  variant="ghost"
  className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
  onClick={() => window.location.href = 'mailto:support@ghostlink.app'}
>
  <Mail className="w-4 h-4 mr-2" />
  Contact Support
</Button>
```

- Ikona `Mail` je již importována, takže žádné nové závislosti nejsou potřeba.
- Tlačítko bude vizuálně konzistentní se stávajícími ghost tlačítky v patičce.

### Poznámka
Email adresu `support@ghostlink.app` můžeš nahradit skutečnou adresou. Případně mohu místo mailto použít externí odkaz (např. na Tally formulář, Crisp chat apod.) -- stačí říct.
