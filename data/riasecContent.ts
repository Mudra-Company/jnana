import { RiasecDimension, JobDatabase, TestSection } from '../types';

interface PoleContent {
  title: string;
  description: string;
  traits: string;
  quotes: string[];
}

export const RIASEC_DESCRIPTIONS: Record<RiasecDimension, PoleContent> = {
  R: {
    title: "IL POLO REALISTICO",
    description: "Le persone che appartengono al polo Realistico prediligono attività concrete, pratiche e fisiche. Amano utilizzare il proprio corpo, manipolare oggetti, utensili, macchinari o lavorare a contatto con la natura e gli animali. Hanno un approccio pragmatico alla vita: preferiscono vedere risultati tangibili del loro lavoro piuttosto che perdersi in speculazioni astratte o discussioni teoriche. Spesso dotate di buona coordinazione e manualità, queste persone apprezzano la chiarezza e l'autonomia operativa. Possono apparire riservate, franche e dirette nelle interazioni, evitando le complessità emotive o diplomatiche. In ambito professionale, cercano ruoli che offrano stabilità, compiti definiti e la possibilità di agire direttamente sulla realtà materiale.",
    traits: "Pratici, concreti, franchi, riservati, naturali, persistenti, costanti, autentici.",
    quotes: [
      "Ho bisogno di essere in forma per dare il meglio di me e spesso vado a dormire presto.",
      "Prendo a cuore il mio lavoro. All’inizio dei miei studi, avevo costantemente bisogno di fare bene e di essere apprezzato dai miei professori.",
      "Spesso sono le discussioni che ci fanno perdere tempo.",
      "L’astuzia è spesso mille volte più efficace che i grandi ragionamenti che ci insegna la scuola."
    ]
  },
  I: {
    title: "IL POLO INVESTIGATIVO",
    description: "Le persone con dominante Investigativa sono guidate da una profonda curiosità intellettuale e dal desiderio di comprendere il 'perché' e il 'come' delle cose. Amano osservare, apprendere, analizzare e risolvere problemi complessi attraverso la logica e il metodo scientifico. Sono spesso introspettive, indipendenti e orientate al pensiero astratto. Non amano le regole rigide o i compiti puramente ripetitivi che non stimolano la loro mente. Nel lavoro, ricercano autonomia per esplorare idee, condurre ricerche o sviluppare nuove competenze. Tendono a essere critiche, razionali e precise, preferendo il confronto intellettuale alle dinamiche puramente sociali o persuasive.",
    traits: "Analitici, curiosi, indipendenti, intellettuali, precisi, razionali, critici, introspettivi.",
    quotes: [
      "L’importante per me, è che ci sia nel lavoro sempre qualcosa di nuovo, qualcosa da imparare.",
      "Tutto si evolve, è questo che mi permette di apprendere sempre. Io lo adoro.",
      "Più conosciamo, più impariamo modi di fare, più si abbiamo voglia di continuare a imparare.",
      "Non mi interessa ciò che pensano gli altri sul mio modo di lavorare. L’importante per me, è capire come fare bene il mio lavoro."
    ]
  },
  A: {
    title: "IL POLO ARTISTICO",
    description: "Il polo Artistico raccoglie persone che sentono l'esigenza di esprimere la propria individualità e creatività. Sono intuitive, originali, espressive e spesso non conformiste. Amano le attività che permettono di creare qualcosa di nuovo o di interpretare la realtà attraverso l'arte, la scrittura, il design o la performance. Si sentono soffocate in ambienti altamente strutturati, burocratici o routinari. Per loro il lavoro è un'estensione della propria personalità; cercano contesti flessibili che valorizzino l'immaginazione, l'estetica e l'innovazione. Nelle relazioni sono spesso emotive e sensibili, capaci di cogliere sfumature che ad altri sfuggono.",
    traits: "Creativi, immaginativi, intuitivi, originali, sensibili, espressivi, ideali, non conformisti.",
    quotes: [
      "La cosa più difficile per me è sapere che posso creare qualcosa di veramente interessante sul lavoro ma di non avere nessuna esperienza per dimostrarlo.",
      "Il lavoro indipendente permette di lasciare spazio all’immaginazione, alla sua iniziativa.",
      "E’ veramente il mio sogno: avere libertà totale sul mio lavoro; essere giudicato solo sui risultati.",
      "Non comprendo assolutamente il mio capo. Né il suo modo di fare, né il suo modo di essere."
    ]
  },
  S: {
    title: "IL POLO SOCIALE",
    description: "Le persone con una forte natura Sociale trovano la loro massima realizzazione nelle attività che richiedono il contatto umano, la cooperazione e l'aiuto al prossimo. Sono empatiche, comunicative, comprensive e responsabili. Amano insegnare, curare, informare o formare gli altri. Preferiscono risolvere i problemi attraverso il dialogo e la cooperazione piuttosto che con l'uso di strumenti o analisi fredde. Amano lavorare in team e sentono il bisogno di armonia relazionale. Evitano contesti lavorativi che richiedono isolamento o attività meccaniche prive di contatto umano. Sono spesso abili nel comprendere i sentimenti altrui e nel creare un clima di supporto e accoglienza.",
    traits: "Cooperativi, amichevoli, generosi, empatici, persuasivi, pazienti, responsabili, calorosi.",
    quotes: [
      "E’ molto raro che non riesco a trovarmi bene con qualcuno. Forse perché non cerco mai di giudicare, preferisco cercare di comprendere.",
      "Il problema in un gruppo è che nessuno ti apprezza forzatamente. A volte ciò mi porta a perdere fiducia in me.",
      "In ufficio ognuno sta per conto suo. E’ veramente triste. Secondo me un ambiente di lavoro piacevole, è quello che permette di mostrare il meglio di se."
    ]
  },
  E: {
    title: "IL POLO INTRAPRENDENTE",
    description: "Le persone Intraprendenti sono energiche, ambiziose e sicure di sé. Amano assumere ruoli di leadership, persuadere gli altri e gestire progetti o persone per raggiungere obiettivi organizzativi o economici. Sono motivate dal successo, dallo status, dal guadagno e dalla possibilità di influenzare l'ambiente circostante. Amano la competizione e vedono i problemi come sfide da vincere. Preferiscono l'azione e la presa di decisione rapida rispetto all'analisi prolungata o alla teoria. Spesso possiedono ottime capacità oratorie e sanno 'vendere' le proprie idee. Tendono a evitare attività che richiedono troppa pazienza, osservazione passiva o precisione meticolosa senza visibilità.",
    traits: "Energici, ambiziosi, dominanti, ottimisti, socievoli, sicuri di sé, intraprendenti.",
    quotes: [
      "Per me il lavoro è competizione e il guadagno ha una grande importanza.",
      "La mia più grande paura è restare fisso in un posto, e non avere prospettive di crescita.",
      "Nella società ho scoperto la mia vera vocazione durante il mio stage: convincere anche i meno convinti che è questo il prodotto di cui hanno bisogno."
    ]
  },
  C: {
    title: "IL POLO CONVENZIONALE",
    description: "Il polo Convenzionale descrive persone che apprezzano l'ordine, la struttura e la chiarezza. Sono metodiche, organizzate, precise e affidabili. Amano lavorare con dati, numeri e procedure definite, garantendo che tutto funzioni secondo i piani stabiliti. Si trovano a proprio agio in ambienti gerarchici dove le aspettative sono chiare e le regole ben definite. Evitano situazioni ambigue, destrutturate o che richiedono eccessiva improvvisazione. Sono custodi dell'efficienza e della qualità, eccellendo nella gestione amministrativa, contabile e nel controllo dei processi. La loro forza risiede nella costanza e nell'attenzione al dettaglio.",
    traits: "Metodici, organizzati, precisi, efficienti, dogmatici, conformisti, prudenti.",
    quotes: [
      "Una volta entrata nella mia azienda, mi sono accorta che tutto quello che abbiamo imparato sui banchi di scuola non era veramente il metodo migliore.",
      "All’inizio, ero piuttosto persa, non capivo del tutto come funzionavano le cose. Adesso va meglio, mi sono adattata.",
      "Quello che non amo del mio lavoro è che abbiamo un capo che non sa sempre quello che vuole."
    ]
  }
};

