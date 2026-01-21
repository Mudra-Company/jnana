import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// RIASEC DATA (from data/riasecContent.ts)
// =============================================================================

const RIASEC_DIMENSIONS = [
  { code: 'R', label: 'Realistico', color: '#10B981', description: 'Attività concrete, pratiche e fisiche' },
  { code: 'I', label: 'Investigativo', color: '#6366F1', description: 'Curiosità intellettuale e analisi' },
  { code: 'A', label: 'Artistico', color: '#F59E0B', description: 'Espressione creativa e originalità' },
  { code: 'S', label: 'Sociale', color: '#EC4899', description: 'Cooperazione e aiuto al prossimo' },
  { code: 'E', label: 'Intraprendente', color: '#EF4444', description: 'Leadership e ambizione' },
  { code: 'C', label: 'Convenzionale', color: '#8B5CF6', description: 'Ordine, struttura e precisione' },
];

const RIASEC_SECTIONS = [
  {
    id: 's1',
    title: 'Questionario N. 1: Il modo di essere',
    description: "Ecco 30 situazioni quotidiane. Scegli l'affermazione che ti descrive meglio.",
    type: 'forced_choice',
    questions: [
      { id: 'q1', text: 'Quello che detesto di più', options: [
        { id: 'q1_A', text: 'Lavorare da solo', dimensions: ['S', 'C'] },
        { id: 'q1_B', text: 'Parlare di me', dimensions: ['R', 'I'] }
      ]},
      { id: 'q2', text: 'Io preferisco', options: [
        { id: 'q2_A', text: 'Agire prima, riflettere dopo', dimensions: ['E'] },
        { id: 'q2_B', text: 'Riflettere prima di agire', dimensions: ['I'] }
      ]},
      { id: 'q3', text: 'In un gruppo, io amo', options: [
        { id: 'q3_A', text: "Prendere l'iniziativa", dimensions: ['E'] },
        { id: 'q3_B', text: 'Portare nuove idee', dimensions: ['A'] }
      ]},
      { id: 'q4', text: 'Il mio divertimento preferito', options: [
        { id: 'q4_A', text: 'Cercare informazioni su internet', dimensions: ['I'] },
        { id: 'q4_B', text: 'Partecipare a una festa', dimensions: ['E'] }
      ]},
      { id: 'q5', text: 'Mi dicono che sono', options: [
        { id: 'q5_A', text: 'Una persona terra-terra', dimensions: ['R'] },
        { id: 'q5_B', text: 'Un sognatore', dimensions: ['A'] }
      ]},
      { id: 'q6', text: 'Se ne ho la possibilità', options: [
        { id: 'q6_A', text: "Mi godo una boccata d'aria fresca", dimensions: ['R'] },
        { id: 'q6_B', text: 'Passo il tempo con gli amici', dimensions: ['S'] }
      ]},
      { id: 'q7', text: 'Sono molto attirato da', options: [
        { id: 'q7_A', text: 'La gestione', dimensions: ['C'] },
        { id: 'q7_B', text: 'La filosofia', dimensions: ['A'] }
      ]},
      { id: 'q8', text: 'Preferisco le persone', options: [
        { id: 'q8_A', text: 'Intraprendenti', dimensions: ['E'] },
        { id: 'q8_B', text: 'Riflessive', dimensions: ['I'] }
      ]},
      { id: 'q9', text: 'La cosa che mi definisce meglio', options: [
        { id: 'q9_A', text: "Il mio senso dell'organizzazione", dimensions: ['C'] },
        { id: 'q9_B', text: 'Il mio senso estetico', dimensions: ['A'] }
      ]},
      { id: 'q10', text: 'In una situazione di crisi', options: [
        { id: 'q10_A', text: 'La fronteggio', dimensions: ['R', 'E'] },
        { id: 'q10_B', text: 'Tendo a perdere la calma', dimensions: [] }
      ]},
      { id: 'q11', text: 'Il mio passatempo preferito', options: [
        { id: 'q11_A', text: 'Aiutare gli altri', dimensions: ['S'] },
        { id: 'q11_B', text: 'Risolvere problemi complicati', dimensions: ['I'] }
      ]},
      { id: 'q12', text: 'Preferisco', options: [
        { id: 'q12_A', text: 'Fare bricolage', dimensions: ['R'] },
        { id: 'q12_B', text: 'Incontrare gli amici', dimensions: ['S'] }
      ]},
      { id: 'q13', text: 'Ciò che mi stimola di più', options: [
        { id: 'q13_A', text: 'I problemi complicati da risolvere', dimensions: ['I'] },
        { id: 'q13_B', text: 'Confrontarmi con gli altri', dimensions: ['S'] }
      ]},
      { id: 'q14', text: 'Gli altri dicono che sono', options: [
        { id: 'q14_A', text: 'Utile', dimensions: ['S'] },
        { id: 'q14_B', text: 'Coscienzioso', dimensions: ['C'] }
      ]},
      { id: 'q15', text: 'Sono attirato da', options: [
        { id: 'q15_A', text: 'Le attività tecniche', dimensions: ['R'] },
        { id: 'q15_B', text: "Tutto ciò che riguarda l'immaginazione", dimensions: ['A'] }
      ]},
      { id: 'q16', text: 'Per me, il modo migliore di agire è', options: [
        { id: 'q16_A', text: 'Comunicare con gli altri', dimensions: ['S'] },
        { id: 'q16_B', text: "Avere un'organizzazione personale impeccabile", dimensions: ['C'] }
      ]},
      { id: 'q17', text: "L'aggettivo che mi definisce meglio", options: [
        { id: 'q17_A', text: 'Autoritario', dimensions: ['E'] },
        { id: 'q17_B', text: 'Originale', dimensions: ['A'] }
      ]},
      { id: 'q18', text: 'Il mio punto debole', options: [
        { id: 'q18_A', text: 'Non amo prendere parola', dimensions: ['R'] },
        { id: 'q18_B', text: 'Mi piace stare sotto i riflettori', dimensions: ['E'] }
      ]},
      { id: 'q19', text: 'Per me è più importante', options: [
        { id: 'q19_A', text: 'Lavorare in gruppo', dimensions: ['S'] },
        { id: 'q19_B', text: 'Imparare continuamente cose nuove', dimensions: ['I'] }
      ]},
      { id: 'q20', text: 'Trovo la soluzione a un problema', options: [
        { id: 'q20_A', text: 'Applicando un metodo', dimensions: ['C'] },
        { id: 'q20_B', text: 'Per deduzione logica', dimensions: ['I'] }
      ]},
      { id: 'q21', text: 'Per lavorare bene, ho bisogno di', options: [
        { id: 'q21_A', text: 'Un buon clima di fiducia', dimensions: ['S'] },
        { id: 'q21_B', text: 'Avere obiettivi definiti in modo chiaro', dimensions: ['C'] }
      ]},
      { id: 'q22', text: 'Per lavorare meglio, ho bisogno di', options: [
        { id: 'q22_A', text: 'Calma', dimensions: ['A'] },
        { id: 'q22_B', text: 'Materie o argomenti interessanti', dimensions: ['C'] }
      ]},
      { id: 'q23', text: 'Ciò che amo di più', options: [
        { id: 'q23_A', text: 'Conoscere gente nuova', dimensions: ['S'] },
        { id: 'q23_B', text: 'Fare una passeggiata solitaria', dimensions: ['R'] }
      ]},
      { id: 'q24', text: 'Ho un grande bisogno di', options: [
        { id: 'q24_A', text: 'Lavorare su cose concrete', dimensions: ['R'] },
        { id: 'q24_B', text: 'Usare la mia creatività', dimensions: ['A'] }
      ]},
      { id: 'q25', text: 'Sono piuttosto', options: [
        { id: 'q25_A', text: 'Riflessivo', dimensions: ['I'] },
        { id: 'q25_B', text: 'Metodico', dimensions: ['C'] }
      ]},
      { id: 'q26', text: 'Ciò che mi motiva è', options: [
        { id: 'q26_A', text: 'La novità', dimensions: ['A'] },
        { id: 'q26_B', text: 'La riuscita', dimensions: ['E'] }
      ]},
      { id: 'q27', text: 'Personalmente, penso che', options: [
        { id: 'q27_A', text: 'Le regole, spesso, impediscono di avanzare', dimensions: ['A'] },
        { id: 'q27_B', text: 'Senza qualche regola, è impossibile avere efficacia', dimensions: ['C'] }
      ]},
      { id: 'q28', text: 'In una squadra, io sono', options: [
        { id: 'q28_A', text: 'Il leader', dimensions: ['E'] },
        { id: 'q28_B', text: 'Il pensatore', dimensions: ['I'] }
      ]},
      { id: 'q29', text: 'Penso di essere piuttosto', options: [
        { id: 'q29_A', text: 'Introverso', dimensions: ['R'] },
        { id: 'q29_B', text: 'Estroverso', dimensions: ['E'] }
      ]},
      { id: 'q30', text: 'Per organizzarmi meglio, ho bisogno di', options: [
        { id: 'q30_A', text: 'Sapere cosa ci si aspetta da me', dimensions: ['C'] },
        { id: 'q30_B', text: 'Avere un certo grado di autonomia', dimensions: ['I'] }
      ]},
    ]
  },
  {
    id: 's2',
    title: 'Questionario N. 2: Gli Ambienti Preferiti',
    description: 'Scegli le attività che preferisci. Seleziona tutte le voci che ti corrispondono.',
    type: 'checklist',
    items: [
      { id: 's2_1', text: 'Le attività che favoriscono il lavoro in gruppo', dimensions: ['S'] },
      { id: 's2_2', text: 'Le attività che favoriscono le competenze manuali e le capacità fisiche', dimensions: ['R'] },
      { id: 's2_3', text: 'Le attività dove posso prendere decisioni', dimensions: ['E'] },
      { id: 's2_4', text: 'Le attività che permettono di risolvere problemi complicati', dimensions: ['I'] },
      { id: 's2_5', text: 'Le attività che prevedono obiettivi orientati ad azioni concrete', dimensions: ['R'] },
      { id: 's2_6', text: 'Le attività che necessitano di immaginazione', dimensions: ['A'] },
      { id: 's2_7', text: 'Le attività i cui obiettivi sono la ricerca di soluzioni nuove', dimensions: ['A'] },
      { id: 's2_8', text: 'Le attività che richiedono grande spirito di iniziativa individuale', dimensions: ['E'] },
      { id: 's2_9', text: 'Le attività i cui obiettivi sono chiaramente definiti', dimensions: ['C'] },
      { id: 's2_10', text: 'Le attività dove si possono apportare le proprie idee', dimensions: ['A'] },
      { id: 's2_11', text: 'Le attività che richiedono conoscenze e competenze tecniche', dimensions: ['R'] },
      { id: 's2_12', text: 'Le attività che richiedono di aiutare gli altri', dimensions: ['S'] },
      { id: 's2_13', text: 'Attività che consentono di gestire documenti e organizzare il proprio lavoro', dimensions: ['C'] },
      { id: 's2_14', text: "Attività che comportano esperienze all'esterno", dimensions: ['E'] },
      { id: 's2_15', text: 'Attività svolte preferibilmente in un settore in cui si possono assumere responsabilità', dimensions: ['E'] },
      { id: 's2_16', text: 'Attività che richiedono conoscenze intellettuali e know-how', dimensions: ['I'] },
      { id: 's2_17', text: 'Attività i cui obiettivi siano chiaramente definiti e accettati da tutti', dimensions: ['C'] },
      { id: 's2_18', text: 'Attività preferibilmente in ambito artistico', dimensions: ['A'] },
      { id: 's2_19', text: "Attività che offrono l'opportunità di sviluppare strategie", dimensions: ['E'] },
      { id: 's2_20', text: "Attività che si svolgono preferibilmente all'aperto o all'aria aperta", dimensions: ['R'] },
      { id: 's2_21', text: 'Attività che richiedono capacità di relazione interpersonale', dimensions: ['S'] },
      { id: 's2_22', text: "Attività che si svolgono preferibilmente in un'atmosfera non direttiva", dimensions: ['A'] },
      { id: 's2_23', text: "Attività che offrono l'opportunità di sviluppare soluzioni concrete ai problemi", dimensions: ['R'] },
      { id: 's2_24', text: 'Attività preferibilmente in ambito sociale', dimensions: ['S'] },
      { id: 's2_25', text: "Attività che danno l'opportunità di sviluppare modi innovativi di fare le cose", dimensions: ['I'] },
      { id: 's2_26', text: "Attività che offrono l'opportunità di essere in contatto con molte persone diverse", dimensions: ['E'] },
      { id: 's2_27', text: "Ambienti che incoraggiano il dialogo e l'interazione", dimensions: ['S'] },
      { id: 's2_28', text: 'Attività che richiedono competenze tecniche specifiche', dimensions: ['R'] },
      { id: 's2_29', text: "Ambienti che incoraggiano l'uso di strumenti e macchine", dimensions: ['R'] },
      { id: 's2_30', text: "Attività che offrono l'opportunità di sviluppare nuovi modi di fare le cose", dimensions: ['A'] },
      { id: 's2_31', text: 'Ambienti amichevoli dove è possibile condividere le proprie idee', dimensions: ['S'] },
      { id: 's2_32', text: 'Preferibilmente attività amministrative o finanziarie', dimensions: ['C'] },
      { id: 's2_33', text: 'Ambienti che incoraggiano la competizione', dimensions: ['E'] },
      { id: 's2_34', text: 'Ambienti che offrono una fuga dalla routine', dimensions: ['A'] },
      { id: 's2_35', text: 'Ambienti strutturati con orari di lavoro regolari', dimensions: ['C'] },
      { id: 's2_36', text: 'Ambienti strutturati che permettano di portare avanti dei progetti', dimensions: ['E'] },
      { id: 's2_37', text: 'Ambienti che non richiedano di lavorare isolati dagli altri', dimensions: ['S'] },
      { id: 's2_38', text: 'Ambienti che favoriscono il contatto con persone esperte e qualificate', dimensions: ['I'] },
      { id: 's2_39', text: "Attività che vi diano la possibilità di dimostrare le vostre capacità", dimensions: ['E'] },
      { id: 's2_40', text: 'Ambienti non eccessivamente strutturati e con orari di lavoro liberi', dimensions: ['A'] },
      { id: 's2_41', text: "Ambienti basati sull'organizzazione collettiva del lavoro", dimensions: ['S'] },
      { id: 's2_42', text: 'Ambienti che incoraggiano il lavoro cooperativo', dimensions: ['S'] },
      { id: 's2_43', text: 'Ambienti strutturati che offrono attività regolari e stabili', dimensions: ['C'] },
      { id: 's2_44', text: 'Ambienti poco strutturati e che consentono alle persone di organizzare il proprio lavoro', dimensions: ['I'] },
      { id: 's2_45', text: 'Ambienti che si basano su un clima di fiducia', dimensions: ['S'] },
      { id: 's2_46', text: "Ambienti che non richiedono un'eccessiva discussione di gruppo", dimensions: ['R'] },
      { id: 's2_47', text: 'Ambienti che permettono di lavorare da soli', dimensions: ['R'] },
      { id: 's2_48', text: 'Ambienti che non richiedono troppi controlli amministrativi', dimensions: ['A'] },
      { id: 's2_49', text: 'Ambienti che non richiedono troppo lavoro di esecuzione', dimensions: ['I'] },
      { id: 's2_50', text: 'Ambienti che non richiedano troppa competizione tra le persone', dimensions: ['S'] },
      { id: 's2_51', text: 'Ambienti in cui si possa essere riconosciuti per la propria creatività', dimensions: ['A'] },
      { id: 's2_52', text: 'Ambienti che non richiedono troppe discussioni preliminari', dimensions: ['R'] },
      { id: 's2_53', text: 'Ambienti in cui si possa mettere in pratica il proprio estro artistico', dimensions: ['A'] },
      { id: 's2_54', text: 'Ambienti che permettono a tutti di trovare il proprio posto', dimensions: ['C'] },
      { id: 's2_55', text: 'Ambienti che permettono di rischiare', dimensions: ['E'] },
      { id: 's2_56', text: 'Ambienti che permettono di lavorare in un team multidisciplinare', dimensions: ['I'] },
      { id: 's2_57', text: 'Ambienti che permettono di acquisire esperienza pratica', dimensions: ['R'] },
      { id: 's2_58', text: 'Ambienti che sviluppano il senso di leadership del team', dimensions: ['E'] },
      { id: 's2_59', text: 'Ambienti che permettono di mettere a frutto il senso del lavoro di squadra', dimensions: ['S'] },
      { id: 's2_60', text: 'Ambienti in cui si apprendono continuamente cose nuove', dimensions: ['I'] },
    ]
  },
  {
    id: 's3',
    title: 'Questionario N. 3: I Passatempi Preferiti',
    description: 'Scegli i passatempi che preferisci dalla lista.',
    type: 'checklist',
    items: [
      { id: 's3_1', text: 'Partecipare a un incontro politico', dimensions: ['E'] },
      { id: 's3_2', text: 'Ristrutturare una vecchia casa', dimensions: ['R'] },
      { id: 's3_3', text: 'Praticare uno sport di combattimento', dimensions: ['E'] },
      { id: 's3_4', text: 'Giocare a scacchi', dimensions: ['I'] },
      { id: 's3_5', text: 'Partecipare a un evento mondano', dimensions: ['E'] },
      { id: 's3_6', text: 'Assistere a un concerto o visitare una mostra', dimensions: ['A'] },
      { id: 's3_7', text: 'Imparare una lingua straniera', dimensions: ['I'] },
      { id: 's3_8', text: 'Giocare a golf', dimensions: ['E'] },
      { id: 's3_9', text: 'Coltivare piante o fiori', dimensions: ['R'] },
      { id: 's3_10', text: 'Suonare uno strumento o ascoltare musica', dimensions: ['A'] },
      { id: 's3_11', text: 'Fare sport', dimensions: ['R'] },
      { id: 's3_12', text: 'Aiutare gli amici a risolvere i loro problemi', dimensions: ['S'] },
      { id: 's3_13', text: 'Giocare a carte con la famiglia', dimensions: ['S'] },
      { id: 's3_14', text: 'Fare una passeggiata nel bosco', dimensions: ['R'] },
      { id: 's3_15', text: 'Saltare con il paracadute', dimensions: ['E'] },
      { id: 's3_16', text: 'Cercare informazioni su Internet', dimensions: ['I'] },
      { id: 's3_17', text: 'Invitare a cena alcuni amici', dimensions: ['S'] },
      { id: 's3_18', text: 'Leggere un romanzo o una poesia', dimensions: ['A'] },
      { id: 's3_19', text: "Passare una serata a giocare d'azzardo in un casinò", dimensions: ['E'] },
      { id: 's3_20', text: 'Riparare un sistema elettrico o elettronico', dimensions: ['R'] },
      { id: 's3_21', text: 'Fare escursioni in montagna', dimensions: ['R'] },
      { id: 's3_22', text: 'Leggere riviste o libri scientifici', dimensions: ['I'] },
      { id: 's3_23', text: 'Realizzare modelli in scala', dimensions: ['R'] },
      { id: 's3_24', text: 'Divertirsi con gli amici', dimensions: ['S'] },
      { id: 's3_25', text: 'Guardare un documentario in televisione', dimensions: ['I'] },
      { id: 's3_26', text: 'Recitare in uno spettacolo teatrale', dimensions: ['A'] },
      { id: 's3_27', text: 'Dare ripetizioni a studenti in difficoltà', dimensions: ['S'] },
      { id: 's3_28', text: 'Visitare la famiglia', dimensions: ['S'] },
      { id: 's3_29', text: 'Andare a cavallo', dimensions: ['R'] },
      { id: 's3_30', text: 'Collezionare oggetti rari o preziosi', dimensions: ['A'] },
      { id: 's3_31', text: 'Risolvere una disputa familiare o tra vicini', dimensions: ['S'] },
      { id: 's3_32', text: 'Fare un cruciverba', dimensions: ['I'] },
      { id: 's3_33', text: 'Partecipare a una serata di gala', dimensions: ['E'] },
      { id: 's3_34', text: 'Acquistare abiti originali', dimensions: ['A'] },
      { id: 's3_35', text: 'Realizzare i propri abiti', dimensions: ['A'] },
      { id: 's3_36', text: 'Andare in discoteca con gli amici', dimensions: ['S'] },
      { id: 's3_37', text: 'Conoscere nuove persone', dimensions: ['E'] },
      { id: 's3_38', text: 'Ripassare una lezione non compresa', dimensions: ['C'] },
      { id: 's3_39', text: 'Curare la mia contabilità personale', dimensions: ['C'] },
      { id: 's3_40', text: 'Partecipare a conferenze o seminari', dimensions: ['I'] },
      { id: 's3_41', text: "Andare all'estero per il fine settimana", dimensions: ['E'] },
      { id: 's3_42', text: 'Pulire la casa', dimensions: ['C'] },
      { id: 's3_43', text: 'Stare al sole su una spiaggia', dimensions: ['R'] },
      { id: 's3_44', text: 'Scolpire, dipingere o disegnare', dimensions: ['A'] },
      { id: 's3_45', text: 'Prendersi cura dei bambini', dimensions: ['S'] },
      { id: 's3_46', text: 'Cucinare', dimensions: ['R'] },
      { id: 's3_47', text: 'Fare bricolage in casa', dimensions: ['R'] },
      { id: 's3_48', text: 'Parlare con gli artisti', dimensions: ['A'] },
      { id: 's3_49', text: 'Parlare con gli specialisti', dimensions: ['I'] },
      { id: 's3_50', text: 'Andare al cinema con il mio migliore amico', dimensions: ['S'] },
      { id: 's3_51', text: 'Assistere a una sfilata di moda', dimensions: ['A'] },
      { id: 's3_52', text: 'Partecipare a un concorso', dimensions: ['E'] },
      { id: 's3_53', text: 'Imparare a usare software di disegno', dimensions: ['A'] },
      { id: 's3_54', text: 'Partecipare a una riunione scolastica', dimensions: ['S'] },
      { id: 's3_55', text: "Gestire un'associazione", dimensions: ['C'] },
      { id: 's3_56', text: "Lavorare su un'invenzione personale", dimensions: ['I'] },
      { id: 's3_57', text: 'Leggere riviste specializzate', dimensions: ['R'] },
      { id: 's3_58', text: 'Impostare un progetto importante', dimensions: ['E'] },
      { id: 's3_59', text: 'Rivedere le mie lezioni', dimensions: ['C'] },
      { id: 's3_60', text: 'Seguire corsi di formazione', dimensions: ['I'] },
    ]
  },
  {
    id: 's4',
    title: 'Questionario N. 4: I 5 Mestieri dei Tuoi Sogni',
    description: 'Scegli esattamente 5 professioni che vorresti fare o che trovi interessanti.',
    type: 'checklist',
    maxSelection: 5,
    items: [
      { id: 'j1', text: 'Agente assicurativo', dimensions: ['E'] },
      { id: 'j2', text: 'Agente immobiliare', dimensions: ['E'] },
      { id: 'j3', text: 'Analista finanziario', dimensions: ['C'] },
      { id: 'j4', text: 'Analista programmatore', dimensions: ['I'] },
      { id: 'j5', text: 'Architetto', dimensions: ['A'] },
      { id: 'j6', text: 'Avvocato', dimensions: ['E'] },
      { id: 'j7', text: 'Bibliotecario', dimensions: ['C'] },
      { id: 'j8', text: 'Biologo', dimensions: ['I'] },
      { id: 'j9', text: 'Cameraman', dimensions: ['R'] },
      { id: 'j10', text: 'Recruiter', dimensions: ['S'] },
      { id: 'j11', text: 'Addetto alle pubbliche relazioni', dimensions: ['E'] },
      { id: 'j12', text: 'Tassista', dimensions: ['R'] },
      { id: 'j13', text: 'Capo contabile', dimensions: ['C'] },
      { id: 'j14', text: 'Capo cantiere', dimensions: ['R'] },
      { id: 'j15', text: 'Capo reparto', dimensions: ['E'] },
      { id: 'j16', text: 'Pagliaccio', dimensions: ['A'] },
      { id: 'j17', text: 'Comico', dimensions: ['A'] },
      { id: 'j18', text: 'Capitano', dimensions: ['E'] },
      { id: 'j19', text: 'Ragioniere', dimensions: ['C'] },
      { id: 'j20', text: 'Autista di ambulanza', dimensions: ['R'] },
      { id: 'j21', text: 'Consulente educativo principale', dimensions: ['S'] },
      { id: 'j22', text: 'Controllore finanziario', dimensions: ['C'] },
      { id: 'j23', text: 'Costumista', dimensions: ['A'] },
      { id: 'j24', text: 'Stilista di moda', dimensions: ['A'] },
      { id: 'j25', text: 'Cuoco', dimensions: ['R'] },
      { id: 'j26', text: 'Dentista', dimensions: ['R'] },
      { id: 'j27', text: 'Designer', dimensions: ['A'] },
      { id: 'j28', text: 'Dietista', dimensions: ['I'] },
      { id: 'j29', text: 'Scrittore', dimensions: ['A'] },
      { id: 'j30', text: 'Redattore', dimensions: ['A'] },
      { id: 'j31', text: 'Educatore della prima infanzia', dimensions: ['S'] },
      { id: 'j32', text: 'Addestratore di cavalli', dimensions: ['R'] },
      { id: 'j33', text: 'Allenatore sportivo', dimensions: ['S'] },
      { id: 'j34', text: 'Designer grafico', dimensions: ['A'] },
      { id: 'j35', text: 'Orticoltore', dimensions: ['R'] },
      { id: 'j36', text: 'Umorista', dimensions: ['A'] },
      { id: 'j37', text: 'Illustratore', dimensions: ['A'] },
      { id: 'j38', text: 'Stampatore', dimensions: ['R'] },
      { id: 'j39', text: 'Infermiere', dimensions: ['S'] },
      { id: 'j40', text: 'Ingegnere delle telecomunicazioni', dimensions: ['I'] },
      { id: 'j41', text: 'Ispettore fiscale', dimensions: ['C'] },
      { id: 'j42', text: 'Installatore di apparecchiature tecniche', dimensions: ['R'] },
      { id: 'j43', text: 'Interprete', dimensions: ['I'] },
      { id: 'j44', text: 'Giornalista', dimensions: ['A'] },
      { id: 'j45', text: 'Giudice', dimensions: ['E'] },
      { id: 'j46', text: 'Libraio', dimensions: ['C'] },
      { id: 'j47', text: 'Meccanico', dimensions: ['R'] },
      { id: 'j48', text: 'Medico', dimensions: ['I'] },
      { id: 'j49', text: 'Musicista', dimensions: ['A'] },
      { id: 'j50', text: "Proprietario d'azienda", dimensions: ['E'] },
      { id: 'j51', text: 'Paesaggista', dimensions: ['A'] },
      { id: 'j52', text: 'Pilota di aerei', dimensions: ['R'] },
      { id: 'j53', text: 'Insegnante di scuola primaria', dimensions: ['S'] },
      { id: 'j54', text: 'Odontotecnico', dimensions: ['R'] },
      { id: 'j55', text: 'Psicologo', dimensions: ['S'] },
      { id: 'j56', text: 'Rappresentante di commercio', dimensions: ['E'] },
      { id: 'j57', text: 'Responsabile di missioni umanitarie', dimensions: ['S'] },
      { id: 'j58', text: 'Responsabile di un centro ricreativo', dimensions: ['S'] },
      { id: 'j59', text: 'Direttore di filiale di banca', dimensions: ['E'] },
      { id: 'j60', text: 'Responsabile delle esportazioni', dimensions: ['E'] },
      { id: 'j61', text: 'Responsabile della logistica', dimensions: ['C'] },
      { id: 'j62', text: 'Scultore', dimensions: ['A'] },
      { id: 'j63', text: 'Segretario', dimensions: ['C'] },
      { id: 'j64', text: 'Sociologo', dimensions: ['I'] },
      { id: 'j65', text: 'Hostess/Steward', dimensions: ['S'] },
      { id: 'j66', text: 'Tecnico del controllo qualità', dimensions: ['C'] },
      { id: 'j67', text: 'Lavoratore sociale', dimensions: ['S'] },
      { id: 'j68', text: 'Venditore di auto', dimensions: ['E'] },
      { id: 'j69', text: 'Veterinario', dimensions: ['I'] },
      { id: 'j70', text: 'Webmaster', dimensions: ['I'] },
    ]
  }
];

