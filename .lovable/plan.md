
# Piano: Miglioramento Radicale Export PDF Organigramma

## Problema Attuale

L'export PDF genera un risultato di qualità inaccettabile perché:

1. **Componente PrintView separato e semplificato** - Non replica l'aspetto reale dell'organigramma
2. **Emoji corrotti nel PDF** - html2canvas non gestisce bene gli emoji Unicode
3. **Layout diverso** - Non usa `react-organizational-chart` come la UI reale
4. **Stili persi** - Card con styling inline molto basico invece dei componenti Tailwind ricchi
5. **Mancano elementi visivi** - Progress bar, badge colorati, icone Lucide, gradienti, ombre

---

## Strategia di Risoluzione

### Approccio 1: Catturare l'Organigramma Reale

Invece di renderizzare un componente separato semplificato, **cattureremo direttamente l'organigramma visibile a schermo** con alcune modifiche:

1. Clonare il container dell'organigramma reale
2. Applicare modifiche per la stampa (rimuovere bottoni azione, etc.)
3. Catturare con html2canvas con impostazioni ottimizzate
4. Generare PDF multi-pagina se necessario

### Approccio 2: Ricreare PrintView con Fidelità Alta

Ricostruire `OrgChartPrintView` per essere una replica quasi esatta di `OrgNodeCard`, usando:

1. Lo stesso componente `Tree`/`TreeNode` di react-organizational-chart
2. Le stesse classi Tailwind (convertite in stili inline per html2canvas)
3. Icone Lucide SVG invece di emoji
4. Sostituire emoji con testo/simboli compatibili con i font PDF

**Scelta: Approccio 2** - Più controllo, più affidabile, permette personalizzazione via opzioni

---

## Modifiche Tecniche

### 1. Sostituire Emoji con Icone/Testo

| Prima (emoji) | Dopo (compatibile) |
|---------------|-------------------|
| 🌡️ | Icona `ThermometerSun` o testo "Clima:" |
| ⚠️ | Icona `AlertTriangle` o testo "Gap:" |
| 🔍 | Icona `Search` o testo "Hiring:" |
| 👑 | Icona `Crown` o testo "★ LEADER" |
| 🏢 | Testo "Fit:" |
| 🤝 | Testo "Mgr:" |

### 2. Usare react-organizational-chart nel PrintView

Modificare `OrgChartPrintView.tsx` per usare lo stesso sistema Tree/TreeNode della UI reale.

### 3. Replicare lo Stile delle Card

Creare un componente `PrintNodeCardEnhanced` che replica visivamente `OrgNodeCard`:
- Bordo colorato a sinistra (purple/blue/green per root/department/team)
- Stesse ombre e gradienti sottili
- Badge con stili identici
- Avatar circolari con iniziali
- Progress bar per i punteggi (se mostrati)

### 4. Aumentare Qualità Cattura html2canvas

```typescript
const canvas = await html2canvas(container, {
  scale: 3, // Aumentare da 2 a 3
  useCORS: true,
  backgroundColor: '#ffffff',
  logging: false,
  allowTaint: true,
  windowWidth: 2400, // Forzare viewport largo
  windowHeight: 1600,
  foreignObjectRendering: true, // Migliore rendering testo
});
```

### 5. Supporto Multi-Pagina per Organigrammi Grandi

Se l'organigramma è più grande di una pagina A4:
- Calcolare se serve paginazione
- Dividere l'immagine in sezioni
- Generare più pagine PDF

---

## File da Modificare

| File | Modifica |
|------|----------|
| `src/components/admin/OrgChartPrintView.tsx` | Riscrittura completa con Tree/TreeNode e stili fedeli |
| `src/services/orgChartExportService.ts` | Aumentare qualità, gestire multi-pagina |
| `src/components/admin/OrgChartExportModal.tsx` | Aumentare timeout rendering, migliorare feedback |

---

## Nuovo OrgChartPrintView - Struttura

```tsx
// Usa lo stesso Tree component della UI reale
import { Tree, TreeNode } from 'react-organizational-chart';

const PrintNodeCard = ({ node, users, options, ... }) => {
  // Stessi calcoli di OrgNodeCard per clima, gap, etc.
  
  return (
    <div style={{
      // Bordo colorato a sinistra
      borderLeft: `4px solid ${nodeColor}`,
      // Sfondo con gradiente sottile
      background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)',
      // Ombra
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      // Altre proprietà...
    }}>
      {/* Header con nome e badge */}
      {/* Lista utenti con avatar, nomi, titoli, metriche */}
    </div>
  );
};

const renderTree = (node: OrgNode) => (
  <TreeNode label={<PrintNodeCard node={node} ... />}>
    {node.children.map(child => renderTree(child))}
  </TreeNode>
);

export const OrgChartPrintView = ({ company, users, options }) => (
  <div style={{ padding: '40px', background: '#fff', minWidth: '1600px' }}>
    <Tree
      lineWidth="2px"
      lineColor="#6366f1"
      lineBorderRadius="8px"
      label={<PrintNodeCard node={company.structure} ... />}
    >
      {company.structure.children.map(child => renderTree(child))}
    </Tree>
  </div>
);
```

---

## Dettagli Stile per Fedeltà Visiva

### Card Container
```css
border-radius: 12px;
border-left: 4px solid [purple|blue|green];
box-shadow: 0 4px 6px rgba(0,0,0,0.1);
background: linear-gradient(to-br, rgba(147,51,234,0.05) 0%, white 100%);
padding: 12px;
min-width: 280px;
max-width: 380px;
```

### Badge Tipo Nodo
```css
font-size: 10px;
font-weight: 700;
text-transform: uppercase;
padding: 2px 8px;
border-radius: 4px;
background-color: [purple|blue|green];
color: white;
```

### Badge Clima/Gap
```css
font-size: 10px;
font-weight: 700;
padding: 2px 8px;
border-radius: 4px;
border: 1px solid [color];
background-color: [color-light];
color: [color-dark];
display: flex;
align-items: center;
gap: 4px;
```

### Avatar Utente
```css
width: 36px;
height: 36px;
border-radius: 50%;
background-color: #6366f1;
color: white;
display: flex;
align-items: center;
justify-content: center;
font-size: 12px;
font-weight: 700;
```

### Progress Bar (per Culture/Manager Fit)
```css
width: 60px;
height: 6px;
background: #e5e7eb;
border-radius: 3px;
overflow: hidden;
/* Inner fill: width basata su percentuale */
```

---

## Risultato Atteso

Dopo le modifiche, il PDF esportato sarà:

1. **Visivamente identico** all'organigramma a schermo
2. **Senza caratteri corrotti** (emoji sostituiti con icone/testo)
3. **Con qualità superiore** (scale 3x, viewport largo)
4. **Con linee di connessione** come nella UI (via react-organizational-chart)
5. **Con tutti i dettagli selezionati** visibili e leggibili
