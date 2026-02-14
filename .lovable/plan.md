

## Oprava build erroru v separator.tsx

### Příčina problému
Soubor `src/components/ui/separator.tsx` má prázdné tělo komponenty – funkce vrací `void` místo JSX elementu. Toto blokuje celý build projektu a způsobuje, že žádná úprava se úspěšně nezkompiluje.

### Řešení
Obnovit standardní implementaci Separator komponenty – doplnit `return` statement s JSX.

### Technické detaily

**Soubor: `src/components/ui/separator.tsx`**

Nahradit prázdné tělo funkce (řádky 9-32) standardní implementací:

```tsx
({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className
    )}
    {...props}
  />
)
```

Toto je standardní shadcn/ui Separator komponenta. Po této opravě build projde a všechny předchozí i budoucí změny se budou kompilovat správně.
