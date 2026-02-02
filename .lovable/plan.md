
# Bezpečnostní audit - DOKONČENO ✅

## Opraveno
- ✅ **support_messages** - Přidána UPDATE politika pro adminy
- ✅ **support_tickets** - Přidána DELETE politika pro adminy
- ✅ **clicks/conversions** - INSERT politiky opraveny (WITH CHECK validace)
- ✅ **Leaked Password Protection** - Zapnuto v backendu

## Záměrně blokované (bez explicitní politiky = zakázáno)
- **clicks/conversions UPDATE/DELETE** - Data jsou immutable, žádné úpravy/mazání
- **user_roles INSERT/UPDATE/DELETE** - Role spravuje pouze backend/admin přes SQL
- **profiles DELETE** - Mazání účtu řešeno přes edge function `delete-account`
- **support_messages DELETE** - Zprávy nelze mazat, jen označit jako přečtené

## Další kroky
1. **Bridge Pages** - Implementovat funkční mezistavovací stránky
2. **Google OAuth** - Přidat alternativní přihlášení
3. **Mobile audit** - Zkontrolovat UX na mobilech
