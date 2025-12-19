import { ClimateSection } from '../types';

export const CLIMATE_SURVEY: ClimateSection[] = [
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
      { id: 'hum_1', text: 'L’ambiente lavorativo è accogliente e positivo.' },
      { id: 'hum_2', text: 'Mi sento rispettato/a e ascoltato/a dai colleghi.' }
    ]
  },
  {
    id: 'sec_identity',
    title: 'Identità',
    questions: [
      { id: 'ident_1', text: 'Condivido i valori e la mission dell’organizzazione.' },
      { id: 'ident_2', text: 'Mi sento parte integrante di questa azienda.' }
    ]
  }
];