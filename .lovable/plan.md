
# Editing Completo dei Ruoli dall'Organigramma

## Cosa cambia

### 1. Eliminazione del concetto "Ruolo Implicito" dalla UX
Il bottone "Crea Ruolo Formale" e il banner informativo vengono rimossi. Quando un utente clicca su una card con ruolo implicito, il sistema crea automaticamente il ruolo formale nel database in background (silenziosamente), cosi il ruolo diventa subito modificabile senza step intermedi. L'utente vede direttamente la modale con il bottone "Modifica" attivo.

### 2. Editing su TUTTI i tab (Requisiti + Contratto)
Attualmente solo il tab "Ruolo" supporta l'editing. I tab "Requisiti" e "Contratto" rimangono sempre in sola lettura. Con questa modifica:

**Tab Requisiti (edit mode):**
- Hard Skills: lista editabile con nome, livello (1-5), flag obbligatorio, bottone "+ Aggiungi"
- Soft Skills: stessa struttura delle hard skills
- Seniority: select dropdown (Junior/Mid/Senior/Lead/C-Level)
- Anni di esperienza: due campi numerici (min/max)
- Formazione: lista editabile con titolo, campo di studio, flag obbligatorio
- Certificazioni: lista editabile di stringhe
- Lingue: lista editabile con lingua + livello (base/intermedio/avanzato/madrelingua)

**Tab Contratto (edit mode):**
- Tipo Contratto: select dropdown
- Orario: select dropdown (Full-time/Part-time/Flessibile)
- Modalita Lavoro: select dropdown (In sede/Ibrido/Full remote/A scelta)
- Livello CCNL: campo testo
- Range RAL: due campi numerici (min/max)

### 3. Gestione Persona Assegnata (tab Persona in edit mode)
In modalita editing, il tab Persona mostra:
- Se c'e un assegnatario: il nome attuale con un bottone "Rimuovi Assegnazione"
- Un campo di ricerca/selezione per assegnare un membro dell'azienda
- Questo utilizza la lista `companyMembers` gia disponibile nel parent

## File da Modificare

### 1. `src/components/roles/UnifiedDetailModal.tsx`
- Rimuovere il banner "ruolo implicito" e il bottone "Crea Ruolo Formale"
- Rimuovere la prop `onPromoteToFormalRole` e la logica di promozione
- Rimuovere la variabile `isImplicitRole` come blocco all'editing -- `canEdit` diventa sempre `true` quando `onSaveRole` e presente
- Aggiungere edit mode al tab Requisiti: form per hard skills, soft skills, seniority, esperienza, formazione, certificazioni, lingue
- Aggiungere edit mode al tab Contratto: select per tipo contratto, orario, remote policy; campi per CCNL e RAL
- Aggiungere gestione assegnazione persona nel tab Persona (nuova prop `companyMembers` e `onAssignPerson`)

### 2. `views/admin/CompanyOrgView.tsx`
- Rimuovere la logica `onPromoteToFormalRole`
- Modificare `onSaveRole` per gestire anche i ruoli impliciti: prima di salvare, se il ruolo e implicito, creare automaticamente il ruolo formale e poi salvare le modifiche
- Passare sempre `onSaveRole` e `onDeleteRole` (senza il check `startsWith('implicit-')`)
- Passare la lista `companyMembers` e il callback `onAssignPerson` alla modale

### 3. Fix errori di build pre-esistenti
Correggere i numerosi errori TypeScript elencati nei build errors per permettere la compilazione.

## Dettagli Tecnici

Flusso auto-promozione per ruoli impliciti:
```text
Utente clicca "Modifica" su ruolo implicito
  -> onSaveRole viene chiamato
  -> CompanyOrgView controlla se role.id.startsWith('implicit-')
  -> Se si: createRole() in background, ottiene il nuovo ID
  -> Poi updateRole() con le modifiche dell'utente
  -> Aggiorna la posizione con il ruolo formale
  -> L'utente non vede nulla di tutto questo
```

Struttura editing Requisiti:
```text
[HARD SKILLS]
  Nome: [input]  Livello: [1-5]  Obbligatorio: [checkbox]  [X]
  + Aggiungi hard skill

[SOFT SKILLS]  
  Nome: [input]  Obbligatorio: [checkbox]  [X]
  + Aggiungi soft skill

[SENIORITY]
  [Dropdown: Junior | Mid | Senior | Lead | C-Level]

[ESPERIENZA]
  Da [min] a [max] anni

[FORMAZIONE]
  Titolo: [input]  Campo: [input]  Obbligatorio: [checkbox]  [X]
  + Aggiungi titolo di studio

[CERTIFICAZIONI]
  [input] [X]
  + Aggiungi certificazione

[LINGUE]
  Lingua: [input]  Livello: [dropdown]  [X]
  + Aggiungi lingua
```

Struttura editing Contratto:
```text
[TIPOLOGIA]
  Tipo Contratto: [dropdown]
  Orario: [dropdown]
  Modalita: [dropdown]

[INQUADRAMENTO]
  Livello CCNL: [input testo]
  RAL Min: [input numerico]  RAL Max: [input numerico]
```

Nessuna modifica al database. 2 file principali da modificare + fix build errors in file secondari.