export const RIASEC_PAIRS: Record<string, string> = {
  "IR": "Ci sono persone che amano lavorare nello sviluppo di nuovi prodotti. Hanno un grande rispetto per tutte le forme di insegnamento e amano essere in contatto con specialisti. Sono attratte dai problemi concreti e cercano risultati tangibili.",
  "AR": "Queste sono persone che amano creare con le loro mani e, in generale, che preferiscono le attività creative utilizzando oggetti, utensili, e materiali concreti.",
  "RS": "Persone che preferiscono lavorare nel campo dell’organizzazione pratica o nelle attività sportive. Amano aiutare gli altri attraverso azioni concrete piuttosto che con le parole.",
  "ER": "Ci sono persone che possono dirigere gruppi operativi, sapendo che la loro preferenza è diretta verso squadre che svolgono compiti pratici e tangibili.",
  "CR": "Persone particolarmente stabili dallo spirito pratico. Hanno bisogno di obiettivi chiari e amano pianificare la loro giornata di lavoro senza imprevisti.",
  "AI": "Persone che non si trovano bene negli ambienti troppo conformisti. Sono molto creative e legano l'immaginazione all'intellettualismo. Amano il design e l'innovazione concettuale.",
  "IS": "Persone ottimiste e positive, interessate ai comportamenti umani più che alle teorie astratte. Preferiscono piccoli gruppi per trovare soluzioni ai problemi.",
  "EI": "Persone rare che associano la riflessione all'azione. Molto apprezzate nella ricerca applicata, nel marketing strategico e nello sviluppo prodotti.",
  "CI": "Persone che hanno bisogno di riconoscimenti nel loro campo di specializzazione. Molto dotate per le previsioni, gli studi statistici e il calcolo dei rischi.",
  "AS": "Persone che amano utilizzare le loro intuizioni e le loro emozioni per aiutare gli altri. Sognano spesso che il mondo cambi e sono poco motivate dal solo denaro.",
  "AE": "Persone espressive e indipendenti che amano gli ambienti dove possono agire senza troppi vincoli. Ricercano la performance individuale e la vendita creativa.",
  "AC": "Persone che sanno utilizzare la loro immaginazione per mettere a punto metodi di lavoro più efficaci. Uniscono creatività e rigore organizzativo.",
  "ES": "Persone che amano gestire una squadra o dirigere un'impresa. Sono a loro agio nelle relazioni umane e sanno vendere idee, servizi o prodotti con entusiasmo.",
  "CS": "Persone che amano i lavori di squadra con obiettivi definiti. Apprezzate nella comunicazione interna e organizzativa. Amano compiti di fiducia che necessitano precisione.",
  "CE": "Persone che amano i risultati tangibili e quantificabili. Molto dotate per la gestione finanziaria e organizzativa. Amano prendere decisioni e avere il controllo."
};

// Aliases for compatibility
export const POLE_CONTENT = RIASEC_DESCRIPTIONS;
export const COMBINATION_CONTENT = RIASEC_PAIRS;

