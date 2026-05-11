## Obiettivo

Spostare il blocco titolo "Organigramma Aziendale" (titolo, pulsante Esporta PDF, sottotitolo, legenda colori clima/fit) dentro la **spalla sinistra** (`OrgChartContextPanel`), in modo che:

- la spalla parta dal bordo superiore dell'area contenuto (estesa fin sopra dove ora c'è il titolo);
- il blocco titolo + legenda diventi la **prima sezione "fissa"** in alto nella spalla, sempre visibile indipendentemente dal livello di selezione;
- sotto resti la parte **dinamica** già esistente (Vista Azienda / Dettaglio Nodo / Dettaglio Posizione) che cambia in base alla selezione.

Tutto il resto (canvas zoom/pan, nodi, modali) resta identico.

## Modifiche

### `views/admin/CompanyOrgView.tsx`
- Rimuovere il blocco `<div className="mb-8 text-center">…</div>` (righe ~1885–1905) che contiene titolo + bottone Esporta + sottotitolo + legenda.
- Passare i dati che servono al pannello come nuove prop:
  - `companyName`
  - `onExportPdf` → `() => setShowExportModal(true)`
- Il container esterno (`p-8 max-w-full …`) resta, ma senza il titolo sopra: la `<div className="flex gap-0 …">` parte direttamente in alto.

### `src/components/admin/orgchart/OrgChartContextPanel.tsx`
- Aggiungere prop `companyName: string` e `onExportPdf: () => void`.
- Aggiungere una nuova sezione **header fissa** (sticky in alto, `border-b`) prima dello scroll del contenuto dinamico, contenente:
  - `h2` "Organigramma Aziendale" + bottone "Esporta PDF" (icona Download).
  - Sottotitolo `Struttura gerarchica e funzionale di {companyName}`.
  - Legenda compatta: pallini Clima (Critico/Neutro/Ottimo) + indicatori Fit Culturale / Fit Manager (con le icone già usate `Building`, `Handshake`).
- Quando la spalla è in stato `collapsed` (48px), mostrare solo l'icona dell'organigramma + bottone export con tooltip; nascondere titolo/legenda.
- La parte dinamica esistente (Vista Azienda / Nodo / Posizione) diventa il blocco scrollabile sotto l'header fisso.

### Layout responsive
- ≥1280px: header fisso sempre visibile in alto nella spalla, parte dinamica scrollabile sotto.
- 1024–1279px e drawer mobile: stesso pattern, header fisso in cima al pannello/drawer.

## Fuori scopo

- Nessuna modifica a metriche, dati, canvas, modali, OrgNodeCard.
- Nessuna modifica DB.
- L'`OrgChartExportModal` continua a essere renderizzato dal `CompanyOrgView` come oggi.
