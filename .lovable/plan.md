Sostituire ovunque nella UI il termine "Possedut*" con "Present*" per coerenza linguistica.

## Modifiche

**`src/components/admin/orgchart/OrgChartContextPanel.tsx`** (spalla sinistra org chart)
- Riga 596: `${matched}/${total} possedute` → `${matched}/${total} presenti`
- Riga 603: `✓ posseduta` → `✓ presente`

**`src/components/roles/UnifiedDetailModal.tsx`** (dettaglio profilo/ruolo)
- Riga 1230: `'Posseduta'` → `'Presente'`
- Righe 1242–1243: tooltip `Posseduta —` → `Presente —` / `Posseduta a livello inferiore` → `Presente a livello inferiore`
- Riga 1275: legenda `Posseduta` → `Presente`
- Riga 1300: title `Posseduta dalla persona` → `Presente nella persona`
- Riga 1315: badge `Posseduta` → `Presente`
- Riga 1348: label sezione `Posseduta` → `Presente`

Nessuna modifica a logica, conteggi o stili; solo rename del label.