export const RIASEC_QUESTIONNAIRE: TestSection[] = [
  {
    id: 's1',
    title: 'Questionario N. 1: Il modo di essere',
    description: 'Ecco 30 situazioni quotidiane. Scegli l\'affermazione che ti descrive meglio. Se nessuna ti definisce completamente, scegli quella che si avvicina di più.',
    type: 'forced_choice',
    questions: [
      {
        id: 'q1',
        text: 'Quello che detesto di più',
        options: [
          { id: 'q1_A', text: 'Lavorare da solo', impactDimensions: ['S', 'C'] }, // PDF: C(S), M(C)
          { id: 'q1_B', text: 'Parlare di me', impactDimensions: ['R', 'I'] }     // PDF: T(R), R(I)
        ]
      },
      {
        id: 'q2',
        text: 'Io preferisco',
        options: [
          { id: 'q2_A', text: 'Agire prima, riflettere dopo', impactDimensions: ['E'] }, // PDF: A(E)
          { id: 'q2_B', text: 'Riflettere prima di agire', impactDimensions: ['I'] }     // PDF: R(I)
        ]
      },
      {
        id: 'q3',
        text: 'In un gruppo, io amo',
        options: [
          { id: 'q3_A', text: 'Prendere l\'iniziativa', impactDimensions: ['E'] }, // PDF: A(E)
          { id: 'q3_B', text: 'Portare nuove idee', impactDimensions: ['A'] }      // PDF: I(A)
        ]
      },
      {
        id: 'q4',
        text: 'Il mio divertimento preferito',
        options: [
          { id: 'q4_A', text: 'Cercare informazioni su internet', impactDimensions: ['I'] }, // PDF: R(I)
          { id: 'q4_B', text: 'Partecipare a una festa', impactDimensions: ['E'] }           // PDF: A(E)
        ]
      },
      {
        id: 'q5',
        text: 'Mi dicono che sono',
        options: [
          { id: 'q5_A', text: 'Una persona terra-terra', impactDimensions: ['R'] }, // PDF: T(R)
          { id: 'q5_B', text: 'Un sognatore', impactDimensions: ['A'] }             // PDF: I(A)
        ]
      },
      {
        id: 'q6',
        text: 'Se ne ho la possibilità',
        options: [
          { id: 'q6_A', text: 'Mi godo una boccata d\'aria fresca', impactDimensions: ['R'] }, // PDF: T(R)
          { id: 'q6_B', text: 'Passo il tempo con gli amici', impactDimensions: ['S'] }        // PDF: C(S)
        ]
      },
      {
        id: 'q7',
        text: 'Sono molto attirato da',
        options: [
          { id: 'q7_A', text: 'La gestione', impactDimensions: ['C'] }, // PDF: M(C)
          { id: 'q7_B', text: 'La filosofia', impactDimensions: ['A'] } // PDF: I(A)
        ]
      },
      {
        id: 'q8',
        text: 'Preferisco le persone',
        options: [
          { id: 'q8_A', text: 'Intraprendenti', impactDimensions: ['E'] }, // PDF: A(E)
          { id: 'q8_B', text: 'Riflessive', impactDimensions: ['I'] }      // PDF: R(I)
        ]
      },
      {
        id: 'q9',
        text: 'La cosa che mi definisce meglio',
        options: [
          { id: 'q9_A', text: 'Il mio senso dell\'organizzazione', impactDimensions: ['C'] }, // PDF: M(C)
          { id: 'q9_B', text: 'Il mio senso estetico', impactDimensions: ['A'] }              // PDF: I(A)
        ]
      },
      {
        id: 'q10',
        text: 'In una situazione di crisi',
        options: [
          { id: 'q10_A', text: 'La fronteggio', impactDimensions: ['R', 'E'] }, // PDF: T(R), A(E)
          { id: 'q10_B', text: 'Tendo a perdere la calma', impactDimensions: [] } // PDF: 0 points
        ]
      },
      {
        id: 'q11',
        text: 'Il mio passatempo preferito',
        options: [
          { id: 'q11_A', text: 'Aiutare gli altri', impactDimensions: ['S'] }, // PDF: C(S)
          { id: 'q11_B', text: 'Risolvere problemi complicati', impactDimensions: ['I'] } // PDF: R(I)
        ]
      },
      {
        id: 'q12',
        text: 'Preferisco',
        options: [
          { id: 'q12_A', text: 'Fare bricolage', impactDimensions: ['R'] }, // PDF: T(R)
          { id: 'q12_B', text: 'Incontrare gli amici', impactDimensions: ['S'] } // PDF: C(S)
        ]
      },
      {
        id: 'q13',
        text: 'Ciò che mi stimola di più',
        options: [
          { id: 'q13_A', text: 'I problemi complicati da risolvere', impactDimensions: ['I'] }, // PDF: R(I)
          { id: 'q13_B', text: 'Confrontarmi con gli altri', impactDimensions: ['S'] } // PDF: C(S)
        ]
      },
      {
        id: 'q14',
        text: 'Gli altri dicono che sono',
        options: [
          { id: 'q14_A', text: 'Utile', impactDimensions: ['S'] }, // PDF: C(S)
          { id: 'q14_B', text: 'Coscienzioso', impactDimensions: ['C'] } // PDF: M(C)
        ]
      },
      {
        id: 'q15',
        text: 'Sono attirato da',
        options: [
          { id: 'q15_A', text: 'Le attività tecniche', impactDimensions: ['R'] }, // PDF: T(R)
          { id: 'q15_B', text: 'Tutto ciò che riguarda l\'immaginazione', impactDimensions: ['A'] } // PDF: I(A)
        ]
      },
      {
        id: 'q16',
        text: 'Per me, il modo migliore di agire è',
        options: [
          { id: 'q16_A', text: 'Comunicare con gli altri', impactDimensions: ['S'] }, // PDF: C(S)
          { id: 'q16_B', text: 'Avere un\'organizzazione personale impeccabile', impactDimensions: ['C'] } // PDF: M(C)
        ]
      },
      {
        id: 'q17',
        text: 'L\'aggettivo che mi definisce meglio',
        options: [
          { id: 'q17_A', text: 'Autoritario', impactDimensions: ['E'] }, // PDF: A(E)
          { id: 'q17_B', text: 'Originale', impactDimensions: ['A'] } // PDF: I(A)
        ]
      },
      {
        id: 'q18',
        text: 'Il mio punto debole',
        options: [
          { id: 'q18_A', text: 'Non amo prendere parola', impactDimensions: ['R'] }, // PDF: T(R)
          { id: 'q18_B', text: 'Mi piace stare sotto i riflettori', impactDimensions: ['E'] } // PDF: A(E)
        ]
      },
      {
        id: 'q19',
        text: 'Per me è più importante',
        options: [
          { id: 'q19_A', text: 'Lavorare in gruppo', impactDimensions: ['S'] }, // PDF: C(S)
          { id: 'q19_B', text: 'Imparare continuamente cose nuove', impactDimensions: ['I'] } // PDF: R(I)
        ]
      },
      {
        id: 'q20',
        text: 'Trovo la soluzione a un problema',
        options: [
          { id: 'q20_A', text: 'Applicando un metodo', impactDimensions: ['C'] }, // PDF: M(C)
          { id: 'q20_B', text: 'Per deduzione logica', impactDimensions: ['I'] } // PDF: R(I)
        ]
      },
      {
        id: 'q21',
        text: 'Per lavorare bene, ho bisogno di',
        options: [
          { id: 'q21_A', text: 'Un buon clima di fiducia', impactDimensions: ['S'] }, // PDF: C(S)
          { id: 'q21_B', text: 'Avere obiettivi definiti in modo chiaro', impactDimensions: ['C'] } // PDF: M(C)
        ]
      },
      {
        id: 'q22',
        text: 'Per lavorare meglio, ho bisogno di',
        options: [
          { id: 'q22_A', text: 'Calma', impactDimensions: ['A'] }, // PDF: I(A)
          { id: 'q22_B', text: 'Materie o argomenti interessanti', impactDimensions: ['C'] } // PDF: M(C)
        ]
      },
      {
        id: 'q23',
        text: 'Ciò che amo di più',
        options: [
          { id: 'q23_A', text: 'Conoscere gente nuova', impactDimensions: ['S'] }, // PDF: C(S)
          { id: 'q23_B', text: 'Fare una passeggiata solitaria', impactDimensions: ['R'] } // PDF: T(R)
        ]
      },
      {
        id: 'q24',
        text: 'Ho un grande bisogno di',
        options: [
          { id: 'q24_A', text: 'Lavorare su cose concrete', impactDimensions: ['R'] }, // PDF: T(R)
          { id: 'q24_B', text: 'Usare la mia creatività', impactDimensions: ['A'] } // PDF: I(A)
        ]
      },
      {
        id: 'q25',
        text: 'Sono piuttosto',
        options: [
          { id: 'q25_A', text: 'Riflessivo', impactDimensions: ['I'] }, // PDF: R(I)
          { id: 'q25_B', text: 'Metodico', impactDimensions: ['C'] } // PDF: M(C)
        ]
      },
      {
        id: 'q26',
        text: 'Ciò che mi motiva è',
        options: [
          { id: 'q26_A', text: 'La novità', impactDimensions: ['A'] }, // PDF: I(A)
          { id: 'q26_B', text: 'La riuscita', impactDimensions: ['E'] } // PDF: A(E)
        ]
      },
      {
        id: 'q27',
        text: 'Personalmente, penso che',
        options: [
          { id: 'q27_A', text: 'Le regole, spesso, impediscono di avanzare', impactDimensions: ['A'] }, // PDF: I(A)
          { id: 'q27_B', text: 'Senza qualche regola, è impossibile avere efficacia', impactDimensions: ['C'] } // PDF: M(C)
        ]
      },
      {
        id: 'q28',
        text: 'In una squadra, io sono',
        options: [
          { id: 'q28_A', text: 'Il leader', impactDimensions: ['E'] }, // PDF: A(E)
          { id: 'q28_B', text: 'Il pensatore', impactDimensions: ['I'] } // PDF: R(I)
        ]
      },
      {
        id: 'q29',
        text: 'Penso di essere piuttosto',
        options: [
          { id: 'q29_A', text: 'Introverso', impactDimensions: ['R'] }, // PDF: T(R)
          { id: 'q29_B', text: 'Estroverso', impactDimensions: ['E'] } // PDF: A(E)
        ]
      },
      {
        id: 'q30',
        text: 'Per organizzarmi meglio, ho bisogno di',
        options: [
          { id: 'q30_A', text: 'Sapere cosa ci si aspetta da me', impactDimensions: ['C'] }, // PDF: M(C)
          { id: 'q30_B', text: 'Avere un certo grado di autonomia', impactDimensions: ['I'] } // PDF: R(I)
        ]
      }
    ]
  },
  {
    id: 's2',
    title: 'Questionario N. 2: Gli Ambienti Preferiti',
    description: 'Scegli le attività che preferisci. Seleziona tutte le voci che ti corrispondono.',
    type: 'checklist',
    items: [
      { id: 's2_1', text: 'Le attività che favoriscono il lavoro in gruppo', impactDimensions: ['S'] }, 
      { id: 's2_2', text: 'Le attività che favoriscono le competenze manuali e le capacità fisiche', impactDimensions: ['R'] }, 
      { id: 's2_3', text: 'Le attività dove posso prendere decisioni', impactDimensions: ['E'] }, 
      { id: 's2_4', text: 'Le attività che permettono di risolvere problemi complicati', impactDimensions: ['I'] }, 
      { id: 's2_5', text: 'Le attività che prevedono obiettivi orientati ad azioni concrete', impactDimensions: ['R'] }, 
      { id: 's2_6', text: 'Le attività che necessitano di immaginazione', impactDimensions: ['A'] }, 
      { id: 's2_7', text: 'Le attività i cui obiettivi sono la ricerca di soluzioni nuove', impactDimensions: ['A'] }, 
      { id: 's2_8', text: 'Le attività che richiedono grande spirito di iniziativa individuale', impactDimensions: ['E'] }, 
      { id: 's2_9', text: 'Le attività i cui obiettivi sono chiaramente definiti', impactDimensions: ['C'] }, 
      { id: 's2_10', text: 'Le attività dove si possono apportare le proprie idee', impactDimensions: ['A'] }, 
      { id: 's2_11', text: 'Le attività che richiedono conoscenze e competenze tecniche', impactDimensions: ['R'] }, 
      { id: 's2_12', text: 'Le attività che richiedono di aiutare gli altri', impactDimensions: ['S'] }, 
      { id: 's2_13', text: 'Attività che consentono di gestire documenti e organizzare il proprio lavoro', impactDimensions: ['C'] }, 
      { id: 's2_14', text: 'Attività che comportano esperienze all\'esterno', impactDimensions: ['E'] }, 
      { id: 's2_15', text: 'Attività svolte preferibilmente in un settore in cui si possono assumere responsabilità', impactDimensions: ['E'] }, 
      { id: 's2_16', text: 'Attività che richiedono conoscenze intellettuali e know-how', impactDimensions: ['I'] }, 
      { id: 's2_17', text: 'Attività i cui obiettivi siano chiaramente definiti e accettati da tutti', impactDimensions: ['C'] }, 
      { id: 's2_18', text: 'Attività preferibilmente in ambito artistico', impactDimensions: ['A'] }, 
      { id: 's2_19', text: 'Attività che offrono l\'opportunità di sviluppare strategie', impactDimensions: ['E'] }, 
      { id: 's2_20', text: 'Attività che si svolgono preferibilmente all\'aperto o all\'aria aperta', impactDimensions: ['R'] }, 
      { id: 's2_21', text: 'Attività che richiedono capacità di relazione interpersonale', impactDimensions: ['S'] }, 
      { id: 's2_22', text: 'Attività che si svolgono preferibilmente in un\'atmosfera non direttiva', impactDimensions: ['A'] }, 
      { id: 's2_23', text: 'Attività che offrono l\'opportunità di sviluppare soluzioni concrete ai problemi', impactDimensions: ['R'] }, 
      { id: 's2_24', text: 'Attività preferibilmente in ambito sociale', impactDimensions: ['S'] }, 
      { id: 's2_25', text: 'Attività che danno l\'opportunità di sviluppare modi innovativi di fare le cose', impactDimensions: ['I'] }, 
      { id: 's2_26', text: 'Attività che offrono l\'opportunità di essere in contatto con molte persone diverse', impactDimensions: ['E'] }, 
      { id: 's2_27', text: 'Ambienti che incoraggiano il dialogo e l\'interazione', impactDimensions: ['S'] }, 
      { id: 's2_28', text: 'Attività che richiedono competenze tecniche specifiche', impactDimensions: ['R'] }, 
      { id: 's2_29', text: 'Ambienti che incoraggiano l\'uso di strumenti e macchine', impactDimensions: ['R'] }, 
      { id: 's2_30', text: 'Attività che offrono l\'opportunità di sviluppare nuovi modi di fare le cose', impactDimensions: ['A'] }, 
      { id: 's2_31', text: 'Ambienti amichevoli dove è possibile condividere le proprie idee', impactDimensions: ['S'] }, 
      { id: 's2_32', text: 'Preferibilmente attività amministrative o finanziarie', impactDimensions: ['C'] }, 
      { id: 's2_33', text: 'Ambienti che incoraggiano la competizione', impactDimensions: ['E'] }, 
      { id: 's2_34', text: 'Ambienti che offrono una fuga dalla routine', impactDimensions: ['A'] }, 
      { id: 's2_35', text: 'Ambienti strutturati con orari di lavoro regolari', impactDimensions: ['C'] }, 
      { id: 's2_36', text: 'Ambienti strutturati che permettano di portare avanti dei progetti', impactDimensions: ['E'] }, 
      { id: 's2_37', text: 'Ambienti che non richiedano di lavorare isolati dagli altri', impactDimensions: ['S'] }, 
      { id: 's2_38', text: 'Ambienti che favoriscono il contatto con persone esperte e qualificate', impactDimensions: ['I'] }, 
      { id: 's2_39', text: 'Attività che vi diano la possibilità di dimostrare le vostre capacità', impactDimensions: ['E'] }, 
      { id: 's2_40', text: 'Ambienti non eccessivamente strutturati e con orari di lavoro liberi', impactDimensions: ['A'] }, 
      { id: 's2_41', text: 'Ambienti basati sull\'organizzazione collettiva del lavoro', impactDimensions: ['S'] }, 
      { id: 's2_42', text: 'Ambienti che incoraggiano il lavoro cooperativo', impactDimensions: ['S'] }, 
      { id: 's2_43', text: 'Ambienti strutturati che offrono attività regolari e stabili', impactDimensions: ['C'] }, 
      { id: 's2_44', text: 'Ambienti poco strutturati e che consentono alle persone di organizzare il proprio lavoro', impactDimensions: ['I'] }, 
      { id: 's2_45', text: 'Ambienti che si basano su un clima di fiducia', impactDimensions: ['S'] }, 
      { id: 's2_46', text: 'Ambienti che non richiedono un\'eccessiva discussione di gruppo', impactDimensions: ['R'] }, 
      { id: 's2_47', text: 'Ambienti che permettono di lavorare da soli', impactDimensions: ['R'] }, 
      { id: 's2_48', text: 'Ambienti che non richiedono troppi controlli amministrativi', impactDimensions: ['A'] }, 
      { id: 's2_49', text: 'Ambienti che non richiedono troppo lavoro di esecuzione', impactDimensions: ['I'] }, 
      { id: 's2_50', text: 'Ambienti che non richiedano troppa competizione tra le persone', impactDimensions: ['S'] }, 
      { id: 's2_51', text: 'Ambienti in cui si possa essere riconosciuti per la propria creatività', impactDimensions: ['A'] }, 
      { id: 's2_52', text: 'Ambienti che non richiedono troppe discussioni preliminari', impactDimensions: ['R'] }, 
      { id: 's2_53', text: 'Ambienti in cui si possa mettere in pratica il proprio estro artistico', impactDimensions: ['A'] }, 
      { id: 's2_54', text: 'Ambienti che permettono a tutti di trovare il proprio posto', impactDimensions: ['C'] }, 
      { id: 's2_55', text: 'Ambienti che permettono di rischiare', impactDimensions: ['E'] }, 
      { id: 's2_56', text: 'Ambienti che permettono di lavorare in un team multidisciplinare', impactDimensions: ['I'] }, 
      { id: 's2_57', text: 'Ambienti che permettono di acquisire esperienza pratica', impactDimensions: ['R'] }, 
      { id: 's2_58', text: 'Ambienti che sviluppano il senso di leadership del team', impactDimensions: ['E'] }, 
      { id: 's2_59', text: 'Ambienti che permettono di mettere a frutto il senso del lavoro di squadra', impactDimensions: ['S'] }, 
      { id: 's2_60', text: 'Ambienti in cui si apprendono continuamente cose nuove', impactDimensions: ['I'] } 
    ]
  },
  {
    id: 's3',
    title: 'Questionario N. 3: I Passatempi Preferiti',
    description: 'Scegli i passatempi che preferisci dalla lista.',
    type: 'checklist',
    items: [
      { id: 's3_1', text: 'Partecipare a un incontro politico', impactDimensions: ['E'] }, 
      { id: 's3_2', text: 'Ristrutturare una vecchia casa', impactDimensions: ['R'] }, 
      { id: 's3_3', text: 'Praticare uno sport di combattimento', impactDimensions: ['E'] }, 
      { id: 's3_4', text: 'Giocare a scacchi', impactDimensions: ['I'] }, 
      { id: 's3_5', text: 'Partecipare a un evento mondano', impactDimensions: ['E'] }, 
      { id: 's3_6', text: 'Assistere a un concerto o visitare una mostra', impactDimensions: ['A'] }, 
      { id: 's3_7', text: 'Imparare una lingua straniera', impactDimensions: ['I'] }, 
      { id: 's3_8', text: 'Giocare a golf', impactDimensions: ['E'] }, 
      { id: 's3_9', text: 'Coltivare piante o fiori', impactDimensions: ['R'] }, 
      { id: 's3_10', text: 'Suonare uno strumento o ascoltare musica', impactDimensions: ['A'] }, 
      { id: 's3_11', text: 'Fare sport', impactDimensions: ['R'] }, 
      { id: 's3_12', text: 'Aiutare gli amici a risolvere i loro problemi', impactDimensions: ['S'] }, 
      { id: 's3_13', text: 'Giocare a carte con la famiglia', impactDimensions: ['S'] }, 
      { id: 's3_14', text: 'Fare una passeggiata nel bosco', impactDimensions: ['R'] }, 
      { id: 's3_15', text: 'Saltare con il paracadute', impactDimensions: ['E'] }, 
      { id: 's3_16', text: 'Cercare informazioni su Internet', impactDimensions: ['I'] }, 
      { id: 's3_17', text: 'Invitare a cena alcuni amici', impactDimensions: ['S'] }, 
      { id: 's3_18', text: 'Leggere un romanzo o una poesia', impactDimensions: ['A'] }, 
      { id: 's3_19', text: 'Passare una serata a giocare d\'azzardo in un casinò', impactDimensions: ['E'] }, 
      { id: 's3_20', text: 'Riparare un sistema elettrico o elettronico', impactDimensions: ['R'] }, 
      { id: 's3_21', text: 'Fare escursioni in montagna', impactDimensions: ['R'] }, 
      { id: 's3_22', text: 'Leggere riviste o libri scientifici', impactDimensions: ['I'] }, 
      { id: 's3_23', text: 'Realizzare modelli in scala', impactDimensions: ['R'] }, 
      { id: 's3_24', text: 'Divertirsi con gli amici', impactDimensions: ['S'] }, 
      { id: 's3_25', text: 'Guardare un documentario in televisione', impactDimensions: ['I'] }, 
      { id: 's3_26', text: 'Recitare in uno spettacolo teatrale', impactDimensions: ['A'] }, 
      { id: 's3_27', text: 'Dare ripetizioni a studenti in difficoltà', impactDimensions: ['S'] }, 
      { id: 's3_28', text: 'Visitare la famiglia', impactDimensions: ['S'] }, 
      { id: 's3_29', text: 'Andare a cavallo', impactDimensions: ['R'] }, 
      { id: 's3_30', text: 'Collezionare oggetti rari o preziosi', impactDimensions: ['A'] }, 
      { id: 's3_31', text: 'Risolvere una disputa familiare o tra vicini', impactDimensions: ['S'] }, 
      { id: 's3_32', text: 'Fare un cruciverba', impactDimensions: ['I'] }, 
      { id: 's3_33', text: 'Partecipare a una serata di gala', impactDimensions: ['E'] }, 
      { id: 's3_34', text: 'Acquistare abiti originali', impactDimensions: ['A'] }, 
      { id: 's3_35', text: 'Realizzare i propri abiti', impactDimensions: ['A'] }, 
      { id: 's3_36', text: 'Andare in discoteca con gli amici', impactDimensions: ['S'] }, 
      { id: 's3_37', text: 'Conoscere nuove persone', impactDimensions: ['E'] }, 
      { id: 's3_38', text: 'Ripassare una lezione non compresa', impactDimensions: ['C'] }, 
      { id: 's3_39', text: 'Curare la mia contabilità personale', impactDimensions: ['C'] }, 
      { id: 's3_40', text: 'Partecipare a conferenze o seminari', impactDimensions: ['I'] }, 
      { id: 's3_41', text: 'Andare all\'estero per il fine settimana', impactDimensions: ['E'] }, 
      { id: 's3_42', text: 'Pulire la casa', impactDimensions: ['C'] }, 
      { id: 's3_43', text: 'Stare al sole su una spiaggia', impactDimensions: ['R'] }, 
      { id: 's3_44', text: 'Scolpire, dipingere o disegnare', impactDimensions: ['A'] }, 
      { id: 's3_45', text: 'Prendersi cura dei bambini', impactDimensions: ['S'] }, 
      { id: 's3_46', text: 'Cucinare', impactDimensions: ['R'] }, 
      { id: 's3_47', text: 'Fare bricolage in casa', impactDimensions: ['R'] }, 
      { id: 's3_48', text: 'Parlare con gli artisti', impactDimensions: ['A'] }, 
      { id: 's3_49', text: 'Parlare con gli specialisti', impactDimensions: ['I'] }, 
      { id: 's3_50', text: 'Andare al cinema con il mio migliore amico', impactDimensions: ['S'] }, 
      { id: 's3_51', text: 'Assistere a una sfilata di moda', impactDimensions: ['A'] }, 
      { id: 's3_52', text: 'Partecipare a un concorso', impactDimensions: ['E'] }, 
      { id: 's3_53', text: 'Imparare a usare software di disegno', impactDimensions: ['A'] }, 
      { id: 's3_54', text: 'Partecipare a una riunione scolastica', impactDimensions: ['S'] }, 
      { id: 's3_55', text: 'Gestire un\'associazione', impactDimensions: ['C'] }, 
      { id: 's3_56', text: 'Lavorare su un\'invenzione personale', impactDimensions: ['I'] }, 
      { id: 's3_57', text: 'Leggere riviste specializzate', impactDimensions: ['R'] }, 
      { id: 's3_58', text: 'Impostare un progetto importante', impactDimensions: ['E'] }, 
      { id: 's3_59', text: 'Rivedere le mie lezioni', impactDimensions: ['C'] }, 
      { id: 's3_60', text: 'Seguire corsi di formazione', impactDimensions: ['I'] } 
    ]
  },
  {
    id: 's4',
    title: 'Questionario N. 4: I 5 Mestieri dei Tuoi Sogni',
    description: 'Scegli esattamente 5 professioni che vorresti fare o che trovi interessanti.',
    type: 'checklist',
    maxSelection: 5,
    items: [
      { id: 'j1', text: 'Agente assicurativo', impactDimensions: ['E'] }, 
      { id: 'j2', text: 'Agente immobiliare', impactDimensions: ['E'] }, 
      { id: 'j3', text: 'Analista finanziario', impactDimensions: ['C'] }, 
      { id: 'j4', text: 'Analista programmatore', impactDimensions: ['I'] }, 
      { id: 'j5', text: 'Architetto', impactDimensions: ['A'] }, 
      { id: 'j6', text: 'Avvocato', impactDimensions: ['E'] }, 
      { id: 'j7', text: 'Bibliotecario', impactDimensions: ['C'] }, 
      { id: 'j8', text: 'Biologo', impactDimensions: ['I'] }, 
      { id: 'j9', text: 'Cameraman', impactDimensions: ['R'] }, 
      { id: 'j10', text: 'Recruiter', impactDimensions: ['S'] }, 
      { id: 'j11', text: 'Addetto alle pubbliche relazioni', impactDimensions: ['E'] }, 
      { id: 'j12', text: 'Tassista', impactDimensions: ['R'] }, 
      { id: 'j13', text: 'Capo contabile', impactDimensions: ['C'] }, 
      { id: 'j14', text: 'Capo cantiere', impactDimensions: ['R'] }, 
      { id: 'j15', text: 'Capo reparto', impactDimensions: ['E'] }, 
      { id: 'j16', text: 'Pagliaccio', impactDimensions: ['A'] }, 
      { id: 'j17', text: 'Comico', impactDimensions: ['A'] }, 
      { id: 'j18', text: 'Capitano', impactDimensions: ['E'] }, 
      { id: 'j19', text: 'Ragioniere', impactDimensions: ['C'] }, 
      { id: 'j20', text: 'Autista di ambulanza', impactDimensions: ['R'] }, 
      { id: 'j21', text: 'Consulente educativo principale', impactDimensions: ['S'] }, 
      { id: 'j22', text: 'Controllore finanziario', impactDimensions: ['C'] }, 
      { id: 'j23', text: 'Costumista', impactDimensions: ['A'] }, 
      { id: 'j24', text: 'Stilista di moda', impactDimensions: ['A'] }, 
      { id: 'j25', text: 'Cuoco', impactDimensions: ['R'] }, 
      { id: 'j26', text: 'Dentista', impactDimensions: ['R'] }, 
      { id: 'j27', text: 'Designer', impactDimensions: ['A'] }, 
      { id: 'j28', text: 'Dietista', impactDimensions: ['I'] }, 
      { id: 'j29', text: 'Scrittore', impactDimensions: ['A'] }, 
      { id: 'j30', text: 'Redattore', impactDimensions: ['A'] }, 
      { id: 'j31', text: 'Educatore della prima infanzia', impactDimensions: ['S'] }, 
      { id: 'j32', text: 'Addestratore di cavalli', impactDimensions: ['R'] }, 
      { id: 'j33', text: 'Allenatore sportivo', impactDimensions: ['S'] }, 
      { id: 'j34', text: 'Designer grafico', impactDimensions: ['A'] }, 
      { id: 'j35', text: 'Orticoltore', impactDimensions: ['R'] }, 
      { id: 'j36', text: 'Umorista', impactDimensions: ['A'] }, 
      { id: 'j37', text: 'Illustratore', impactDimensions: ['A'] }, 
      { id: 'j38', text: 'Stampatore', impactDimensions: ['R'] }, 
      { id: 'j39', text: 'Infermiere', impactDimensions: ['S'] }, 
      { id: 'j40', text: 'Ingegnere delle telecomunicazioni', impactDimensions: ['I'] }, 
      { id: 'j41', text: 'Ispettore fiscale', impactDimensions: ['C'] }, 
      { id: 'j42', text: 'Installatore di apparecchiature tecniche', impactDimensions: ['R'] }, 
      { id: 'j43', text: 'Interprete', impactDimensions: ['I'] }, 
      { id: 'j44', text: 'Giornalista', impactDimensions: ['A'] }, 
      { id: 'j45', text: 'Giudice', impactDimensions: ['E'] }, 
      { id: 'j46', text: 'Libraio', impactDimensions: ['C'] }, 
      { id: 'j47', text: 'Meccanico', impactDimensions: ['R'] }, 
      { id: 'j48', text: 'Medico', impactDimensions: ['I'] }, 
      { id: 'j49', text: 'Musicista', impactDimensions: ['A'] }, 
      { id: 'j50', text: 'Proprietario d\'azienda', impactDimensions: ['E'] }, 
      { id: 'j51', text: 'Paesaggista', impactDimensions: ['A'] }, 
      { id: 'j52', text: 'Pilota di aerei', impactDimensions: ['R'] }, 
      { id: 'j53', text: 'Insegnante di scuola primaria', impactDimensions: ['S'] }, 
      { id: 'j54', text: 'Odontotecnico', impactDimensions: ['R'] }, 
      { id: 'j55', text: 'Psicologo', impactDimensions: ['S'] }, 
      { id: 'j56', text: 'Rappresentante di commercio', impactDimensions: ['E'] }, 
      { id: 'j57', text: 'Responsabile di missioni umanitarie', impactDimensions: ['S'] }, 
      { id: 'j58', text: 'Responsabile di un centro ricreativo', impactDimensions: ['S'] }, 
      { id: 's59', text: 'Direttore di filiale di banca', impactDimensions: ['E'] }, 
      { id: 'j60', text: 'Responsabile delle esportazioni', impactDimensions: ['E'] }, 
      { id: 'j61', text: 'Responsabile della logistica', impactDimensions: ['C'] }, 
      { id: 'j62', text: 'Scultore', impactDimensions: ['A'] }, 
      { id: 'j63', text: 'Segretario', impactDimensions: ['C'] }, 
      { id: 'j64', text: 'Sociologo', impactDimensions: ['I'] }, 
      { id: 'j65', text: 'Hostess/Steward', impactDimensions: ['S'] }, 
      { id: 'j66', text: 'Tecnico del controllo qualità', impactDimensions: ['C'] }, 
      { id: 'j67', text: 'Lavoratore sociale', impactDimensions: ['S'] }, 
      { id: 'j68', text: 'Venditore di auto', impactDimensions: ['E'] }, 
      { id: 'j69', text: 'Veterinario', impactDimensions: ['I'] }, 
      { id: 'j70', text: 'Webmaster', impactDimensions: ['I'] } 
    ]
  }
];

export const JOB_SUGGESTIONS: JobDatabase = {
  "ECI": [
    { title: "Amministratore Delegato", sector: "Management" },
    { title: "Direttore Commerciale", sector: "Sales" }
  ],
  "SEC": [
    { title: "Responsabile Risorse Umane", sector: "HR" },
    { title: "Account Manager", sector: "Sales" }
  ],
  "RIC": [
    { title: "Ingegnere Meccanico", sector: "Industria" },
    { title: "Analista Programmatore", sector: "IT/Tech" }
  ],
  "SCA": [
    { title: "Operatore Supporto Clienti", sector: "Service" },
    { title: "Coordinatore di Team", sector: "Management" }
  ],
  "IAS": [
    { title: "UX/UI Designer", sector: "Creative" },
    { title: "Marketing Specialist", sector: "Marketing" }
  ],
  "EIC": [
    { title: "Business Development Manager", sector: "Sales" },
    { title: "Product Owner", sector: "IT/Tech" }
  ]
};