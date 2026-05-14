# Fix etichette grafico Distribuzione Generazionale

## Problema
Nel donut chart "Distribuzione Generazionale" l'etichetta esterna `Millennial 68%` viene tagliata a sinistra ("Millennial" diventa "illennial"). Il fix precedente (margini + raggio ridotto) non basta perché:
- I nomi delle generazioni sono lunghi (`Millennial`, `Baby Boomer`) e Recharts posiziona il testo all'esterno della Pie senza misurarne la larghezza reale.
- La card è già stretta (3 colonne affiancate) e qualsiasi margine "sufficiente" sprecherebbe spazio del donut.
- I nomi sono già presenti nella `Legend` sotto il grafico → ripeterli all'esterno è ridondante.

## Soluzione
Eliminare la duplicazione: lasciare nomi solo nella legenda, mostrare nelle slice solo la percentuale.

1. **Label compatte** in `views/admin/AdminIdentityHub.tsx` (linee 591-607):
   - Cambiare `label` da `${name} ${percent}%` a solo `${percent}%`.
   - Rimuovere `labelLine` (non serve più, l'etichetta sta dentro/vicino alla slice).
   - Posizionare le label internamente (`labelPosition` via funzione custom con `cx,cy,midAngle,innerRadius,outerRadius`) così il testo è sempre dentro il canvas e non può essere tagliato.
   - Ripristinare `outerRadius={80}` / `innerRadius={40}` e rimuovere i margini extra (60/60) introdotti prima → il donut torna alla dimensione originale.

2. **Tooltip e Legend invariati**: il nome completo + numero persone resta nel tooltip al hover, e nella legenda sotto. Nessuna perdita di informazione.

## Fuori scope
- Nessuna modifica ai dati `generationPieData`, ai colori, al layout della card o agli altri grafici della pagina.
- Nessun cambio backend / tipi.

## Dettagli tecnici
File modificato: `views/admin/AdminIdentityHub.tsx`

```tsx
const renderSliceLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null; // niente label per fette < 5%
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
          className="text-xs font-semibold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

<PieChart>
  <Pie ... outerRadius={80} innerRadius={40} label={renderSliceLabel} labelLine={false}>
    ...
  </Pie>
  <Tooltip ... />
  <Legend ... />
</PieChart>
```
