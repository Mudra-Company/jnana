# Onboarding B2C & B2B — Audit e piano di evoluzione

Agisco come Product Owner: prima l'**as-is** documentato con file e gap, poi il **to-be** target, poi il **piano operativo** in fasi.

---

## 1. AS-IS — Mappatura attuale

### 1.A Flusso B2C (Karma — talento autonomo)

```text
Landing (KarmaSection CTA)
   └── AuthView mode=karma  (signup email+password, no email verify)
         └── auth_intent='karma' in localStorage
              └── App.loadCurrentUserData → KARMA_WELCOME
                    ├── Card A: "Veloce con AI" → CVImportBanner → cv-parser → CVReviewScreen → KarmaProfileEdit
                    └── Card B: "Manuale" → KarmaOnboarding (5 step: info, skills, social, bio, foto)
                          └── PostOnboardingPromo → RIASEC test → KarmaTestChat (Karma AI Discovery)
                                └── KarmaDashboard
```

**File chiave:** `src/views/auth/AuthView.tsx`, `views/karma/KarmaWelcome.tsx`, `views/karma/KarmaOnboarding.tsx` (5 step), `views/karma/CVReviewScreen.tsx`, `views/karma/PostOnboardingPromo.tsx`, `views/karma/KarmaTestRiasec.tsx`, `views/karma/KarmaTestChat.tsx`, `views/karma/KarmaDashboard.tsx`.

