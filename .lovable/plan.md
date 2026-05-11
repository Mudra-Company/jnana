## Obiettivo

Spostare il bottone **Esporta PDF** e la **legenda** (Clima Critico/Neutro/Ottimo + Fit Culturale/Fit Manager) dall'header della spalla sinistra a un **riquadro fluttuante** in alto a destra del canvas dell'organigramma, sempre visibile e persistente (non scorre con il pan/zoom della struttura).

## Modifiche

### `src/components/admin/orgchart/OrgChartCanvas.tsx`
- Aggiungere prop opzionale `onExportPdf?: () => void`.
- Renderizzare un nuovo overlay in `absolute top-4 right-4 z-20` (stesso stack della toolbar di zoom in basso a destra), in `bg-white/dark:bg-gray-800` con `border`, `rounded-xl`, `shadow-lg`, padding compatto.
- Contenuto del riquadro:
  - Bottone "Esporta PDF" più prominente: `flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90` con icona `Download` e label.
  - Separatore sottile.
  - Legenda compatta su due righe (stesso markup oggi presente nell'header del pannello): pallini Clima (Critico/Neutro/Ottimo) + indicatori Fit Culturale (Building) / Fit Manager (Handshake).
- Il riquadro sta fuori dal `TransformComponent` (è già il pattern usato dalla toolbar zoom), quindi resta fisso durante pan/zoom.

### `src/components/admin/orgchart/OrgChartContextPanel.tsx`
- Rimuovere dall'header fisso della spalla:
  - il bottone "Esporta PDF" (righe ~629–635);
  - il blocco legenda (righe ~636–653).
- Mantenere titolo "Organigramma Aziendale" + sottotitolo + pulsante collapse pannello.
- Rimuovere prop `onExportPdf` dall'interfaccia `Props` e dalla destructuring (non più usata qui).
- Nel rendering "collapsed" (spalla a 48px) togliere anch'esso il bottone export se presente.

### `views/admin/CompanyOrgView.tsx`
- Spostare `onExportPdf={() => setShowExportModal(true)}` dal `<OrgChartContextPanel ... />` al `<OrgChartCanvas ... />`.

## Layout / responsive

- ≥1024px: il riquadro non sovrappone i nodi del root perché è ancorato al bordo del canvas (in alto a destra), con z-index sopra il TransformComponent.
- L'utente può comunque pannare la struttura sotto il riquadro (è un overlay fisso).
- La toolbar di zoom resta in basso a destra: nessuna sovrapposizione.

## Fuori scopo

- Nessuna modifica a metriche, dati, modali, OrgNodeCard, esportazione PDF (logica invariata).
- Nessuna modifica DB.
- Nessuna modifica al comportamento di collasso dei riquadri.
