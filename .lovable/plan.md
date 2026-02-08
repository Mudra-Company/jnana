
# Piano: Modal di Dettaglio Ruolo con View/Edit Mode e Audit Log

## Problema Identificato

La **UnifiedDetailModal** ha diversi problemi:

1. **Tasto "Modifica Ruolo" non funziona**: L'interfaccia dichiara `onEditRole?: () => void` ma dalla vista viene passata una funzione che si aspetta `UpdateRoleInput`. Il modal non ha uno stato di editing interno per raccogliere le modifiche.

2. **Manca il tasto Elimina**: Non c'è modo di rimuovere un ruolo dal sistema.

3. **Manca modalità View/Edit**: Il modal dovrebbe aprirsi in **sola lettura**, con un pulsante per abilitare l'editing. Solo dopo il click si possono modificare i campi.

4. **Manca l'Audit Log**: Non viene tracciato chi modifica i ruoli e quando.

---

## Soluzione Proposta

### 1. Aggiungere stato interno View/Edit

```text
Apertura Modal
     │
     ▼
┌─────────────────────────────────────┐
│  MODALITÀ VISUALIZZAZIONE           │
│  ─────────────────────────────────  │
│  [Tutti i campi in read-only]       │
│                                     │
│  ┌─────────────┐  ┌──────────────┐  │
│  │ ✏️ Modifica │  │ 🗑️ Elimina  │  │
│  └─────────────┘  └──────────────┘  │
└─────────────────────────────────────┘
     │ Click "Modifica"
     ▼
┌─────────────────────────────────────┐
│  MODALITÀ EDITING                   │
│  ─────────────────────────────────  │
│  [Campi editabili]                  │
│                                     │
│  ┌───────────┐  ┌────────────────┐  │
│  │ Annulla   │  │ 💾 Salva      │  │
│  └───────────┘  └────────────────┘  │
└─────────────────────────────────────┘
```

### 2. Tabella Audit Log per Role Changes

Nuova tabella `company_role_audit_logs`:

```text
┌────────────────────────────────────────────────────────────────┐
│ company_role_audit_logs                                        │
├────────────────────────────────────────────────────────────────┤
│ id            UUID PRIMARY KEY                                 │
│ role_id       UUID → company_roles(id)                         │
│ user_id       UUID → profiles(id) (chi ha fatto la modifica)  │
│ action        ENUM: 'created', 'updated', 'deleted', 'assigned'│
│ changes       JSONB (snapshot diff: before → after)            │
│ created_at    TIMESTAMPTZ                                      │
└────────────────────────────────────────────────────────────────┘
```

### 3. Flusso al Salvataggio

```text
1. Utente clicca "Salva"
2. Chiamata updateRole() con le modifiche
3. Inserimento in company_role_audit_logs con:
   - user_id: utente corrente
   - action: 'updated'
   - changes: { before: {...}, after: {...}, fields: ['title', 'description', ...] }
4. Toast di conferma
5. Ritorno alla modalità visualizzazione
```

---

## Implementazione Tecnica

### File da Modificare

| File | Azione |
|------|--------|
| `src/components/roles/UnifiedDetailModal.tsx` | Aggiungere stato `isEditing`, form editabili, tasto Elimina |
| `views/admin/CompanyOrgView.tsx` | Aggiornare props per gestire save/delete |
| `src/hooks/useCompanyRoles.ts` | Aggiungere funzione `logRoleChange()` |
| **Nuova migrazione** | Creare tabella `company_role_audit_logs` |

---

### Modifiche a UnifiedDetailModal.tsx

#### Nuove Props

```typescript
interface UnifiedDetailModalProps {
  // ... esistenti
  onSaveRole?: (roleId: string, updates: UpdateRoleInput) => Promise<void>;
  onDeleteRole?: (roleId: string) => Promise<void>;
  currentUserId?: string; // Per audit log
}
```

#### Nuovo Stato Interno

```typescript
const [isEditing, setIsEditing] = useState(false);
const [editedRole, setEditedRole] = useState<Partial<UpdateRoleInput>>({});
const [isSaving, setIsSaving] = useState(false);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
```

#### Nuova Footer Actions

```typescript
// Modalità View
{!isEditing && (
  <div className="flex gap-2">
    <Button variant="outline" onClick={() => setIsEditing(true)}>
      <Edit size={16} /> Modifica Ruolo
    </Button>
    <Button variant="ghost" className="text-red-500" onClick={() => setShowDeleteConfirm(true)}>
      <Trash2 size={16} /> Elimina
    </Button>
  </div>
)}

// Modalità Edit
{isEditing && (
  <div className="flex gap-2">
    <Button variant="ghost" onClick={() => { setIsEditing(false); setEditedRole({}); }}>
      Annulla
    </Button>
    <Button onClick={handleSave} disabled={isSaving}>
      {isSaving ? <Loader2 className="animate-spin" /> : <Save size={16} />} Salva Modifiche
    </Button>
  </div>
)}
```

#### Campi Editabili nei Tab

