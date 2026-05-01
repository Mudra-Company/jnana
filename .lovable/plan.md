
## Problema

Il checkbox "Ricordami" in `src/views/auth/AuthView.tsx` esiste solo come `useState` locale: il valore non viene mai passato a `signIn`, né influenza la persistenza della sessione Supabase. Di fatto:

- Oggi il client Supabase (`src/integrations/supabase/client.ts`) usa `persistSession: true` su `localStorage`. La sessione DOVREBBE già rimanere salvata tra refresh.
- Se l'utente è costretto a rifare login ogni volta, le cause realistiche sono:
  1. La spunta non fa nulla, quindi l'utente non capisce perché venga "dimenticato" o si aspetta un comportamento diverso (sessione lunga vs sessione di sola scheda).
  2. In alcuni browser/contesti (privacy, terze parti, preview Lovable in iframe) `localStorage` può essere effimero, e non abbiamo un fallback.
  3. Manca un comportamento esplicito: "non ricordarmi" = sessione che termina alla chiusura del browser.

## Obiettivo

Dare al checkbox un significato chiaro e funzionante:

- **Ricordami spuntato** → sessione persistente in `localStorage` (login resta dopo chiusura browser, ~comportamento attuale di default).
- **Ricordami NON spuntato** → sessione effimera in `sessionStorage` (login perso alla chiusura della scheda/browser).
- Il valore della preferenza viene ricordato tra le visite (così la checkbox riappare come l'utente l'ha lasciata).

## Cosa cambierà

### 1. `src/integrations/supabase/client.ts`
- Sostituire `storage: localStorage` con uno **storage adapter** che inoltra le chiamate a `localStorage` o `sessionStorage` in base a un flag `jnana_remember_me` salvato in `localStorage`.
- L'adapter, in lettura, prova prima lo storage "attivo" e fa fallback sull'altro (per non sloggare gli utenti già loggati con il vecchio comportamento).
- In scrittura usa solo lo storage attivo e ripulisce le chiavi `sb-*` dall'altro per evitare sessioni doppie.

### 2. `src/hooks/useAuth.tsx`
- Estendere `signIn(email, password, rememberMe?: boolean)`:
  - Prima della chiamata a `supabase.auth.signInWithPassword`, impostare `localStorage.setItem('jnana_remember_me', rememberMe ? '1' : '0')` così l'adapter sa dove scrivere la sessione.
  - Se `rememberMe === false`, ripulire eventuali chiavi `sb-*` da `localStorage` prima del login per non lasciare residui.
- `signOut` resta invariato ma ripulisce entrambi gli storage delle chiavi `sb-*`.

### 3. `src/views/auth/AuthView.tsx`
- Inizializzare `rememberMe` leggendo `localStorage.getItem('jnana_remember_me')` (default `true`, così l'esperienza standard resta "ricordami").
- Passare `rememberMe` a `signIn(email, password, rememberMe)`.
- Mostrare una piccola hint sotto il checkbox: "Se disattivato, dovrai accedere di nuovo alla prossima sessione".

### 4. Nessuna modifica DB / nessuna migrazione
Tutto è gestito client-side. La durata effettiva del JWT lato Supabase non cambia: cambia solo dove viene salvata la sessione.

## Note tecniche

- Lo `Storage`-like adapter espone `getItem`, `setItem`, `removeItem` (è ciò che si aspetta `@supabase/supabase-js`).
- Il fallback in lettura evita il logout forzato per utenti già autenticati prima di questo cambio.
- `autoRefreshToken: true` resta attivo: se l'utente ha "Ricordami" spuntato, il refresh continua a funzionare su `localStorage`.

## Fuori scopo

- Non cambiamo durata dei token Supabase (configurazione lato server).
- Non aggiungiamo "Remember device" lato backend (sarebbe necessario per MFA/device trust, qui non rilevante).
