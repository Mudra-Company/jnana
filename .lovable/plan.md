## Problema

Il pulsante **"Il Mio Profilo"** nell'header (visibile per admin/super admin per accedere al proprio profilo personale) non compare più.

In `Header.tsx` (riga 246) la condizione è:
```tsx
{onMyProfile && hasCompanyMembership && (
  <Button ...>Il Mio Profilo</Button>
)}
```

Il flag `hasCompanyMembership` viene passato in `App.tsx` (riga 773) come `!!membership`, dove `membership` è la riga di `company_members` dell'utente loggato. Il super admin attualmente loggato (che sta supervisionando Amaeru) **non ha una riga in `company_members`** per quella azienda, quindi il pulsante scompare.

In ambiente demo / impersonazione è invece fondamentale che il pulsante resti visibile, così si possa mostrare come appare il profilo personale di un utente.

## Soluzione

Allargare la condizione di visibilità del pulsante "Il Mio Profilo": deve apparire ogni volta che l'utente ha **un profilo personale visualizzabile**, non solo quando ha una membership esplicita.

### Modifiche

**1. `App.tsx` (passaggio prop al Header, ~riga 773)**

Sostituire:
```tsx
hasCompanyMembership={!!membership}
```
con una condizione più inclusiva che copra anche i super admin in modalità supervisione e gli utenti demo:
```tsx
hasCompanyMembership={!!membership || !!currentUserData || isSuperAdmin}
```

In questo modo:
- Utenti con membership reale → vedono il pulsante (come prima).
- Super admin che impersona un'azienda → vedono il pulsante (poteva accedere al proprio profilo demo/personale).
- Admin azienda con un `currentUserData` valorizzato → vedono il pulsante.

**2. `handleGoToMyProfile` in `App.tsx` (~riga 335)**

Attualmente fa `return` se `currentUserData` è null. Per il super admin senza dati personali, quando si clicca "Il Mio Profilo" deve comunque navigare verso `USER_WELCOME` (schermata di benvenuto/test) usando `user.id`, in modo che il pulsante non risulti "morto":
```tsx
const handleGoToMyProfile = () => {
  if (!user) return;
  const hasRiasec = !!currentUserData?.results;
  if (!hasRiasec) {
    navigate({ type: 'USER_WELCOME', userId: user.id });
  } else {
    navigate({ type: 'USER_RESULT', userId: user.id });
  }
};
```

**3. (Opzionale, coerenza naming)** Rinominare la prop in `Header.tsx` da `hasCompanyMembership` a `canAccessOwnProfile` per riflettere la nuova semantica. Lasciato fuori dal piano per minimizzare il diff: la prop continua a funzionare ma con condizione allargata.

## File toccati

- `App.tsx` — aggiornare la prop passata all'`Header` e rendere `handleGoToMyProfile` resiliente a `currentUserData` null.

## Risultato atteso

Il pulsante **"Il Mio Profilo"** torna visibile nella barra in alto per:
- Admin con membership (comportamento originale).
- Super admin che supervisiona un'azienda demo (es. Amaeru) — caso attuale dell'utente.

Cliccandolo si entra nel proprio profilo personale (`USER_RESULT` se il test RIASEC è già stato completato, altrimenti `USER_WELCOME`).
