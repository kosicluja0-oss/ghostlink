
# Oprava zbývajících bezpečnostních problémů

## Nalezené problémy

### Kritické (error)
1. **user_roles** - Chybí INSERT/UPDATE/DELETE políčky → uživatel by si mohl přiřadit admin roli
2. **support_messages** - Chybí UPDATE/DELETE políčky → uživatel by mohl mazat/měnit zprávy

### Varování (warn)
3. **clicks** - Chybí explicitní blokace UPDATE/DELETE
4. **conversions** - Chybí explicitní blokace UPDATE/DELETE
5. **support_tickets** - Chybí DELETE políčka
6. **profiles** - Chybí DELETE políčka (záměrné - používáme edge function)

## Plán oprav

### 1. user_roles - Zablokovat všechny modifikace
```sql
-- Nikdo nemůže vkládat/měnit/mazat role (pouze přes backend/admin)
-- Tabulka už má tyto operace zakázané, jen to explicitně potvrdíme
```
Tato tabulka už má správně nastavené restrikce v Supabase - uživatelé nemohou INSERT/UPDATE/DELETE.

### 2. support_messages - Přidat UPDATE políčku pro read_at
```sql
CREATE POLICY "Admins can update message read status"
ON public.support_messages FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));
```

### 3. clicks & conversions - Explicitní blokace
Tyto tabulky už mají správně nastavené restrikce - uživatelé nemohou UPDATE/DELETE. Scan reportuje varování, ale je to záměr.

### 4. support_tickets - Přidat DELETE políčku (pouze admin)
```sql
CREATE POLICY "Only admins can delete tickets"
ON public.support_tickets FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));
```

## Ignorované položky (záměrné)
- **profiles DELETE** - Mazání účtu řešíme přes edge function `delete-account`
- **clicks/conversions UPDATE/DELETE** - Data mají být immutable

## Shrnutí změn
| Tabulka | Akce |
|---------|------|
| support_messages | Přidat UPDATE pro adminy |
| support_tickets | Přidat DELETE pro adminy |
| user_roles | Ověřit existující restrikce |
| clicks, conversions | Označit jako záměrně immutable |

## Co bude dál po bezpečnosti
1. **Bridge Pages** - Implementovat funkční mezistavovací stránky
2. **Google OAuth** - Přidat alternativní přihlášení
3. **Mobile audit** - Zkontrolovat UX na mobilech
