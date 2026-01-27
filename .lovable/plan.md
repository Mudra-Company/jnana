
# Piano: Esporta Organigramma in PDF

## Obiettivo
Aggiungere un bottone "Esporta PDF" alla vista Organigramma che permetta all'utente di:
1. Selezionare quali informazioni includere nel PDF
2. Generare un documento PDF con l'intera struttura organizzativa

---

## Approccio Tecnico

### Libreria da Installare
Utilizzeremo **jsPDF** + **html2canvas** per catturare l'organigramma come immagine e inserirlo in un PDF. Questa combinazione è la più affidabile per esportare componenti React complessi.

```
npm install jspdf html2canvas
```

---

## Flusso Utente

```text
┌─────────────────────────────────────────────────────────┐
│  Bottone "Esporta PDF" nell'header organigramma        │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Modal "Configura Export"                               │
│  ┌───────────────────────────────────────────────────┐ │
│  │ ☑ Tipo nodo (ROOT, DEPARTMENT, TEAM)              │ │
│  │ ☑ Clima medio del nodo                            │ │
│  │ ☑ Gap competenze (%)                              │ │
│  │ ☑ Posizioni aperte                                │ │
│  │ ☐ Nomi dipendenti                                 │ │
│  │ ☐ Job Title                                       │ │
│  │ ☐ Codice RIASEC                                   │ │
│  │ ☐ Score fit culturale                             │ │
│  │ ☐ Score fit manager                               │ │
│  │ ☐ Badge Leader                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  [ Annulla ]                    [ Genera PDF ]          │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Rendering nascosto con solo le info selezionate       │
│  → Cattura con html2canvas                              │
│  → Inserimento in jsPDF                                 │
│  → Download automatico                                  │
└─────────────────────────────────────────────────────────┘
```

---

## Opzioni di Export Disponibili

### Livello Nodo (Department/Team)
| Opzione | Descrizione | Default |
|---------|-------------|---------|
| `showNodeType` | Mostra badge ROOT/DEPARTMENT/TEAM | ☑ ON |
| `showClimateScore` | Mostra punteggio clima (es. 4.5/5) | ☑ ON |
| `showSkillGap` | Mostra percentuale gap competenze | ☑ ON |
| `showHiringCount` | Mostra numero posizioni aperte | ☑ ON |

### Livello Dipendente
| Opzione | Descrizione | Default |
|---------|-------------|---------|
| `showEmployeeNames` | Mostra nomi dipendenti | ☐ OFF |
| `showJobTitles` | Mostra ruolo/job title | ☐ OFF |
| `showRiasecCode` | Mostra codice RIASEC (es. I-A-R) | ☐ OFF |
| `showCultureFit` | Mostra % fit culturale | ☐ OFF |
| `showManagerFit` | Mostra % fit manager | ☐ OFF |
| `showLeaderBadge` | Mostra badge LEADER | ☐ OFF |

---

## Struttura File

### 1. Nuovo Componente Modal
**File**: `src/components/admin/OrgChartExportModal.tsx`

Responsabilità:
- Mostrare checkbox per ogni opzione
- Gestire stato delle selezioni
- Chiamare la funzione di export al click su "Genera PDF"

### 2. Nuovo Servizio Export
**File**: `src/services/orgChartExportService.ts`

Responsabilità:
- Creare un elemento DOM temporaneo con l'organigramma renderizzato
- Applicare stili ottimizzati per la stampa
- Usare html2canvas per catturare l'immagine
- Usare jsPDF per creare il PDF multi-pagina se necessario
- Gestire la paginazione per organigrammi molto grandi

### 3. Componente Rendering per Export
**File**: `src/components/admin/OrgChartPrintView.tsx`

Versione semplificata dell'organigramma ottimizzata per PDF:
- Colori pieni (no trasparenze)
- Font system-ui per compatibilità
- Layout orizzontale per sfruttare meglio lo spazio
- Accetta le opzioni di visibilità come props

---

## Modifiche a File Esistenti

### `views/admin/CompanyOrgView.tsx`

1. Aggiungere import del modal e della funzione export
2. Aggiungere state per controllare apertura modal
3. Aggiungere bottone "Esporta PDF" nell'header (accanto alla legenda)