// =============================================================================
// CLIMATE DATA (from data/climateContent.ts)
// =============================================================================

const CLIMATE_SECTIONS = [
  {
    id: 'sec_belonging',
    title: 'Senso di Appartenenza',
    questions: [
      { id: 'bel_1', text: 'Sono orgoglioso quando dico di lavorare presso la mia azienda.' },
      { id: 'bel_2', text: 'Raccomando la mia azienda come un buon posto presso cui lavorare.' },
      { id: 'bel_3', text: 'La mia azienda mi motiva a fare il meglio nel mio lavoro.' }
    ]
  },
  {
    id: 'sec_org_change',
    title: 'Organizzazione e Cambiamento',
    questions: [
      { id: 'org_1', text: 'Complessivamente ho fiducia nelle scelte dei dirigenti.' },
      { id: 'org_2', text: 'I processi di cambiamento sono gestiti al meglio.' },
      { id: 'org_3', text: 'In azienda è facile avere le informazioni di cui si ha bisogno.' },
      { id: 'org_4', text: 'I compiti e i ruoli organizzativi sono ben definiti.' }
    ]
  },
  {
    id: 'sec_my_job',
    title: 'Il Mio Lavoro',
    questions: [
      { id: 'job_1', text: 'Il mio lavoro è sufficientemente interessante.' },
      { id: 'job_2', text: 'Ho la possibilità di scegliere come svolgere il mio lavoro (autonomia).' },
      { id: 'job_3', text: 'Il mio orario di lavoro è funzionale per un buon equilibrio tra lavoro e vita privata.' }
    ]
  },
  {
    id: 'sec_remuneration',
    title: 'La Mia Remunerazione',
    questions: [
      { id: 'rem_1', text: 'Il mio stipendio rispecchia il livello della mia prestazione.' },
      { id: 'rem_2', text: 'Il mio stipendio è ragionevole se paragonato a posizioni simili in altre organizzazioni.' }
    ]
  },
  {
    id: 'sec_boss',
    title: 'Rapporto con il Capo',
    questions: [
      { id: 'boss_1', text: 'Il mio capo è aperto alle idee che propongo.' },
      { id: 'boss_2', text: 'Ricevo dal mio capo riscontri (feedback) regolari sul mio lavoro.' },
      { id: 'boss_3', text: 'Il mio capo gestisce in modo equo le persone.' }
    ]
  },
  {
    id: 'sec_unit',
    title: 'La Mia Unità (Team)',
    questions: [
      { id: 'unit_1', text: 'Le persone nella mia unità possono contare su un aiuto reciproco in caso di difficoltà.' },
      { id: 'unit_2', text: 'Le persone della mia unità lavorano insieme per trovare il modo migliore di lavorare.' }
    ]
  },
  {
    id: 'sec_responsibility',
    title: 'Responsabilità',
    questions: [
      { id: 'resp_1', text: 'Ho autonomia nel prendere decisioni nel mio lavoro.' },
      { id: 'resp_2', text: 'Mi sento responsabile dei risultati del mio team.' }
    ]
  },
  {
    id: 'sec_human',
    title: 'Aspetto Umano',
    questions: [
      { id: 'hum_1', text: "L'ambiente lavorativo è accogliente e positivo." },
      { id: 'hum_2', text: 'Mi sento rispettato/a e ascoltato/a dai colleghi.' }
    ]
  },
  {
    id: 'sec_identity',
    title: 'Identità',
    questions: [
      { id: 'ident_1', text: "Condivido i valori e la mission dell'organizzazione." },
      { id: 'ident_2', text: 'Mi sento parte integrante di questa azienda.' }
    ]
  }
];

