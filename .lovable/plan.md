# Migliorare sezioni Hard / Soft skills nella spalla sinistra (posizione)

## Problema
Nel pannello laterale, quando si clicca una persona/posizione, le sezioni "Hard skills richieste" e "Soft skills richieste" mostrano solo dei chip uguali, senza far capire:
- quali skill richieste la persona **possiede**,
- quali skill richieste la persona **non possiede** (gap),
- (opzionale) eventuali skill della persona **in più** rispetto al richiesto.

## Cosa cambia (solo UI, nessuna logica di business nuova)

File: `src/components/admin/orgchart/OrgChartContextPanel.tsx` → componente `PositionView`.

### 1. Rinominare le sezioni
- "Hard skills richieste" → **"Hard skills"**
- "Soft skills richieste" → **"Soft skills"**

Sotto il titolo aggiungere un mini-contatore tipo `2 / 3 possedute` (verde se 100%, ambra se parziale, rosso se 0).

### 2. Chip con stato (matched / missing)
Per ogni skill richiesta del ruolo confronto con i dati dell'assignee (stessa fuzzyMatch già usata in `calcRoleSkillGap`):
- **Soft**: contro `assignee.karmaData?.softSkills`
- **Hard**: contro `assignee.hardSkills?.map(s => s.name)` (con tooltip livello 1–5 se disponibile)

Stati visivi del chip:
- **Posseduta** → sfondo pieno (blu/viola), icona ✓
- **Mancante** → bordato tratteggiato, testo muted, icona ✕ (rosso tenue)
- **Posizione vacante** → tutti i chip "neutri" + nota "Posizione aperta – nessun assegnatario"

### 3. Sezione "Skill aggiuntive della persona" (opzionale, compatta)
Sotto le richieste, se l'assignee ha skill **non presenti** tra le richieste:
- piccolo blocco "Altre skill di {Nome}" con max 6 chip outline grigi (+N se di più).
- Separate hard/soft solo se servono, altrimenti riga unica.

### 4. Legenda inline minimale
Sopra la prima sezione skill, una riga `✓ posseduta · ✕ mancante` size `text-[10px]` per non occupare spazio.

## Dettagli tecnici
- Nessuna nuova dipendenza, nessuna chiamata di rete.
- Estrarre un piccolo helper `matchSkills(required, owned)` locale al file che riusa la stessa logica fuzzyMatch già presente (estrarla in una util locale per evitare duplicazione con `calcRoleSkillGap`).
- Tipi: `role.requiredHardSkills` / `requiredSoftSkills` già tipizzati come `RequiredSkill[]`; `assignee.hardSkills` e `assignee.karmaData?.softSkills` già usati altrove nello stesso file.
- Mantenere palette tokens esistenti (`text-blue-700`, `text-purple-700`, ecc.) — già in uso in questo componente.

## Out of scope
- Nessuna modifica al modale "Apri dettaglio completo".
- Nessuna modifica alla logica di scoring/match.
- Nessuna modifica al backend o ai tipi.