Per ogni tab (Ruolo, Requisiti, Contratto), i campi diventano `<input>` o `<textarea>` solo quando `isEditing === true`:

```typescript
// Esempio per il titolo
{isEditing ? (
  <input 
    value={editedRole.title ?? role.title}
    onChange={e => setEditedRole(prev => ({ ...prev, title: e.target.value }))}
    className="border rounded px-2 py-1 w-full"
  />
) : (
  <span>{role.title}</span>
)}
```

---

### Nuova Migrazione: Audit Log Table

```sql
-- Enum per tipo di azione
CREATE TYPE public.role_audit_action AS ENUM ('created', 'updated', 'deleted', 'assigned', 'unassigned');

-- Tabella audit log
CREATE TABLE public.company_role_audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID NOT NULL REFERENCES public.company_roles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action public.role_audit_action NOT NULL,
    changes JSONB, -- { before: {...}, after: {...}, changedFields: [...] }
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indici per query veloci
CREATE INDEX idx_role_audit_role ON public.company_role_audit_logs(role_id);
CREATE INDEX idx_role_audit_user ON public.company_role_audit_logs(user_id);
CREATE INDEX idx_role_audit_created ON public.company_role_audit_logs(created_at DESC);

-- RLS
ALTER TABLE public.company_role_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: solo admin/HR possono vedere i log della propria azienda
CREATE POLICY "Company admins can view role audit logs"
    ON public.company_role_audit_logs
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.company_roles cr
        WHERE cr.id = company_role_audit_logs.role_id
        AND (public.is_company_admin(auth.uid(), cr.company_id) 
             OR public.is_company_hr(auth.uid(), cr.company_id))
    ));

-- Policy: inserimento automatico durante update (via trigger o app)
CREATE POLICY "System can insert audit logs"
    ON public.company_role_audit_logs
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
```

---

### Aggiornamento useCompanyRoles Hook

Aggiungere funzione per registrare il log:

```typescript
const logRoleChange = useCallback(async (
  roleId: string, 
  action: 'created' | 'updated' | 'deleted',
  changes?: { before?: Partial<CompanyRole>; after?: Partial<CompanyRole>; changedFields?: string[] }
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('company_role_audit_logs').insert({
    role_id: roleId,
    user_id: user.id,
    action,
    changes
  });
}, []);
```

Modificare `updateRole` per chiamare automaticamente il log:

```typescript
const updateRole = useCallback(async (
  roleId: string, 
  input: UpdateRoleInput,
  previousRole?: CompanyRole // per calcolare diff
): Promise<{ success: boolean; error?: string }> => {
  // ... update logic esistente ...
  
  if (result.success && previousRole) {
    // Calcola quali campi sono cambiati
    const changedFields = Object.keys(input).filter(
      key => JSON.stringify(previousRole[key]) !== JSON.stringify(input[key])
    );
    
    await logRoleChange(roleId, 'updated', {
      before: pick(previousRole, changedFields),
      after: pick(input, changedFields),
      changedFields
    });
  }
  
  return result;
}, [logRoleChange]);
```

---

### Visualizzazione Audit Log nella Tab "Storia"

La tab "Storia" già esiste e mostra lo storico degli assegnamenti. Aggiungeremo anche le modifiche al ruolo:

```typescript
// Fetch audit logs insieme alla history
const fetchRoleAuditLogs = async (roleId: string) => {
  const { data } = await supabase
    .from('company_role_audit_logs')
    .select(`
      *,
      user:user_id (first_name, last_name)
    `)
    .eq('role_id', roleId)
    .order('created_at', { ascending: false });
  return data || [];
};
```

Nella tab Storia, mostrare:

```text
┌─────────────────────────────────────────────────────────────┐
│ 📋 MODIFICHE AL RUOLO                                       │
├─────────────────────────────────────────────────────────────┤
│ 📝 Marco Rossi ha aggiornato il ruolo                       │
│    08/02/2026 15:32                                         │
│    Campi: titolo, descrizione, remote_policy                │
├─────────────────────────────────────────────────────────────┤
│ ✨ Sara Bianchi ha creato il ruolo                          │
│    05/02/2026 10:15                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Riepilogo Modifiche

| Componente | Cambiamento |
|------------|-------------|
| **UnifiedDetailModal** | Stato `isEditing`, campi editabili, tasti Salva/Annulla/Elimina |
| **CompanyOrgView** | Props `onSaveRole`, `onDeleteRole` |
| **useCompanyRoles** | Funzione `logRoleChange()`, modifica `updateRole()` |
| **Database** | Nuova tabella `company_role_audit_logs` con RLS |
| **Tab Storia** | Sezione "Modifiche al Ruolo" con audit trail |

---

## Risultato Atteso

1. Modal si apre in **sola lettura**
2. Click su **"Modifica"** → abilita editing sui campi
3. Click su **"Salva"** → persiste modifiche + log audit
4. Click su **"Elimina"** → conferma + rimozione ruolo
5. Tab **"Storia"** mostra chi ha modificato cosa e quando
