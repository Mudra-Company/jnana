

# Export PDF Report dell'Analisi RIASEC

## Cosa viene esportato

Il PDF conterrà tutte le sezioni visibili nella tab "Analisi RIASEC":
1. **Header** con nome utente, profilo (es. R-S-A), azienda e data
2. **Mappa Attitudinale** (radar chart) — catturata come immagine dal canvas Recharts
3. **Intensità Tratti** (bar chart orizzontale) — catturata come immagine
4. **Report dettagliato** — tutte le sezioni testuali (descrizioni dimensioni, lavori suggeriti, tratti distintivi)

## Approccio tecnico

Creare un servizio `src/services/riasecPdfExportService.ts` che usa **jsPDF** (già installato nel progetto) per generare il PDF programmaticamente, senza html2canvas. I grafici verranno renderizzati come immagini PNG tramite il metodo nativo di Recharts/SVG (`canvas.toDataURL`).

### Flusso
1. L'utente clicca un bottone "Esporta PDF" nella tab RIASEC
2. Il servizio riceve i dati già calcolati (scores, adjData, report, user info)
3. I due grafici SVG vengono convertiti in PNG via un `<canvas>` temporaneo
4. jsPDF compone il documento: header colorato, grafici affiancati, poi sezioni testuali con impaginazione automatica multi-pagina

### File da creare/modificare

| File | Azione |
|---|---|
| `src/services/riasecPdfExportService.ts` | Nuovo — genera il PDF con jsPDF |
| `views/user/UserResultView.tsx` | Aggiungere bottone "Esporta PDF" nella tab RIASEC + refs ai container SVG dei grafici |

### Dettaglio del PDF generato

- **Pagina 1**: Header con gradient indigo, nome + cognome, job title, azienda, codice profilo, data. Sotto: i due grafici affiancati (radar a sinistra, bar chart a destra), convertiti da SVG a PNG.
- **Pagina 2+**: Report testuale completo — titoli sezioni in bold, lista lavori suggeriti, tratti distintivi come tags, citazioni in corsivo. Gestione automatica page break.

### Conversione grafici SVG → PNG

Per catturare i grafici Recharts senza html2canvas, aggiungerò due `ref` ai container dei grafici. Al momento dell'export:
1. Trovo l'elemento `<svg>` dentro il container
2. Serializzo con `XMLSerializer`
3. Disegno su un `<canvas>` temporaneo via `Image` + `data:image/svg+xml`
4. Estraggo con `canvas.toDataURL('image/png')`

### Bottone UI

Nella tab RIASEC, in alto a destra accanto al titolo "Mappa Attitudinale", un bottone con icona `FileDown` e testo "Esporta PDF".