const CLIMATE_DIMENSIONS = [
  { code: 'belonging', label: 'Senso di Appartenenza', color: '#10B981' },
  { code: 'org_change', label: 'Organizzazione e Cambiamento', color: '#6366F1' },
  { code: 'my_job', label: 'Il Mio Lavoro', color: '#F59E0B' },
  { code: 'remuneration', label: 'La Mia Remunerazione', color: '#EC4899' },
  { code: 'boss', label: 'Rapporto con il Capo', color: '#EF4444' },
  { code: 'unit', label: 'La Mia Unità (Team)', color: '#8B5CF6' },
  { code: 'responsibility', label: 'Responsabilità', color: '#14B8A6' },
  { code: 'human', label: 'Aspetto Umano', color: '#F97316' },
  { code: 'identity', label: 'Identità', color: '#06B6D4' },
];

// =============================================================================
// MIGRATION LOGIC
// =============================================================================

interface MigrationResult {
  success: boolean;
  questionnaireId?: string;
  sectionsCreated: number;
  questionsCreated: number;
  optionsCreated: number;
  dimensionsCreated: number;
  weightsCreated: number;
  error?: string;
}

async function migrateRiasec(supabase: any): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    sectionsCreated: 0,
    questionsCreated: 0,
    optionsCreated: 0,
    dimensionsCreated: 0,
    weightsCreated: 0
  };

  try {
    // Check if RIASEC already exists
    const { data: existing } = await supabase
      .from('questionnaires')
      .select('id')
      .eq('slug', 'riasec-vocational')
      .single();

    if (existing) {
      console.log('RIASEC questionnaire already exists, skipping...');
      result.success = true;
      result.questionnaireId = existing.id;
      return result;
    }

    // Create questionnaire
    const { data: questionnaire, error: qError } = await supabase
      .from('questionnaires')
      .insert({
        slug: 'riasec-vocational',
        title: 'Test RIASEC - Orientamento Vocazionale',
        description: 'Il test RIASEC è uno strumento di autovalutazione che ti aiuta a comprendere le tue preferenze professionali e a individuare i settori lavorativi più affini alla tua personalità.',
        ui_style: 'step',
        is_published: true,
        is_system: true,
        version: 1,
        config: {
          showProgress: true,
          allowSkip: false,
          randomizeSections: false,
          randomizeQuestions: false,
          completionMessage: 'Grazie per aver completato il test RIASEC! I tuoi risultati sono pronti.'
        }
      })
      .select()
      .single();

    if (qError) throw qError;
    result.questionnaireId = questionnaire.id;
    console.log('Created RIASEC questionnaire:', questionnaire.id);

    // Create dimensions
    const dimensionMap: Record<string, string> = {};
    for (let i = 0; i < RIASEC_DIMENSIONS.length; i++) {
      const dim = RIASEC_DIMENSIONS[i];
      const { data: dimension, error: dError } = await supabase
        .from('scoring_dimensions')
        .insert({
          questionnaire_id: questionnaire.id,
          code: dim.code,
          label: dim.label,
          description: dim.description,
          color: dim.color,
          sort_order: i
        })
        .select()
        .single();

      if (dError) throw dError;
      dimensionMap[dim.code] = dimension.id;
      result.dimensionsCreated++;
    }
    console.log('Created RIASEC dimensions:', result.dimensionsCreated);

    // Create sections, questions, options, and weights
    for (let sIdx = 0; sIdx < RIASEC_SECTIONS.length; sIdx++) {
      const section = RIASEC_SECTIONS[sIdx];
      
      const { data: dbSection, error: sError } = await supabase
        .from('questionnaire_sections')
        .insert({
          questionnaire_id: questionnaire.id,
          title: section.title,
          description: section.description,
          section_type: section.type,
          sort_order: sIdx,
          config: section.maxSelection ? { maxSelection: section.maxSelection } : {}
        })
        .select()
        .single();

      if (sError) throw sError;
      result.sectionsCreated++;

      // Handle forced_choice questions
      if (section.type === 'forced_choice' && section.questions) {
        for (let qIdx = 0; qIdx < section.questions.length; qIdx++) {
          const question = section.questions[qIdx];
          
          const { data: dbQuestion, error: qError } = await supabase
            .from('questions')
            .insert({
              section_id: dbSection.id,
              question_text: question.text,
              question_type: 'single_choice',
              is_required: true,
              sort_order: qIdx
            })
            .select()
            .single();

          if (qError) throw qError;
          result.questionsCreated++;

          // Create options
          for (let oIdx = 0; oIdx < question.options.length; oIdx++) {
            const option = question.options[oIdx];
            
            const { data: dbOption, error: oError } = await supabase
              .from('question_options')
              .insert({
                question_id: dbQuestion.id,
                option_text: option.text,
                sort_order: oIdx
              })
              .select()
              .single();

            if (oError) throw oError;
            result.optionsCreated++;

            // Create scoring weights
            for (const dimCode of option.dimensions) {
              if (dimensionMap[dimCode]) {
                const { error: wError } = await supabase
                  .from('scoring_dimension_weights')
                  .insert({
                    option_id: dbOption.id,
                    dimension_id: dimensionMap[dimCode],
                    weight: 1
                  });

                if (wError) throw wError;
                result.weightsCreated++;
              }
            }
          }
        }
      }

      // Handle checklist items
      if (section.type === 'checklist' && section.items) {
        for (let iIdx = 0; iIdx < section.items.length; iIdx++) {
          const item = section.items[iIdx];
          
          // For checklist, each item is a binary question
          const { data: dbQuestion, error: qError } = await supabase
            .from('questions')
            .insert({
              section_id: dbSection.id,
              question_text: item.text,
              question_type: 'binary',
              is_required: false,
              sort_order: iIdx
            })
            .select()
            .single();

          if (qError) throw qError;
          result.questionsCreated++;

          // Create YES option with scoring weights
          const { data: yesOption, error: yError } = await supabase
            .from('question_options')
            .insert({
              question_id: dbQuestion.id,
              option_text: 'Sì',
              sort_order: 0
            })
            .select()
            .single();

          if (yError) throw yError;
          result.optionsCreated++;

          // Add weights for YES option
          for (const dimCode of item.dimensions) {
            if (dimensionMap[dimCode]) {
              const { error: wError } = await supabase
                .from('scoring_dimension_weights')
                .insert({
                  option_id: yesOption.id,
                  dimension_id: dimensionMap[dimCode],
                  weight: 1
                });

              if (wError) throw wError;
              result.weightsCreated++;
            }
          }

          // Create NO option (no weights)
          const { error: nError } = await supabase
            .from('question_options')
            .insert({
              question_id: dbQuestion.id,
              option_text: 'No',
              sort_order: 1
            });

          if (nError) throw nError;
          result.optionsCreated++;
        }
      }
    }

    console.log('RIASEC migration complete:', result);
    result.success = true;
    return result;

  } catch (error) {
    console.error('RIASEC migration error:', error);
    result.error = error instanceof Error ? error.message : 'Unknown error';
    return result;
  }
}

