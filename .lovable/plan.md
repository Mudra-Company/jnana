
# Integrazione Flussi di Comunicazione in SpaceSync

## Obiettivo

Aggiungere una vista "Flussi di Comunicazione" sul canvas SVG che visualizza le connessioni di collaborazione tra le persone sedute alle scrivanie, basata sui dati del `collaboration_profile` dei ruoli. Arricchire i report laterali con informazioni dettagliate su collaborazione e affinita.

---

## 1. Nuova vista "Flussi" nel Canvas

### Toggle nella Toolbar
Aggiungere un terzo bottone nella sezione "Vista" della `CanvasToolbar` (accanto a Heatmap):
- Icona: `GitBranch` o `Network` (da Lucide)
- Label: "Flussi"
- Stato: `flowMode` (boolean), gestito in `SpaceSyncView` come `heatmapMode`
- Le due viste (Heatmap e Flussi) sono mutuamente esclusive: attivando una si disattiva l'altra

### Nuovo componente: `CollaborationFlowOverlay`
Un layer SVG (come `ProximityHeatmap`) che:
1. Itera su tutte le scrivanie assegnate che hanno un `collaborationProfile` nel `userDataMap`
2. Per ogni `link` nel profilo, cerca se il `targetId` (memberId nel `memberBreakdown`) corrisponde a un'altra scrivania presente nel canvas
3. Disegna una linea SVG tra le due scrivanie con:
   - **Spessore** proporzionale alla % di collaborazione (1px per 5%, 2px per 15%, 3px per 30%+)
   - **Colore** basato sull'affinita: verde (4-5), grigio-blu (3), ambra (1-2)
   - **Freccia direzionale** (marker SVG) per indicare chi ha dichiarato il link
   - **Label** sulla linea: "30%" (la percentuale di collaborazione)
4. Al hover sulla linea, mostra un tooltip SVG con: nomi, % collaborazione, affinita (stelle), e se bidirezionale

### Dati necessari
- `userDataMap` (gia disponibile in SpaceSyncView) contiene `collaborationProfile` per ogni membro
- `desks` (per le coordinate)
- `rooms` (per le coordinate assolute)

### Logica di matching
Per ogni scrivania A con `collaborationProfile.links`:
- Per ogni link con `memberBreakdown`:
  - Per ogni membro nel breakdown, cercare se quel `memberId` corrisponde a `desk.companyMemberId` di un'altra scrivania
  - Se si, disegnare la connessione A -> B con la % e affinita di quel membro specifico

---

## 2. Report Flussi nella Sidebar

### Nuovo pannello collassabile: "Report Flussi"
Visibile quando `flowMode` e attivo. Contiene:

**A) Statistiche globali**
- Numero di connessioni attive sul piano
- % media di collaborazione
- Affinita media
- Connessioni mancanti (link definiti ma persona non presente nel piano)

**B) Lista connessioni ordinate per intensita**
Per ogni connessione:
- Nome A -> Nome B
- % collaborazione + stelle affinita
- Badge "Bidirezionale" se entrambi hanno un link verso l'altro
- Colore bordo sinistro basato su affinita

**C) Alert: collaboratori distanti**
Se due persone hanno un link con % >= 20 ma NON sono su scrivanie adiacenti (distanza > ADJACENCY_THRESHOLD), mostrare un alert arancione:
- "Mario D. e Giulia B. collaborano al 35% ma sono distanti — considerare riposizionamento"

---

## 3. Arricchimento Report Prossimita esistente

Aggiungere al `ProximityReport` una sotto-sezione "Dettaglio Collaborazione" per ogni coppia critica/eccellente:
- Mostrare se esiste un link di collaborazione tra i due e con quale %
- Mostrare l'affinita personale dichiarata
- Icona specifica se la coppia ha alta collaborazione ma basso score di prossimita (o viceversa)

---

## 4. File da Modificare/Creare

| File | Azione |
|---|---|
| `src/components/spacesync/CollaborationFlowOverlay.tsx` | **NUOVO** - Layer SVG con linee di flusso |
| `src/components/spacesync/CollaborationFlowReport.tsx` | **NUOVO** - Report laterale flussi |
| `src/components/spacesync/canvas/CanvasToolbar.tsx` | Aggiungere toggle "Flussi" |
| `views/admin/SpaceSyncView.tsx` | Nuovo stato `flowMode`, passare overlay e report |
| `src/components/spacesync/FloorPlanCanvas.tsx` | Accettare `flowOverlay` prop (come `heatmapOverlay`) |
| `src/components/spacesync/ProximityReport.tsx` | Aggiungere dettaglio collaborazione nelle coppie |

---

## Dettagli Tecnici

### Struttura CollaborationFlowOverlay

```text
Props:
  - desks: OfficeDesk[]
  - rooms: OfficeRoom[]
  - userDataMap: Map<string, ProximityUserData>

Logica:
  1. Costruire mappa memberId -> { desk, absX, absY }
  2. Per ogni membro con collaborationProfile.links:
     Per ogni link.memberBreakdown:
       Se breakdown.memberId ha una scrivania:
         Disegnare linea con spessore/colore basato su percentage/affinity
  3. Deduplica: se A->B e B->A esistono entrambi, disegnare una sola linea bidirezionale
     con spessore = max(pctA, pctB) e label che mostra entrambe le %
```

### SVG Arrow Markers
Definire nel `<defs>` del canvas principale un marker freccia per le linee direzionali:
```text
<marker id="flow-arrow" ...>
  <path d="M 0 0 L 10 5 L 0 10 z" />
</marker>
```

### Toggle mutualmente esclusivo
In SpaceSyncView:
```text
flowMode + heatmapMode sono mutuamente esclusivi
Attivare Flussi -> disattiva Heatmap e viceversa
```

### Calcolo connessioni mancanti
Per il report, iterare su tutti i link di tutti gli utenti nel piano e verificare quali `memberId` nel breakdown NON hanno una scrivania assegnata nella location corrente. Queste sono "collaborazioni non ottimizzate".

Nessuna migrazione DB. Nessuna nuova dipendenza. 4 file nuovi/modificati + 2 componenti nuovi.
