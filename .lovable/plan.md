

# Piano: Fix Export PDF Organigramma - Contenuto Cards Bianco

## Problema Identificato

Il PDF esportato mostra:
- ✅ La struttura ad albero con le linee di connessione
- ✅ I bordi colorati delle cards (purple/blue/green)
- ❌ **Tutto il contenuto interno delle cards è BIANCO/invisibile**

## Analisi Tecnica del Bug

Il problema è causato da una combinazione di fattori legati a `html2canvas`:

### 1. Posizionamento Off-Screen
```javascript
container.style.left = '-9999px'; // ❌ Problematico
```
Quando un elemento è posizionato fuori dallo schermo visibile, `html2canvas` può avere problemi a catturare correttamente il contenuto renderizzato.

### 2. Rendering React Non Completo
Il componente `OrgChartPrintView` viene montato in un container nascosto, ma il rendering React + layout CSS potrebbero non essere completamente calcolati prima della cattura.

### 3. Stili Inline e Colori
Gli stili inline potrebbero non essere applicati correttamente quando il container non è visibile nel DOM normale.

---

## Soluzione Proposta

### Approccio 1: Rendering Visibile ma Trasparente

Invece di nascondere il container off-screen, lo renderizziamo **on-screen ma coperto** da un overlay:

```typescript
// Invece di:
container.style.left = '-9999px';

// Usare:
container.style.position = 'fixed';
container.style.top = '0';
container.style.left = '0';
container.style.zIndex = '-1'; // Dietro tutto
container.style.opacity = '0.01'; // Quasi invisibile ma renderizzato
container.style.pointerEvents = 'none';
```

### Approccio 2: Forzare il Layout Computation

Aggiungere un passaggio che forza il browser a calcolare il layout prima della cattura:

```typescript
// Dopo il rendering React
await new Promise(r => setTimeout(r, 500));

// Forzare reflow
container.offsetHeight; // Trigger layout calculation
container.getBoundingClientRect(); // Calcola posizioni

// Attendere ancora per font/immagini
await new Promise(r => setTimeout(r, 1000));
```

### Approccio 3: Usare `foreignObjectRendering`

Configurare html2canvas per usare il rendering alternativo che è più affidabile per contenuti complessi:

```typescript
const canvas = await html2canvas(container, {
  scale: 3,
  useCORS: true,
  backgroundColor: '#ffffff',
  logging: true, // Per debug
  allowTaint: true,
  foreignObjectRendering: false, // Disabilitare se causa problemi
  windowWidth: container.scrollWidth,
  windowHeight: container.scrollHeight,
  scrollX: 0,
  scrollY: 0,
  x: 0,
  y: 0,
});
```

---

## Modifiche ai File

### File 1: `src/components/admin/OrgChartExportModal.tsx`

Modificare la logica di rendering per:
1. Usare posizionamento visibile ma nascosto (opacity bassa, z-index negativo)
2. Forzare il calcolo del layout prima della cattura
3. Aumentare i timeout per garantire rendering completo
4. Aggiungere logging per debug

```typescript
const handleExport = async () => {
  setIsExporting(true);
  
  try {
    // Creare container VISIBILE ma nascosto visivamente
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '2400px';
    container.style.backgroundColor = '#ffffff';
    container.style.zIndex = '-9999';
    container.style.opacity = '0.001';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);

    // Render React
    const root = createRoot(container);
    await new Promise<void>((resolve) => {
      root.render(
        <OrgChartPrintView
          company={company}
          users={users}
          options={options}
          onRenderComplete={resolve}
        />
      );
    });

    // Forzare reflow layout
    container.offsetHeight;
    container.getBoundingClientRect();
    
    // Attendere rendering completo
    await new Promise(r => setTimeout(r, 2000));

    // Ora rendere VISIBILE per cattura
    container.style.opacity = '1';
    container.style.zIndex = '99999';
    
    // Breve pausa per paint
    await new Promise(r => setTimeout(r, 200));

    // Catturare
    await exportOrgChartToPdf(container, company, options);

    // Cleanup
    root.unmount();
    document.body.removeChild(container);
    // ...
  }
};
```

### File 2: `src/services/orgChartExportService.ts`

Migliorare le impostazioni di html2canvas:

```typescript
const canvas = await html2canvas(container, {
  scale: 3,
  useCORS: true,
  backgroundColor: '#ffffff',
  logging: false,
  allowTaint: true,
  windowWidth: Math.max(container.scrollWidth, 2400),
  windowHeight: Math.max(container.scrollHeight, 1600),
  scrollX: 0,
  scrollY: 0,
  x: 0,
  y: 0,
  imageTimeout: 15000,
  removeContainer: false, // Non rimuovere container automaticamente
});
```

### File 3: `src/components/admin/OrgChartPrintView.tsx`

Aggiungere stili espliciti per garantire visibilità:

1. **Colori testo espliciti**: Ogni elemento deve avere `color` specificato
2. **Background espliciti**: Ogni container deve avere `backgroundColor`
3. **Font espliciti**: `fontFamily: 'Arial, sans-serif'` per massima compatibilità

```typescript
const cardStyle = (nodeType: string): React.CSSProperties => ({
  borderRadius: '12px',
  borderLeft: `4px solid ${borderColor}`,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  background: '#ffffff', // ✅ Esplicito
  color: '#1f2937', // ✅ Esplicito - colore testo
  padding: '16px',
  minWidth: '280px',
  maxWidth: '380px',
  display: 'inline-block',
  textAlign: 'left',
  fontFamily: 'Arial, Helvetica, sans-serif', // ✅ Font standard
});
```

E aggiungere `color` esplicito a TUTTI gli elementi testuali.

---

## Flusso di Rendering Corretto

```text
1. Creare container → position: fixed, opacity: 0.001
                  ↓
2. Montare React component
                  ↓
3. Attendere onRenderComplete callback
                  ↓
4. Forzare reflow (offsetHeight, getBoundingClientRect)
                  ↓
5. Attendere 2 secondi per fonts + paint
                  ↓
6. Rendere visibile (opacity: 1, z-index alto)
                  ↓
7. Breve pausa (200ms) per paint finale
                  ↓
8. html2canvas capture
                  ↓
9. Nascondere + cleanup
```

---

## Risultato Atteso

Dopo queste modifiche:
1. Il contenuto delle cards sarà visibile nel PDF
2. Nomi, badge, metriche, avatar renderizzati correttamente
3. Colori e stili identici alla UI live
4. Nessun testo bianco/invisibile