```tsx
// Nuovo state
const [showExportModal, setShowExportModal] = useState(false);

// Nell'header, dopo la legenda colori:
<button 
  onClick={() => setShowExportModal(true)}
  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
>
  <Download size={16} />
  Esporta PDF
</button>

// Prima del return finale:
{showExportModal && (
  <OrgChartExportModal
    company={company}
    users={users}
    onClose={() => setShowExportModal(false)}
  />
)}
```

---

## Logica di Generazione PDF

```typescript
// src/services/orgChartExportService.ts

interface ExportOptions {
  // Node level
  showNodeType: boolean;
  showClimateScore: boolean;
  showSkillGap: boolean;
  showHiringCount: boolean;
  // Employee level
  showEmployeeNames: boolean;
  showJobTitles: boolean;
  showRiasecCode: boolean;
  showCultureFit: boolean;
  showManagerFit: boolean;
  showLeaderBadge: boolean;
}

export async function exportOrgChartToPdf(
  company: CompanyProfile,
  users: User[],
  options: ExportOptions
): Promise<void> {
  // 1. Creare container temporaneo
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '1600px'; // Larghezza fissa per consistenza
  document.body.appendChild(container);
  
  // 2. Renderizzare l'organigramma con ReactDOM
  const root = createRoot(container);
  root.render(
    <OrgChartPrintView
      company={company}
      users={users}
      options={options}
    />
  );
  
  // 3. Attendere rendering
  await new Promise(r => setTimeout(r, 500));
  
  // 4. Catturare con html2canvas
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  });
  
  // 5. Creare PDF
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  // 6. Calcolare dimensioni per fit
  const imgWidth = 297; // A4 landscape width in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
  
  // 7. Download
  pdf.save(`Organigramma_${company.name}_${new Date().toISOString().split('T')[0]}.pdf`);
  
  // 8. Cleanup
  root.unmount();
  document.body.removeChild(container);
}
```

---

## Design del PDF

Il PDF generato includerà:

1. **Header**
   - Logo azienda (se disponibile)
   - Nome azienda
   - Data di generazione
   - Titolo "Organigramma Aziendale"

2. **Legenda** (opzionale, basata sulle selezioni)
   - Significato colori clima
   - Significato badge

3. **Organigramma**
   - Struttura gerarchica con linee di connessione
   - Card dei nodi con le informazioni selezionate
   - Ottimizzato per stampa (colori pieni, contrasto alto)

---

## File da Creare/Modificare

| File | Azione | Descrizione |
|------|--------|-------------|
| `src/components/admin/OrgChartExportModal.tsx` | **NUOVO** | Modal con checkbox per selezione opzioni |
| `src/components/admin/OrgChartPrintView.tsx` | **NUOVO** | Versione organigramma per stampa |
| `src/services/orgChartExportService.ts` | **NUOVO** | Logica generazione PDF |
| `views/admin/CompanyOrgView.tsx` | Modifica | Aggiungere bottone e modal |
| `package.json` | Modifica | Aggiungere dipendenze jspdf e html2canvas |

---

## Dettagli Implementativi

### Modal Checkbox UI
```tsx
// Struttura checkbox nel modal
<div className="space-y-4">
  <div>
    <h4 className="font-bold mb-2">Informazioni Nodo</h4>
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={options.showNodeType} onChange={...} />
      Tipo nodo (ROOT, DEPARTMENT, TEAM)
    </label>
    // ... altri checkbox
  </div>
  
  <div>
    <h4 className="font-bold mb-2">Informazioni Dipendenti</h4>
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={options.showEmployeeNames} onChange={...} />
      Nomi dipendenti
    </label>
    // ... altri checkbox
  </div>
</div>
```

### PrintView Component
Versione semplificata di OrgNodeCard con:
- Rendering condizionale basato su `options`
- Stili inline per garantire consistenza nel PDF
- Colori solidi invece di gradienti/trasparenze
- Font più grandi per leggibilità

---

## Risultato Atteso

1. Bottone "Esporta PDF" visibile nell'header dell'organigramma
2. Modal con tutte le opzioni di personalizzazione
3. PDF generato con le sole informazioni selezionate
4. File scaricato automaticamente con nome descrittivo
5. Layout professionale ottimizzato per stampa A4 landscape
