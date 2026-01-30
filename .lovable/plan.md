

# Piano: Fix Definitivo Export PDF - Contenuto Bianco/Invisibile

## Problema Radice Identificato

Dopo un'analisi approfondita, ho identificato **due problemi principali**:

### 1. Icone SVG di Lucide React non renderizzate
`html2canvas` ha un problema noto con le icone SVG: non vengono catturate correttamente a meno che non abbiano attributi `width` e `height` espliciti. Le icone Lucide React usano CSS per le dimensioni, che html2canvas non interpreta correttamente.

### 2. Container interno di html2canvas
Dalla session replay: html2canvas crea internamente il suo container con `left: -10000px` e `visibility: hidden`. Le nostre modifiche al container principale vengono ignorate perché la libreria clona il DOM in un container nascosto.

---

## Soluzione Proposta

### Approccio Multi-Layer

#### 1. Convertire icone SVG in elementi compatibili

Prima della cattura, processare tutti gli elementi SVG per:
- Forzare attributi `width` e `height` espliciti
- Oppure sostituire le icone SVG con versioni PNG/base64

```typescript
// Prima di chiamare html2canvas
const svgElements = container.querySelectorAll('svg');
svgElements.forEach((svg) => {
  const bbox = svg.getBoundingClientRect();
  svg.setAttribute('width', String(bbox.width));
  svg.setAttribute('height', String(bbox.height));
});
```

#### 2. Usare approccio alternativo: Rendering senza Lucide

Creare una versione del `PrintNodeCard` che usa **testo/emoji/simboli** invece delle icone Lucide per i badge:

| Icona | Sostituzione |
|-------|--------------|
| ThermometerSun | Simbolo `◉` + testo "Clima" |
| AlertTriangle | Simbolo `△` + testo "Gap" |
| Search | Simbolo `◎` + testo |
| Crown | Simbolo `★` + testo "LEADER" |
| Building | Simbolo `▣` + testo "Fit" |
| Handshake | Simbolo `⇄` + testo "Mgr" |

#### 3. Aumentare timeout e forzare paint

```typescript
// Attendere più a lungo
await new Promise(r => setTimeout(r, 3000));

// Forzare layout multiplo
for (let i = 0; i < 3; i++) {
  void container.offsetHeight;
  void container.getBoundingClientRect();
  await new Promise(r => setTimeout(r, 200));
}
```

#### 4. Configurare html2canvas per cloning migliore

```typescript
const canvas = await html2canvas(container, {
  scale: 3,
  useCORS: true,
  backgroundColor: '#ffffff',
  logging: true, // Attivare per debug
  allowTaint: true,
  windowWidth: Math.max(container.scrollWidth, 2400),
  windowHeight: Math.max(container.scrollHeight, 1600),
  scrollX: 0,
  scrollY: 0,
  x: 0,
  y: 0,
  onclone: (clonedDoc, element) => {
    // Forzare visibilità su tutti gli elementi clonati
    const allElements = element.querySelectorAll('*');
    allElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.visibility = 'visible';
        el.style.opacity = '1';
      }
    });
    
    // Forzare dimensioni su SVG
    const svgs = element.querySelectorAll('svg');
    svgs.forEach((svg) => {
      svg.setAttribute('width', '16');
      svg.setAttribute('height', '16');
      svg.style.display = 'inline-block';
    });
  }
});
```

---

## File da Modificare

### 1. `src/components/admin/OrgChartPrintView.tsx`

**Rimuovere completamente le icone Lucide** e usare simboli Unicode/testo:

```typescript
// PRIMA
<ThermometerSun size={12} />

// DOPO
<span style={{ fontSize: '12px', marginRight: '4px' }}>◉</span>
```

Oppure usare SVG inline come stringhe:

```typescript
const thermometerIcon = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 9V4m0 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
  </svg>
);
```

### 2. `src/components/admin/OrgChartExportModal.tsx`

- Aumentare timeout a 3000ms
- Aggiungere pre-processing SVG
- Forzare repaint multipli

### 3. `src/services/orgChartExportService.ts`

- Aggiungere logica `onclone` per forzare visibilità
- Attivare logging temporaneamente per debug
- Processare SVG nel documento clonato

---

## Approccio Alternativo: Canvas Manuale

Se html2canvas continua a fallire, considerare:

1. **Usare dom-to-image** invece di html2canvas (libreria alternativa)
2. **Generare PDF server-side** con puppeteer (richiederebbe edge function)
3. **Esportare dati JSON** e generare PDF con layout manuale in jsPDF

---

## Ordine di Implementazione

1. **Prima modifica**: Rimuovere icone Lucide da PrintView e sostituire con simboli Unicode
2. **Seconda modifica**: Aggiungere pre-processing SVG in onclone
3. **Terza modifica**: Aumentare timeout e forzare paint multipli
4. **Test**: Verificare se il contenuto appare nel PDF
5. **Se fallisce**: Passare ad approccio alternativo (dom-to-image o PDF manuale)

---

## Risultato Atteso

Dopo queste modifiche:
- Tutto il testo sarà visibile (nomi, badge, metriche)
- I simboli sostituiranno le icone SVG problematiche
- La struttura ad albero rimarrà intatta
- I colori e stili saranno preservati

