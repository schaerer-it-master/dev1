export type FragranceId = 'thunder' | 'aurora' | 'ember';

export type Motif = 'rings' | 'lines' | 'dots' | 'waves' | 'blob' | 'rays' | 'grid' | 'spiral' | 'shards';

export type Note = {
  name: string;
  latin: string;
  origin: string;
  share: number; // percent of the concentrate
  motif: Motif;
  color: string;
};

export type Fragrance = {
  id: FragranceId;
  index: number;
  no: string;
  roman: string;
  name: string;
  subtitle: string;
  tagline: string;
  place: string;
  coords: string;
  time: string;
  poem: string;
  batch: string;
  price: string;
  colors: {
    liquid: string;
    glow: string;
    accent: string;
    deep: string;
  };
  notes: { top: Note[]; heart: Note[]; base: Note[] };
};

export const FRAGRANCES: Fragrance[] = [
  {
    id: 'thunder',
    index: 0,
    no: 'No. 1',
    roman: 'I',
    name: 'Thunder',
    subtitle: 'Gewitter über der Wüste',
    tagline: 'Elektrizität, destilliert.',
    place: 'Wadi Rum, Jordanien',
    coords: '29°34′N 35°25′E',
    time: '02:14',
    poem:
      'Zwei Uhr vierzehn. Die Luft über den Dünen lädt sich auf, bis sie knistert. Kein Tropfen fällt — nur Licht, das den Himmel spaltet, und der Geruch von heißem Stein, der auf einen Regen wartet, der niemals kommt.',
    batch: 'Lot 0214-T',
    price: '245 €',
    colors: { liquid: '#8c7a62', glow: '#e9ecff', accent: '#c7a270', deep: '#15110d' },
    notes: {
      top: [
        { name: 'Ozon', latin: 'Accord électrique', origin: 'Atelier Grasse', share: 8, motif: 'rays', color: '#dfe3f0' },
        { name: 'Schwarzer Pfeffer', latin: 'Piper nigrum', origin: 'Madagaskar', share: 6, motif: 'dots', color: '#9c8f7e' },
        { name: 'Petrichor', latin: 'Geosmin', origin: 'Regen auf Stein', share: 4, motif: 'shards', color: '#8a8f93' },
      ],
      heart: [
        { name: 'Weihrauch', latin: 'Boswellia sacra', origin: 'Dhofar, Oman', share: 14, motif: 'spiral', color: '#c9b08a' },
        { name: 'Heißer Stein', latin: 'Accord minéral', origin: 'Wadi Rum', share: 11, motif: 'grid', color: '#b58a5c' },
        { name: 'Safran', latin: 'Crocus sativus', origin: 'Khorasan', share: 5, motif: 'lines', color: '#d0763d' },
      ],
      base: [
        { name: 'Vetiver', latin: 'Chrysopogon zizanioides', origin: 'Haiti', share: 18, motif: 'lines', color: '#7d7556' },
        { name: 'Birkenteer', latin: 'Betula pendula', origin: 'Litauen', share: 9, motif: 'blob', color: '#4a3f36' },
        { name: 'Ambra', latin: 'Ambrox', origin: 'Atelier Grasse', share: 25, motif: 'rings', color: '#c9a87c' },
      ],
    },
  },
  {
    id: 'aurora',
    index: 1,
    no: 'No. 2',
    roman: 'II',
    name: 'Aurora',
    subtitle: 'Nordlichter über Schnee',
    tagline: 'Das Licht, das friert.',
    place: 'Abisko, Lappland',
    coords: '68°21′N 18°49′E',
    time: '23:47',
    poem:
      'Minus dreißig Grad, und der Himmel beginnt zu atmen. Grüne Schleier wehen über einen Schnee, so still, dass man das eigene Herz hört. Iris, Frost und Tannenharz — ein Duft wie angehaltener Atem.',
    batch: 'Lot 2347-A',
    price: '245 €',
    colors: { liquid: '#9fd8c8', glow: '#7dffc4', accent: '#d7a9c4', deep: '#060d0d' },
    notes: {
      top: [
        { name: 'Aldehyd-Frost', latin: 'Aldehyde C-11', origin: 'Atelier Grasse', share: 5, motif: 'shards', color: '#e8f4f4' },
        { name: 'Wacholder', latin: 'Juniperus communis', origin: 'Lappland', share: 7, motif: 'dots', color: '#6f8f86' },
        { name: 'Kardamom', latin: 'Elettaria cardamomum', origin: 'Guatemala', share: 4, motif: 'rings', color: '#a9c7a2' },
      ],
      heart: [
        { name: 'Iris', latin: 'Iris pallida', origin: 'Florenz', share: 12, motif: 'waves', color: '#b9a9cf' },
        { name: 'Eichenmoos', latin: 'Evernia prunastri', origin: 'Balkan', share: 9, motif: 'blob', color: '#5f7a64' },
        { name: 'Veilchenblatt', latin: 'Viola odorata', origin: 'Grasse', share: 6, motif: 'lines', color: '#79a58f' },
      ],
      base: [
        { name: 'Sibirische Tanne', latin: 'Abies sibirica', origin: 'Altai', share: 16, motif: 'grid', color: '#3f5b52' },
        { name: 'Ambrette', latin: 'Abelmoschus moschatus', origin: 'Ecuador', share: 10, motif: 'spiral', color: '#d7c9b8' },
        { name: 'Weißer Moschus', latin: 'Musc blanc', origin: 'Atelier Grasse', share: 22, motif: 'rays', color: '#efe9e1' },
      ],
    },
  },
  {
    id: 'ember',
    index: 2,
    no: 'No. 3',
    roman: 'III',
    name: 'Ember Sea',
    subtitle: 'Brennender Sonnenuntergang über dem Ozean',
    tagline: 'Der Horizont in Flammen.',
    place: 'Cabo de São Vicente',
    coords: '37°01′N 8°59′W',
    time: '20:31',
    poem:
      'Die Sonne sinkt nicht, sie brennt sich ins Wasser. Salz auf der Haut, Blutorange und Rauch, der Horizont ein glühender Draht. Das letzte Licht des Tages — eingefangen, kurz bevor es erlischt.',
    batch: 'Lot 2031-E',
    price: '245 €',
    colors: { liquid: '#d9763a', glow: '#ff8a3d', accent: '#e6b25c', deep: '#170605' },
    notes: {
      top: [
        { name: 'Blutorange', latin: 'Citrus sinensis ‘Moro’', origin: 'Sizilien', share: 9, motif: 'rings', color: '#e0572e' },
        { name: 'Rosa Pfeffer', latin: 'Schinus molle', origin: 'Réunion', share: 5, motif: 'dots', color: '#d9798a' },
        { name: 'Meersalz', latin: 'Accord marin', origin: 'Guérande', share: 6, motif: 'waves', color: '#c8d2d4' },
      ],
      heart: [
        { name: 'Damaszener Rose', latin: 'Rosa damascena', origin: 'Isparta', share: 13, motif: 'spiral', color: '#b8433f' },
        { name: 'Treibholz', latin: 'Accord boisé', origin: 'Atlantik', share: 8, motif: 'lines', color: '#8d6a4f' },
        { name: 'Immortelle', latin: 'Helichrysum italicum', origin: 'Korsika', share: 7, motif: 'rays', color: '#e4a94a' },
      ],
      base: [
        { name: 'Labdanum', latin: 'Cistus ladanifer', origin: 'Andalusien', share: 17, motif: 'blob', color: '#7a3a22' },
        { name: 'Guajakholz', latin: 'Bulnesia sarmientoi', origin: 'Paraguay', share: 12, motif: 'grid', color: '#5b3a2a' },
        { name: 'Glühende Ambra', latin: 'Ambre gris', origin: 'Atelier Grasse', share: 18, motif: 'shards', color: '#e6b25c' },
      ],
    },
  },
];