**Gap rilevati:**
- **Nessuna verifica email** all'iscrizione (`auto_confirm` lasciato di default; non c'è template branded `auth-email-hook`).
- **Nessuna welcome email** post-signup.
- Lo step di scelta "CV vs manuale" mostra "~2 min / ~5–10 min" ma poi il flow manuale ha **5 schermate piene** + RIASEC + Karma chat → percezione del tempo reale lontana dalla promise.
- `KarmaOnboarding` raccoglie hard skill **senza livello osservato/required**, mentre la piattaforma v2 usa `skill_assessments` con `observedLevel`/`requiredLevel`. Discrepanza con il modello dati ruoli.
- Nessun campo per **career aspirations / growth areas** in onboarding, ma Karma AI v2 li estrae e la dashboard li mostra.
- `PostOnboardingPromo` propone solo RIASEC e poi Karma chat in scenario `discovery`; non viene mai proposto **Climate Pulse** né RoleFit (il B2C non ha ruolo, quindi corretto, ma manca un trigger per quando l'utente diventa B2B).
- Non c'è uno **stato di completezza profilo** persistito (% completion, missing fields) → l'utente non sa cosa gli manca per essere "matchabile".

### 1.B Flusso B2B (utente invitato dall'azienda)

```text
Admin in AdminDashboard.handleInviteUser
   ├── INSERT company_members (placeholder_email/name, status='pending', user_id=NULL)
   └── invoke send-invite-email (Resend, HTML inline)
         └── Email con link  https://mudra.holdings/?invite={memberId}&company={companyId}
               └── App.tsx legge ?invite= → localStorage.pendingInvite → LANDING (banner) → AuthView
                     └── AuthView in useEffect: forza mode='jnana' + isLogin=false, prefill da company_members.placeholder_*
                          └── signUp(email,password) [senza link al member_id]
                                └── ⚠ Nessun trigger che riconcilia company_members.user_id con l'auth user appena creato
                                      └── App routing post-login:
                                          - se membership.company_id → USER_WELCOME → USER_TEST (RIASEC) → USER_RESULT
                                          - se NO membership (caso reale, vedi sotto) → KARMA_WELCOME
```

**File chiave:** `views/admin/AdminDashboard.tsx` (handleInviteUser, handleSendInvite), `supabase/functions/send-invite-email/index.ts`, `App.tsx` (parsing `?invite=`), `src/views/auth/AuthView.tsx` (pendingInvite useEffect), `views/landing/LandingPage.tsx` (banner), `views/user/UserWelcomeView.tsx`, `views/user/UserTestView.tsx`.

**Gap critici:**
1. **🚨 Manca la riconciliazione invite ⇄ user**: dopo signUp non c'è UPDATE su `company_members` per impostare `user_id = auth.user.id` e `status='active'`/`joined`. Risultato: l'utente entra come **Karma user** invece che come dipendente. Tutto il banner "Sei stato invitato" è cosmetico.
2. **Nessun token firmato** sull'URL: chiunque conosca `memberId+companyId` può completare l'invito con email arbitraria (vulnerabilità di account takeover dei placeholder).
3. **Nessuna verifica che l'email del signup combaci** con `placeholder_email`. L'invitato può registrarsi con un'email diversa e si perde il legame.
4. **Email su Resend "raw"**: bypassa l'infrastruttura Lovable Emails (auth-email-hook + queue + suppression list). Nessun retry, nessun log su `email_send_log`.
5. **Manca distinzione fra "invito a entrare in azienda" e "assegnazione a un ruolo"**: oggi `handleInviteUser` non collega mai il member a una `company_role` né a un `org_node`. L'admin deve farlo separatamente dall'organigramma, e la persona arriva senza job_title nemmeno mostrato.
6. **Nessun reminder** se l'invito non è accettato (campo `last_reminder_sent` esiste solo per compliance, non per gli inviti).
7. **Nessuna scadenza** dell'invito; il link è eterno.
8. **B2B onboarding post-login povero**: `USER_WELCOME` è una pagina statica con un solo CTA "Inizia il Test"; non mostra nulla del tenant (logo, nome, manager, ruolo assegnato), nessun consenso GDPR contestuale, nessuna scheda profilo personale da completare prima del test.
9. Dopo RIASEC il dipendente atterra su `USER_RESULT`; **non viene mai invitato a fare Karma chat** (scenario `role_fit` se ha un ruolo, altrimenti `discovery`), né Climate Pulse, anche se la piattaforma v2 ne ha bisogno per popolare i match.
10. Nessuna **chiamata a karma-analyze** per estrarre `skill_assessments` rispetto al `required_hard_skills` del ruolo già al primo login B2B → i match score restano vuoti.
11. **Doppio path "JNANA/KARMA" in AuthView** confonde l'invitato: l'invitato deve sempre andare su JNANA ma il selettore appare comunque se torna dalla landing senza il banner.

### 1.C Modello dati — coerenza con onboarding

| Entità | Stato attuale | Usata in onboarding? |
|---|---|---|
| `profiles` (headline, bio, years_experience, looking_for_work…) | OK | Sì (Karma) / **No** (B2B) |
| `company_members.required_profile` | popolata dall'org chart | **Non letta** in USER_WELCOME |
| `company_role_assignments` | popolata dall'admin | **Non letta** in onboarding utente |
| `company_roles.required_hard_skills/soft/seniority` | v2 schema | **Non confrontate** con il profilo utente al primo accesso |
| `karma_sessions.skill_assessments / culture_fit / career_aspirations` | scritte da karma-analyze | **Mai triggerate** in B2B onboarding |
| `riasec_results` | OK | OK in entrambi |

---

## 2. TO-BE — Visione target

### 2.A Principi
1. **Un unico contratto di onboarding**: indipendentemente dal canale (B2C o B2B), l'output è un `profile_completeness ≥ X%` + RIASEC + Karma session + (se B2B) `company_role_assignment` confermato.
2. **Email come asset di prodotto**: tutte le mail transazionali passano da Lovable Emails (auth-email-hook per auth, send-transactional-email per invito/reminder/welcome). Branding unico Mudra.
3. **Inviti firmati e tracciati**: token JWT/HMAC con scadenza, single-use, riconciliato server-side via edge function `accept-invite`.
4. **Onboarding role-aware**: se l'utente B2B ha già un ruolo assegnato, il flusso evidenzia le skill richieste e usa Karma scenario `role_fit`.
5. **Progressive disclosure**: niente wall di 5 step; soft start, completamento graduale con "Profile Strength" sempre visibile.

### 2.B Flusso B2C target

```text
KARMA landing → Signup (email+pwd o Google)
   → Email di verifica branded (auth-email-hook custom template)
       → "Welcome Karma" email + link onboarding
            → KARMA_WELCOME (CV o Manual)
                 → Mini-onboarding 3 step (identità, headline+location+work_pref, top 5 skill con LIVELLO 1-5)
                      → "Profile Strength 40% → completa per raggiungere 80%"
                            → RIASEC (opzionale skip+remind)
                                  → Karma Chat scenario=discovery (esistente, già v2)
                                        → KARMA_DASHBOARD con widget "Completa profilo" sticky
```

Nuovi touchpoint email B2C:
- `welcome-karma` (transazionale) subito dopo verifica
- `riasec-reminder` se non completato in 48h
- `monthly-pulse` ricorrente (opt-in)

### 2.C Flusso B2B target

```text
Admin in AdminDashboard / Org chart
   └── "Invita Persona" (modal unica) → sceglie:
         · email
         · ruolo (company_role) opzionale
         · org_node opzionale
         · messaggio personalizzato opzionale
   └── edge fn  create-invite  →
         · INSERT company_members con placeholder + invite_token (HMAC, scadenza 14gg)
         · se ruolo scelto: INSERT company_role_assignments (start_date null, status='pending')
         · enqueue email "B2B Invite" via send-transactional-email
              ▼
         Email mostra: logo tenant, nome manager invitante, ruolo proposto, durata stimata onboarding, CTA "Accetta invito"
              ▼
         Link  https://app/invite/accept?token=...
              ▼
         Pagina InviteAcceptView (pubblica, no auth):
            · valida token via edge fn  validate-invite
            · mostra: "Acme ti invita come Senior Designer nel team Product"
            · CTA "Crea account" (email prefillata, locked) OR "Accedi se hai già un account"
                  ▼
              signUp → edge fn  accept-invite  (chiamata post-auth con session JWT + token)
                  · verifica auth.user.email == placeholder_email
                  · UPDATE company_members: user_id, status='active', joined_at
                  · UPDATE company_role_assignments: start_date=today
                  · INSERT user_role 'user'
                  · ritorna { redirect: 'B2B_ONBOARDING' }
                       ▼
                  B2B_ONBOARDING (nuovo, sostituisce USER_WELCOME):
                    Step 1 — "Benvenuto in {Company}": logo, manager, ruolo, team, consenso GDPR/privacy
                    Step 2 — Profilo personale veloce (avatar, data nascita, headline, lingue)
                    Step 3 — "Le skill richieste dal tuo ruolo" (lista required_hard_skills+soft del role)
                              → per ognuna l'utente dichiara observedLevel 1-5
                    Step 4 — RIASEC (con stima 6 min)
                    Step 5 — Karma chat scenario=role_fit (passa role_id, skillGap pre-calcolata)
                                → karma-analyze popola skill_assessments confrontati con required
                    Step 6 — Climate Pulse (se l'azienda ha climate attivo)
                       ▼
                    USER_DASHBOARD/USER_RESULT con badge "Onboarding completato"
```

Email B2B:
- `b2b-invite` (con info ruolo)
- `b2b-invite-reminder` (D+3, D+7)
- `b2b-onboarding-welcome` (subito dopo accept)
- `b2b-onboarding-incomplete` (D+2 se profile_strength < 70%)
- `b2b-admin-notification` all'admin: "Mario ha accettato l'invito"

### 2.D Modello dati — aggiunte/modifiche

- `company_members`: aggiungere `invite_token text`, `invite_expires_at timestamptz`, `invite_accepted_at timestamptz`, `invited_by uuid`, `personal_message text`, `pending_role_id uuid` (opzionale assignment in attesa).
- Tabella `onboarding_progress (user_id, company_id, step, completed_at, profile_strength_score)` per il widget di completezza.
- `user_roles` riga inserita in `accept-invite` (oggi non viene fatto).
- Vista `v_profile_completeness` che calcola lo score per UI.

### 2.E Pagine/componenti nuovi
- `views/auth/InviteAcceptView.tsx` (route pubblica `/invite/accept`)
- `views/onboarding/B2BOnboardingFlow.tsx` (6 step)
- `src/components/onboarding/ProfileStrengthBadge.tsx`
- `src/components/admin/InvitePersonModal.tsx` (sostituisce il blocco inline in AdminDashboard, riusabile da Org Chart)
- Templates email branded in `supabase/functions/_shared/email-templates/`

---

## 3. PIANO DI IMPLEMENTAZIONE (fasi)

### Fase 1 — Foundations (sicurezza inviti + email infra)
1. Migration: aggiunta colonne invito su `company_members`, tabella `onboarding_progress`, vista completeness.
2. Edge functions: `create-invite`, `validate-invite`, `accept-invite` (firma HMAC, scadenza 14gg, single-use).
3. Setup Lovable Emails: domain check, `setup_email_infra`, `scaffold_auth_email_templates` (per verifica email B2C/B2B), `scaffold_transactional_email`.
4. Template `b2b-invite.tsx` brandato Mudra (sostituisce HTML inline in `send-invite-email`).
5. Deprecazione progressiva `send-invite-email` (mantenuta come alias verso il nuovo flow finché Admin non punta a `create-invite`).

### Fase 2 — Refactor Admin & Org Chart invite UX
1. `InvitePersonModal` unificato: email, ruolo (opt), node (opt), messaggio.
2. AdminDashboard e CompanyOrgView usano la stessa modal → chiama `create-invite`.
3. Lista invitati con stato (pending / sent / accepted / expired) + azioni "Reinvia" / "Revoca" / "Copia link".
4. Notifica admin via email a invito accettato.

### Fase 3 — B2C onboarding polish
1. Snellire `KarmaOnboarding` a 3 step + introdurre livello skill 1-5.
2. Aggiungere `ProfileStrengthBadge` sticky nella `KarmaDashboard`.
3. Welcome email + reminder RIASEC via queue.
4. Verifica email obbligatoria (configurare auth, custom templates).

### Fase 4 — B2B onboarding role-aware
1. Nuova route `INVITE_ACCEPT` (pubblica) → `InviteAcceptView`.
2. Sostituire `USER_WELCOME` con `B2BOnboardingFlow` (6 step descritti sopra).
3. Integrazione `karma-chat` scenario `role_fit` con `roleId` + `skillGap` calcolato.
4. Trigger automatico `karma-analyze` a fine chat → popolamento `skill_assessments`.
5. Email serie reminder + admin notification.

### Out of scope (per evitare scope creep)
- SSO/SAML per dipendenti.
- Bulk invite via CSV (lo lasciamo come follow-up).
- Multi-tenant membership per la stessa persona (oggi 1 user = 1 company).
- Mobile app onboarding.

---

## 4. Dettagli tecnici (per chi implementa)

- **Token invito**: `HMAC_SHA256(memberId + companyId + expiresAt, INVITE_SIGNING_SECRET)` → encoded base64url. Verificato server-side in `validate-invite` / `accept-invite`. Secret nuovo `INVITE_SIGNING_SECRET`.
- **RLS**: `accept-invite` gira con service role; client non aggiorna direttamente `company_members.user_id`. Policy invariata.
- **Routing**: aggiungere `ViewState` type `INVITE_ACCEPT` e `B2B_ONBOARDING`; aggiornare `pathToView` e `AppRoutes.tsx`. Bypassare i route guard finché l'utente è in `B2B_ONBOARDING`.
- **Email queue**: usare `supabase.rpc('enqueue_email', { purpose: 'transactional', queue: 'transactional_emails', payload })` dentro `create-invite`.
- **Profile strength**: funzione pl/pgsql che pesa: avatar(5), headline(10), bio(10), skill≥3(20), riasec(20), karma_session(20), role assignment(15) → totale 100.
- **Backfill**: per i `company_members` esistenti `status='invited'` senza token, fornire azione admin "Reinvia con nuovo flusso".
- **Deprecazione `send-invite-email`**: mantenere ma redirigere internamente a `create-invite` per non rompere chiamate legacy.

Una volta approvato, partirei dalla Fase 1 (migration + edge functions + email infra) che è il prerequisito di tutto.
