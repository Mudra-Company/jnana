// Updated keys from T,R,I,C,A,M to RIASEC standard R,I,A,S,E,C
import { RiasecDimension } from '../types';

interface PoleContent {
  title: string;
  description: string;
  traits: string;
  quotes: string[];
}

export const POLE_CONTENT: Record<RiasecDimension, PoleContent> = {
  R: {
    title: "IL POLO REALISTICO",
    description: "Le persone con una spiccata natura realistica preferiscono attività concrete che richiedono l'uso di macchine, strumenti o abilità manuali. Amano i risultati tangibili e lavorano spesso meglio in contesti dove l'azione prevale sulla discussione teorica. Possono apparire riservati ma sono estremamente affidabili e orientati alla pratica.",
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
    description: "Le persone investigative amano comprendere il mondo che le circonda. Sono caratterizzate da un interesse per la ricerca, l'analisi e la risoluzione di problemi complessi. Preferiscono sfide intellettuali e utilizzano la logica e il pensiero critico per navigare in situazioni nuove. Non amano compiti puramente esecutivi.",
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
    description: "Le persone artistiche preferiscono attività libere, non sistematiche e creative. Sono spesso non conformiste, espressive e sensibili. Detestano la routine e i contesti eccessivamente burocratici o amministrativi. Hanno bisogno di spazio per l'intuizione e l'espressione personale.",
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
    description: "Le persone con una natura sociale eccellono nelle attività che richiedono cooperazione, aiuto e assistenza al prossimo. Sono empatiche, comunicative e amano formare o animare gruppi. Preferiscono risolvere i conflitti attraverso il dialogo e hanno un forte bisogno di armonia relazionale.",
    traits: "Cooperativi, amichevoli, generosi, empatici, persuasivi, pazienti, responsabili, calorosi.",
    quotes: [
      "E’ molto raro che non riesco a trovarmi bene con qualcuno. Forse perché non cerco mai di giudicare, preferisco cercare di comprendere.",
      "Il problema in un gruppo è che nessuno ti apprezza forzatamente. A volte ciò mi porta a perdere fiducia in me.",
      "In ufficio ognuno sta per conto suo. E’ veramente triste. Secondo me un ambiente di lavoro piacevole, è quello che permette di mostrare il meglio di se."
    ]
  },
  E: {
    title: "IL POLO INTRAPRENDENTE (ENTERPRISING)",
    description: "Le persone intraprendenti sono leader naturali. Si esprimono con disinvoltura e sanno influenzare gli altri per raggiungere obiettivi comuni. Sono motivate dalla sfida, dalla competizione e dalla riuscita. Amano dirigere, vendere e dominare la scena operativa.",
    traits: "Energici, ambiziosi, dominanti, ottimisti, socievoli, sicuri di sé, intraprendenti.",
    quotes: [
      "Per me il lavoro è competizione e il guadagno ha una grande importanza.",
      "La mia più grande paura è restare fisso in un posto, e non avere prospettive di crescita.",
      "Nella società ho scoperto la mia vera vocazione durante il mio stage: convincere anche i meno convinti che è questo il prodotto di cui hanno bisogno."
    ]
  },
  C: {
    title: "IL POLO CONVENZIONALE",
    description: "Le persone convenzionali amano l'ordine, il metodo e le strutture ben definite. Si trovano a proprio agio con compiti amministrativi, gestione di dati e procedure sistematiche. Apprezzano la chiarezza delle istruzioni e la stabilità dei processi consolidati.",
    traits: "Metodici, organizzati, precisi, efficienti, dogmatici, conformisti, prudenti.",
    quotes: [
      "Una volta entrata nella mia azienda, mi sono accorta che tutto quello che abbiamo imparato sui banchi di scuola non era veramente il metodo migliore.",
      "All’inizio, ero piuttosto persa, non capivo del tutto come funzionavano le cose. Adesso va meglio, mi sono adattata.",
      "Quello che non amo del mio lavoro è che abbiamo un capo che non sa sempre quello che vuole."
    ]
  }
};

// Keys are sorted alphabetically. Aligned with RiasecDimension.
export const COMBINATION_CONTENT: Record<string, string> = {
  "IR": "Ci sono persone che amano lavorare nello sviluppo di nuovi prodotti. Hanno un grande rispetto per tutte le forme di insegnamento e amano il contatto con specialisti e professionisti del loro settore. Sono attratte dai problemi concreti e cercano risultati tangibili per il loro lavoro.",
  "AR": "Queste sono persone che amano creare con le loro mani e, in generale, che preferiscono le attività creative utilizzando oggetti, utensili, e animali.",
  "RS": "Molti studi hanno dimostrato che queste persone sono più rappresentate dalle donne che dagli uomini. Queste sono persone che preferiscono lavorare nel campo dell’organizzazione o in quello delle attività sportive.",
  "ER": "Ci sono persone che possono dirigere piccoli gruppi sapendo che la loro preferenza è diretta verso gruppi di persone che svolgono compiti manuali.",
  "CR": "Ci sono persone particolarmente stabili dallo spirito pratico. Hanno bisogno di avere obiettivi chiari e ben definiti. Amano pianificare la loro giornata di lavoro senza imprevisti.",
  "AI": "Più rappresentate dalle donne che dagli uomini, queste sono le persone che non si trovano bene negli ambienti troppo conformisti. Sono, infatti, molte creative.",
  "IS": "Sono persone ottimiste e positive che sono più interessate ai comportamenti umani che alle teorie e alle idee.",
  "EI": "Sono molto rare le persone che associano la riflessione e l’azione. Sono molto apprezzate nella ricerca applicata nel marketing.",
  "CI": "Ci sono delle persone che hanno particolarmente bisogno di avere dei riconoscimenti nel loro campo di specializzazione.",
  "AS": "Più rappresentate dalle donne che dagli uomini, queste persone amano utilizzare le loro intuizioni e le loro emozioni per aiutare gli altri.",
  "AE": "Queste sono persone rappresentate più dagli uomini che dalle donne. Sono espressive e indipendenti e amano gli ambienti dove possono agire senza troppi vincoli.",
  "AC": "Queste sono persone che sanno utilizzare la loro immaginazione per mettere a punto, per esempio, dei metodi di lavoro più efficaci.",
  "ES": "Più rappresentate dalla popolazione maschile che femminile, esse sono le persone che amano gestire una squadra o dirigere una loro propria impresa.",
  "CS": "Queste sono persone che amano i lavori di squadra, quando gli obiettivi sono definiti chiaramente.",
  "CE": "Queste sono le persone che amano i risultati tangibili e quantificabili. Sono generalmente molto dotate per tutto ciò che riguarda la gestione finanziaria."
};