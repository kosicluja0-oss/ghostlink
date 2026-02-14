
## Přesun uživatelského profilu a odhlášení z lišty do Settings

### Co se změní

1. **Sidebar (AppSidebar.tsx)** -- kompletně odstraním celou footer sekci (avatar, email, tier badge, tlačítko odhlášení). Sidebar bude končit navigačním menu, čímž bude vizuálně čistší.

2. **Settings stránka** -- do footer sekce (vedle Contact Support, Download My Data, Delete Account) přidám tlačítko **"Sign Out"** s ikonou `LogOut`. Bude mít stejný ghost styl jako ostatní tlačítka v patičce.

3. **Zjednodušení props** -- z `AppSidebar` odstraním props `userEmail`, `userTier` a `onSignOut`, které už nebudou potřeba. Všechny stránky (Dashboard, Links, Integrations, Settings), které tyto props předávají, se odpovídajícím způsobem vyčistí.

### Technické detaily

**`src/components/layout/AppSidebar.tsx`:**
- Smazat celý `SidebarFooter` blok (řádky ~171-223)
- Odstranit nepoužívané importy (`Avatar`, `AvatarFallback`, `LogOut`, `SidebarFooter`, `SidebarSeparator`)
- Odstranit props `userEmail`, `userTier`, `onSignOut` z interface

**`src/pages/Settings.tsx`:**
- Do footer sekce přidat:
```tsx
<Button variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-muted/50" onClick={signOut}>
  <LogOut className="w-4 h-4 mr-2" />
  Sign Out
</Button>
```

**`src/pages/Dashboard.tsx`, `Links.tsx`, `Integrations.tsx`:**
- Odebrat předávání `userEmail`, `userTier`, `onSignOut` do `AppSidebar`