async function migrateClimate(supabase: any): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    sectionsCreated: 0,
    questionsCreated: 0,
    optionsCreated: 0,
    dimensionsCreated: 0,
    weightsCreated: 0
  };

  try {
    // Check if Climate already exists
    const { data: existing } = await supabase
      .from('questionnaires')
      .select('id')
      .eq('slug', 'climate-survey')
      .single();

    if (existing) {
      console.log('Climate survey already exists, skipping...');
      result.success = true;
      result.questionnaireId = existing.id;
      return result;
    }

    // Create questionnaire
    const { data: questionnaire, error: qError } = await supabase
      .from('questionnaires')
      .insert({
        slug: 'climate-survey',
        title: 'Survey Clima Organizzativo',
        description: 'Questionario per valutare il clima organizzativo aziendale attraverso diverse dimensioni chiave.',
        ui_style: 'step',
        is_published: true,
        is_system: true,
        version: 1,
        config: {
          showProgress: true,
          allowSkip: false,
          randomizeSections: false,
          randomizeQuestions: false,
          completionMessage: 'Grazie per aver completato il questionario sul clima organizzativo!'
        }
      })
      .select()
      .single();

    if (qError) throw qError;
    result.questionnaireId = questionnaire.id;
    console.log('Created Climate questionnaire:', questionnaire.id);

    // Create dimensions
    const dimensionMap: Record<string, string> = {};
    for (let i = 0; i < CLIMATE_DIMENSIONS.length; i++) {
      const dim = CLIMATE_DIMENSIONS[i];
      const { data: dimension, error: dError } = await supabase
        .from('scoring_dimensions')
        .insert({
          questionnaire_id: questionnaire.id,
          code: dim.code,
          label: dim.label,
          color: dim.color,
          sort_order: i
        })
        .select()
        .single();

      if (dError) throw dError;
      dimensionMap[dim.code] = dimension.id;
      result.dimensionsCreated++;
    }
    console.log('Created Climate dimensions:', result.dimensionsCreated);

    // Map section IDs to dimension codes
    const sectionToDimension: Record<string, string> = {
      'sec_belonging': 'belonging',
      'sec_org_change': 'org_change',
      'sec_my_job': 'my_job',
      'sec_remuneration': 'remuneration',
      'sec_boss': 'boss',
      'sec_unit': 'unit',
      'sec_responsibility': 'responsibility',
      'sec_human': 'human',
      'sec_identity': 'identity'
    };

    // Create sections and questions
    for (let sIdx = 0; sIdx < CLIMATE_SECTIONS.length; sIdx++) {
      const section = CLIMATE_SECTIONS[sIdx];
      const dimensionCode = sectionToDimension[section.id];
      
      const { data: dbSection, error: sError } = await supabase
        .from('questionnaire_sections')
        .insert({
          questionnaire_id: questionnaire.id,
          title: section.title,
          section_type: 'likert',
          sort_order: sIdx
        })
        .select()
        .single();

      if (sError) throw sError;
      result.sectionsCreated++;

      // Create questions (Likert 1-5)
      for (let qIdx = 0; qIdx < section.questions.length; qIdx++) {
        const question = section.questions[qIdx];
        
        const { data: dbQuestion, error: qError } = await supabase
          .from('questions')
          .insert({
            section_id: dbSection.id,
            question_text: question.text,
            question_type: 'likert',
            is_required: true,
            sort_order: qIdx
          })
          .select()
          .single();

        if (qError) throw qError;
        result.questionsCreated++;

        // Create Likert options (1-5)
        const likertLabels = [
          'Per nulla d\'accordo',
          'Poco d\'accordo',
          'Neutrale',
          'D\'accordo',
          'Completamente d\'accordo'
        ];

        for (let lIdx = 0; lIdx < 5; lIdx++) {
          const { data: dbOption, error: oError } = await supabase
            .from('question_options')
            .insert({
              question_id: dbQuestion.id,
              option_text: likertLabels[lIdx],
              sort_order: lIdx,
              metadata: { likertValue: lIdx + 1 }
            })
            .select()
            .single();

          if (oError) throw oError;
          result.optionsCreated++;

          // Add weight to dimension (weight = likert value)
          if (dimensionCode && dimensionMap[dimensionCode]) {
            const { error: wError } = await supabase
              .from('scoring_dimension_weights')
              .insert({
                option_id: dbOption.id,
                dimension_id: dimensionMap[dimensionCode],
                weight: lIdx + 1
              });

            if (wError) throw wError;
            result.weightsCreated++;
          }
        }
      }
    }

    console.log('Climate migration complete:', result);
    result.success = true;
    return result;

  } catch (error) {
    console.error('Climate migration error:', error);
    result.error = error instanceof Error ? error.message : 'Unknown error';
    return result;
  }
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    console.log('Starting legacy tests migration...');

    // Run migrations
    const riasecResult = await migrateRiasec(supabase);
    const climateResult = await migrateClimate(supabase);

    const response = {
      success: riasecResult.success && climateResult.success,
      riasec: riasecResult,
      climate: climateResult,
      message: 'Migration completed'
    };

    console.log('Migration results:', response);

    return new Response(JSON.stringify(response, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.success ? 200 : 500
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
