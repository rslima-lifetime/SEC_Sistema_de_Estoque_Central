// Service mimicking Firebase Firestore locally using LocalStorage
// Provides identical signatures so that it can be swapped with real Firebase seamlessly.

export interface Product {
  id: string;
  name: string;
  unit: string;
  initialStock: number;
  entries: number;
  exits: number;
  finalStock: number;
  productionTarget?: number;
}

export interface Movement {
  id: string;
  date: string;
  type: 'Entrada' | 'Saída';
  productId: string;
  productName: string;
  quantity: number;
  isDistribution?: boolean;
  destination?: string;
}

export interface DistributionWeek {
  id: string; // e.g. "2026-W28" or similar
  destination: string;
  // matrix mapping productId -> { [dayOfWeek]: quantity }
  items: {
    [productId: string]: {
      [day: string]: number; // day: "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta" | "Sábado" | "Domingo"
    };
  };
  confirmedAt?: string;
  status: 'Pendente' | 'Confirmado';
}

export interface AuditRecord {
  id: string;
  date: string;
  items: {
    [productId: string]: {
      theoretical: number;
      physical: number;
      difference: number; // physical - theoretical
    };
  };
}

const STORAGE_KEYS = {
  PRODUCTS: 'sec_products',
  MOVEMENTS: 'sec_movements',
  DISTRIBUTIONS: 'sec_distributions',
  AUDITS: 'sec_audits',
};

const INITIAL_PRODUCTS: Product[] = [
  {
    "id": "prod-1",
    "name": "AÇÚCAR MASCAVO",
    "unit": "unidade",
    "initialStock": 10,
    "entries": 0,
    "exits": 0,
    "finalStock": 10,
    "productionTarget": 20
  },
  {
    "id": "prod-2",
    "name": "AÇÚCAR REFINADO",
    "unit": "unidade",
    "initialStock": 25,
    "entries": 0,
    "exits": 0,
    "finalStock": 25,
    "productionTarget": 40
  },
  {
    "id": "prod-3",
    "name": "ALHO EM PÓ",
    "unit": "kg",
    "initialStock": 25,
    "entries": 0,
    "exits": 0,
    "finalStock": 25,
    "productionTarget": 8
  },
  {
    "id": "prod-4",
    "name": "ALHO TORRADO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 12
  },
  {
    "id": "prod-5",
    "name": "AMIDO DE MILHO",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 30
  },
  {
    "id": "prod-6",
    "name": "ARROZ PARBOILIZADO",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 510
  },
  {
    "id": "prod-7",
    "name": "AVEIA",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 10
  },
  {
    "id": "prod-8",
    "name": "AZEITE 5L",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 4
  },
  {
    "id": "prod-9",
    "name": "CHOCOLATE MEIO AMARGO",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 6
  },
  {
    "id": "prod-10",
    "name": "CHOCOLATE AO LEITE",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 3
  },
  {
    "id": "prod-11",
    "name": "BATATA FARM CX",
    "unit": "kg",
    "initialStock": 13,
    "entries": 15,
    "exits": 6,
    "finalStock": 22,
    "productionTarget": 145
  },
  {
    "id": "prod-12",
    "name": "CACAU EM PÓ 100%",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 2
  },
  {
    "id": "prod-13",
    "name": "CALDA DE MORANGO",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 5
  },
  {
    "id": "prod-14",
    "name": "CALDO DE CARNE 1KG",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 20
  },
  {
    "id": "prod-15",
    "name": "CALDO LEGUMES 1KG",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 20
  },
  {
    "id": "prod-16",
    "name": "CANELA EM PÓ",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 2
  },
  {
    "id": "prod-17",
    "name": "CARNE SECA DESF 1KG",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 20
  },
  {
    "id": "prod-18",
    "name": "CASTANHA DE CAJU",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 2
  },
  {
    "id": "prod-19",
    "name": "CASTANHA DO PARÁ",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 2
  },
  {
    "id": "prod-20",
    "name": "CEBOLA EM PÓ",
    "unit": "unidade",
    "initialStock": 10,
    "entries": 0,
    "exits": 0,
    "finalStock": 10,
    "productionTarget": 10
  },
  {
    "id": "prod-21",
    "name": "CHIMICHURRI",
    "unit": "kg",
    "initialStock": 20,
    "entries": 0,
    "exits": 0,
    "finalStock": 20,
    "productionTarget": 10
  },
  {
    "id": "prod-22",
    "name": "COCO RALADO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 20
  },
  {
    "id": "prod-23",
    "name": "COSTELA BOVINA DESF 1KG",
    "unit": "unidade",
    "initialStock": 12,
    "entries": 0,
    "exits": 0,
    "finalStock": 12,
    "productionTarget": 160
  },
  {
    "id": "prod-24",
    "name": "COSTELA SUÍNA DESF 1KG",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 60
  },
  {
    "id": "prod-25",
    "name": "CRAVO DA ÍNDIA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 2
  },
  {
    "id": "prod-26",
    "name": "CREAM CHEESE",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 32
  },
  {
    "id": "prod-27",
    "name": "CREME DE LEITE",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 120
  },
  {
    "id": "prod-28",
    "name": "DADINHO DE TAPIOCA",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 432
  },
  {
    "id": "prod-29",
    "name": "DELICIA DE CHOCOLATE",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 324
  },
  {
    "id": "prod-30",
    "name": "DEMI GLACE 1KG",
    "unit": "kg",
    "initialStock": 15,
    "entries": 0,
    "exits": 0,
    "finalStock": 15,
    "productionTarget": 10
  },
  {
    "id": "prod-31",
    "name": "DOCE DE LEITE",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 40
  },
  {
    "id": "prod-32",
    "name": "DOMEC 1L",
    "unit": "litro",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 40
  },
  {
    "id": "prod-33",
    "name": "FARINHA DE MANDIOCA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 20
  },
  {
    "id": "prod-34",
    "name": "FARINHA DE TRIGO",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 60
  },
  {
    "id": "prod-35",
    "name": "FARINHA TEMPERADA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 60
  },
  {
    "id": "prod-36",
    "name": "FEIJÃO DE CORDA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 200
  },
  {
    "id": "prod-37",
    "name": "FEIJÃO PRETO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 120
  },
  {
    "id": "prod-38",
    "name": "FUMAÇA LÍQUIDA",
    "unit": "unidade",
    "initialStock": 6,
    "entries": 0,
    "exits": 0,
    "finalStock": 6,
    "productionTarget": 4
  },
  {
    "id": "prod-39",
    "name": "GELEIA DE PIMENTA 1.2KG",
    "unit": "kg",
    "initialStock": 25,
    "entries": 0,
    "exits": 0,
    "finalStock": 25,
    "productionTarget": 20
  },
  {
    "id": "prod-40",
    "name": "GOMA DE TAPIOCA",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 60
  },
  {
    "id": "prod-41",
    "name": "GRÃO DE BICO",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 40
  },
  {
    "id": "prod-42",
    "name": "KETCHUP",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 64
  },
  {
    "id": "prod-43",
    "name": "LEITE CONDENSADO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 160
  },
  {
    "id": "prod-44",
    "name": "LEITE INTEGRAL 1L",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 40
  },
  {
    "id": "prod-45",
    "name": "LEMON PEPPER",
    "unit": "unidade",
    "initialStock": 20,
    "entries": 0,
    "exits": 0,
    "finalStock": 20,
    "productionTarget": 10
  },
  {
    "id": "prod-46",
    "name": "LICOR",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 32
  },
  {
    "id": "prod-47",
    "name": "LINGUIÇA CALABRESA",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 100
  },
  {
    "id": "prod-48",
    "name": "LINGUIÇA TOSCANA",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 30
  },
  {
    "id": "prod-49",
    "name": "LOURO EM PÓ",
    "unit": "unidade",
    "initialStock": 15,
    "entries": 0,
    "exits": 0,
    "finalStock": 15,
    "productionTarget": 2
  },
  {
    "id": "prod-50",
    "name": "MACARRÃO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 200
  },
  {
    "id": "prod-51",
    "name": "MAIONESE",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 80
  },
  {
    "id": "prod-52",
    "name": "MANTEIGA DE GARRAFA",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 24
  },
  {
    "id": "prod-53",
    "name": "MEL",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 20
  },
  {
    "id": "prod-54",
    "name": "MILHO VERDE",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 80
  },
  {
    "id": "prod-55",
    "name": "MOLHO DE TOMATE 4.1KG",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 80
  },
  {
    "id": "prod-56",
    "name": "MOLHO INGLÊS",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 40
  },
  {
    "id": "prod-57",
    "name": "MOSTARDA HEINZ",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 20
  },
  {
    "id": "prod-58",
    "name": "MOSTARDA EM GRÃOS",
    "unit": "kg",
    "initialStock": 25,
    "entries": 0,
    "exits": 0,
    "finalStock": 25,
    "productionTarget": 6
  },
  {
    "id": "prod-59",
    "name": "NOZ MOSCADA",
    "unit": "kg",
    "initialStock": 18,
    "entries": 0,
    "exits": 0,
    "finalStock": 18,
    "productionTarget": 2
  },
  {
    "id": "prod-60",
    "name": "NUTELLA 3KG",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 20
  },
  {
    "id": "prod-61",
    "name": "ÓLEO DE ALGODÃO",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 120
  },
  {
    "id": "prod-62",
    "name": "ORÉGANO",
    "unit": "kg",
    "initialStock": 15,
    "entries": 0,
    "exits": 0,
    "finalStock": 15,
    "productionTarget": 4
  },
  {
    "id": "prod-63",
    "name": "OVOMALTINE 750G",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 10
  },
  {
    "id": "prod-64",
    "name": "FARINHA PANKO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 120
  },
  {
    "id": "prod-65",
    "name": "PÁPRICA DEFUMADA",
    "unit": "unidade",
    "initialStock": 20,
    "entries": 0,
    "exits": 0,
    "finalStock": 20,
    "productionTarget": 10
  },
  {
    "id": "prod-66",
    "name": "PÁPRICA DOCE",
    "unit": "unidade",
    "initialStock": 20,
    "entries": 0,
    "exits": 0,
    "finalStock": 20,
    "productionTarget": 10
  },
  {
    "id": "prod-67",
    "name": "PÁPRICA PICANTE",
    "unit": "unidade",
    "initialStock": 20,
    "entries": 0,
    "exits": 0,
    "finalStock": 20,
    "productionTarget": 10
  },
  {
    "id": "prod-68",
    "name": "PICLES EM CONSERVA (BALDE)",
    "unit": "unidade",
    "initialStock": 5,
    "entries": 0,
    "exits": 0,
    "finalStock": 5,
    "productionTarget": 24
  },
  {
    "id": "prod-69",
    "name": "PICLES HEMMER 800G",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 60
  },
  {
    "id": "prod-70",
    "name": "PIMENTA CAIENA",
    "unit": "unidade",
    "initialStock": 20,
    "entries": 0,
    "exits": 0,
    "finalStock": 20,
    "productionTarget": 2
  },
  {
    "id": "prod-71",
    "name": "PIMENTA DO REINO",
    "unit": "unidade",
    "initialStock": 25,
    "entries": 0,
    "exits": 0,
    "finalStock": 25,
    "productionTarget": 10
  },
  {
    "id": "prod-72",
    "name": "PUDIM",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 216
  },
  {
    "id": "prod-73",
    "name": "R005",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-74",
    "name": "R006",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-75",
    "name": "R007",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-76",
    "name": "RUBACÃO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 40
  },
  {
    "id": "prod-77",
    "name": "SAL REFINADO",
    "unit": "unidade",
    "initialStock": 20,
    "entries": 0,
    "exits": 0,
    "finalStock": 20,
    "productionTarget": 20
  },
  {
    "id": "prod-78",
    "name": "SAL BLEND",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 20
  },
  {
    "id": "prod-79",
    "name": "SHOYU",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 40
  },
  {
    "id": "prod-80",
    "name": "STROGONOF 150G",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 216
  },
  {
    "id": "prod-81",
    "name": "TAPIOCA FLOCADA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 20
  },
  {
    "id": "prod-82",
    "name": "TOMATE PELATI 2.5KG",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 20
  },
  {
    "id": "prod-83",
    "name": "VINAGRE",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 40
  },
  {
    "id": "prod-84",
    "name": "VINAGRE DE MAÇÃ",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 40
  },
  {
    "id": "prod-85",
    "name": "VINHO BRANCO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 24
  },
  {
    "id": "prod-86",
    "name": "VINHO TINTO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 24
  },
  {
    "id": "prod-87",
    "name": "ACÉM",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-88",
    "name": "AIPIM",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-89",
    "name": "BABY BEEF",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-90",
    "name": "BACON FATIADO 1KG",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-91",
    "name": "BACON MANTA 1KG",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 80
  },
  {
    "id": "prod-92",
    "name": "MANTEIGA (BALDE)",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 2
  },
  {
    "id": "prod-93",
    "name": "MARGARINA (BALDE)",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-94",
    "name": "MOLHO BARBECUE",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 48
  },
  {
    "id": "prod-95",
    "name": "BATATA CX",
    "unit": "caixa",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-96",
    "name": "BATATA PALHA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-97",
    "name": "CARRÉ",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-98",
    "name": "QUEIJO CHEDDAR FATIADO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 2592
  },
  {
    "id": "prod-99",
    "name": "COXA SOBRECOXA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-100",
    "name": "FILÉ DE FRANGO",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-101",
    "name": "FILÉ DE SOBRECOXA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-102",
    "name": "FILÉ DE PEITO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-103",
    "name": "FRALDINHA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-104",
    "name": "QUEIJO GOUDAN",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-105",
    "name": "LOMBO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 120
  },
  {
    "id": "prod-106",
    "name": "PATINHO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-107",
    "name": "QUEIJO MONTANHÊS",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 20
  },
  {
    "id": "prod-108",
    "name": "QUEIJO PARMESÃO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-109",
    "name": "REQUEIJÃO CREMOSO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 216
  },
  {
    "id": "prod-110",
    "name": "ÓLEO (BALDE)",
    "unit": "litro",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-111",
    "name": "ÁLCOOL EM GARRAFA",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-112",
    "name": "ÁLCOOL EM GEL",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-113",
    "name": "ESSÊNCIA DE BAUNILHA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-114",
    "name": "BICO DE MAÇARICO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-115",
    "name": "BOBINA GRANDE",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-116",
    "name": "BOBINA PEQUENA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-117",
    "name": "BOBINA IMPRESSORA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-118",
    "name": "CANETA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-119",
    "name": "CANUDO (PACOTE)",
    "unit": "pacote",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 32
  },
  {
    "id": "prod-120",
    "name": "COLHER DESCARTÁVEL",
    "unit": "pacote",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-121",
    "name": "COPO DESCARTÁVEL",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-122",
    "name": "DESENGRAXANTE 5L",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-123",
    "name": "DESINCRUSTANTE 5L",
    "unit": "litro",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-124",
    "name": "DESINFETANTE HORTIFRUTI",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-125",
    "name": "DETERGENTE CLORADO",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-126",
    "name": "ESPONJA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-127",
    "name": "ESPONJA FIBRAÇO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-128",
    "name": "FILME PVC",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-129",
    "name": "GRAMPEADOR",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-130",
    "name": "GRAMPO",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 32
  },
  {
    "id": "prod-131",
    "name": "LUVA AMARELA G",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-132",
    "name": "LUVA AMARELA M",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-133",
    "name": "LUVA AZUL",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-134",
    "name": "LUVA PRETA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 48
  },
  {
    "id": "prod-135",
    "name": "LUVA RANHADURA G",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-136",
    "name": "LUVA VERDE",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-137",
    "name": "MAÇARICO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-138",
    "name": "MARCA TEXTO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-139",
    "name": "MÁSCARA AZUL",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 8
  },
  {
    "id": "prod-140",
    "name": "ÓCULOS PROTETOR",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-141",
    "name": "PÁ DE LIXO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-142",
    "name": "PANO DE CHÃO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-143",
    "name": "PAPEL HIGIÊNICO",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-144",
    "name": "PAPEL TOALHA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 8
  },
  {
    "id": "prod-145",
    "name": "PERFEX G",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-146",
    "name": "PILOTO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-147",
    "name": "RODO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-148",
    "name": "SABÃO NEUTRO 5L",
    "unit": "litro",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-149",
    "name": "SABÃO PARA MÃOS",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-150",
    "name": "SACO DE LIXO 100L",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-151",
    "name": "SACO DE LIXO 200L",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-152",
    "name": "SACO DE LIXO 300L",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-153",
    "name": "TOUCA DESCARTÁVEL",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-154",
    "name": "VASSOURA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0
  },
  {
    "id": "prod-155",
    "name": "BASE MILK SHAKE",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 12
  },
  {
    "id": "prod-156",
    "name": "BISCOITO MAISENA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 50
  },
  {
    "id": "prod-157",
    "name": "BLEND CARNE 150G",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 4488
  },
  {
    "id": "prod-158",
    "name": "BLEND FALAFEL 90G",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 108
  },
  {
    "id": "prod-159",
    "name": "BLEND FRANGO 90G",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 216
  },
  {
    "id": "prod-160",
    "name": "BLEND PEIXE",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 216
  },
  {
    "id": "prod-161",
    "name": "BLEND QUEIJO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 324
  },
  {
    "id": "prod-162",
    "name": "BLEND VACOMBINHO 60G",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 432
  },
  {
    "id": "prod-163",
    "name": "BOLINHO CARNE SECA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 2000
  },
  {
    "id": "prod-164",
    "name": "BOLINHO DE COSTELA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 2000
  },
  {
    "id": "prod-165",
    "name": "BOMBOM DE CHOCOLATE",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 54
  },
  {
    "id": "prod-166",
    "name": "BOX EMBALAGEM Y029",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 140
  },
  {
    "id": "prod-167",
    "name": "BROWNIE DO LUIZ",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 270
  },
  {
    "id": "prod-168",
    "name": "CAFÉ 500G",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 6
  },
  {
    "id": "prod-169",
    "name": "COPO VACA AVELUDADA C/40",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 54
  },
  {
    "id": "prod-170",
    "name": "COPO VACA MALTADA C/40",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 54
  },
  {
    "id": "prod-171",
    "name": "COPO VACA RAIZ C/40",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 54
  },
  {
    "id": "prod-172",
    "name": "COPO VACA VERMELHA C/40",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 54
  },
  {
    "id": "prod-173",
    "name": "DEL VALLE LARANJA 18UN",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 6
  },
  {
    "id": "prod-174",
    "name": "DEL VALLE UVA 18UN",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 6
  },
  {
    "id": "prod-175",
    "name": "EMBALAGEM BATATA F012",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 5400
  },
  {
    "id": "prod-176",
    "name": "EMBALAGEM FRANCROQUITOS",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 65
  },
  {
    "id": "prod-177",
    "name": "EMBALAGEM QUEIJO GOUDAN",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 130
  },
  {
    "id": "prod-178",
    "name": "EMBALAGEM R005",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 4400
  },
  {
    "id": "prod-179",
    "name": "EMBALAGEM R006",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 4400
  },
  {
    "id": "prod-180",
    "name": "EMBALAGEM R007",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 4400
  },
  {
    "id": "prod-181",
    "name": "ESTIQUETA HAMB DUPLO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 16
  },
  {
    "id": "prod-182",
    "name": "ESTIQUETA S/ALFACE",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 16
  },
  {
    "id": "prod-183",
    "name": "ETIQUETA S/CEBOLA ROLOS",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 16
  },
  {
    "id": "prod-184",
    "name": "ETIQUETA S/MOLHO ROLOS",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 16
  },
  {
    "id": "prod-185",
    "name": "ETIQUETA S/PICLES",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 16
  },
  {
    "id": "prod-186",
    "name": "ETIQUETA S/QUEIJO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 16
  },
  {
    "id": "prod-187",
    "name": "ETIQUETA S/TOMATE ROLOS",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 16
  },
  {
    "id": "prod-188",
    "name": "ETIQUETA USAR PRIMEIRO ROLOS",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 16
  },
  {
    "id": "prod-189",
    "name": "EXTRATO TOMATE 1,7",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 40
  },
  {
    "id": "prod-190",
    "name": "FARELO OREO UNI",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 216
  },
  {
    "id": "prod-191",
    "name": "FRANCROC CRUNCH",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 324
  },
  {
    "id": "prod-192",
    "name": "FRANCROC ITALIANO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 324
  },
  {
    "id": "prod-193",
    "name": "QUEIJO GOUDA",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 1728
  },
  {
    "id": "prod-194",
    "name": "ISCA DE PEIXE",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 40
  },
  {
    "id": "prod-195",
    "name": "LACRE BAIÃO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 12
  },
  {
    "id": "prod-196",
    "name": "LACRE VACA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 12
  },
  {
    "id": "prod-197",
    "name": "MARMITA C/TAMPA (100 UND)",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 12
  },
  {
    "id": "prod-198",
    "name": "NUGGET 2,5KG",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 65
  },
  {
    "id": "prod-199",
    "name": "NUTELLA 650G",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 20
  },
  {
    "id": "prod-200",
    "name": "PÃO BOLA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 356
  },
  {
    "id": "prod-201",
    "name": "PÃO SMART",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 1426
  },
  {
    "id": "prod-202",
    "name": "PÃO SUPREMO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 1782
  },
  {
    "id": "prod-203",
    "name": "PEIXE VACA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 216
  },
  {
    "id": "prod-204",
    "name": "POTE P/MOLHO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 4400
  },
  {
    "id": "prod-205",
    "name": "QUEIJO COALHO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 432
  },
  {
    "id": "prod-206",
    "name": "QUEIJO PRATO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 2592
  },
  {
    "id": "prod-207",
    "name": "SACO DE GELO",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 200
  },
  {
    "id": "prod-208",
    "name": "SACO VÁCUO G 500un",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 3
  },
  {
    "id": "prod-209",
    "name": "SACO VÁCUO M 500un",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 3
  },
  {
    "id": "prod-210",
    "name": "SACO VÁCUO P 500un",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 3
  },
  {
    "id": "prod-211",
    "name": "SACOLA BAIÃO G",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 3
  },
  {
    "id": "prod-212",
    "name": "SACOLA BAIÃO M",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 3
  },
  {
    "id": "prod-213",
    "name": "SACOLA VACA G",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 11
  },
  {
    "id": "prod-214",
    "name": "SACOLA VACA P",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 11
  },
  {
    "id": "prod-215",
    "name": "SUPORTE DE COPO MILK",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 108
  },
  {
    "id": "prod-216",
    "name": "TALHER DESCARTÁVEL",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 64
  },
  {
    "id": "prod-217",
    "name": "TAMPA COPO MILKSHAKE",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 216
  },
  {
    "id": "prod-218",
    "name": "TAMPA V051",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 4400
  },
  {
    "id": "prod-219",
    "name": "TEMPERO VACA 33G",
    "unit": "kg",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 200
  },
  {
    "id": "prod-220",
    "name": "VACOSTELA",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 432
  },
  {
    "id": "prod-221",
    "name": "VAQUINHAS VACOMBINHO",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 432
  },
  {
    "id": "prod-222",
    "name": "SOBREMESA XODÓ",
    "unit": "unidade",
    "initialStock": 0,
    "entries": 0,
    "exits": 0,
    "finalStock": 0,
    "productionTarget": 324
  }
];

// Seeded movements representing entries/exits from sheet (starts empty for fresh ledger)
export const INITIAL_MOVEMENTS: Movement[] = [];

// Seed some initial distributions representing past confirmed shipings (starts empty)
export const INITIAL_DISTRIBUTIONS: DistributionWeek[] = [];

export const mockDb = {
  init() {
    const current = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!current || JSON.parse(current).length < 20) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_MOVEMENTS));
      localStorage.setItem(STORAGE_KEYS.DISTRIBUTIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify([]));
    } else {
      // Backwards compatibility check for products missing productionTarget field
      const currentProds = JSON.parse(current);
      let changed = false;
      const updatedProds = currentProds.map((p: any) => {
        const expectedTarget = INITIAL_PRODUCTS.find(ip => ip.name === p.name)?.productionTarget || 0;
        if (expectedTarget > 0 && !p.productionTarget) {
          changed = true;
          return { ...p, productionTarget: expectedTarget };
        }
        return p;
      });
      if (changed) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProds));
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.MOVEMENTS)) {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_MOVEMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DISTRIBUTIONS)) {
      localStorage.setItem(STORAGE_KEYS.DISTRIBUTIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDITS)) {
      localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify([]));
    }
  },

  // Products CRUD
  getProducts(): Product[] {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
  },

  saveProducts(products: Product[]) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  addProduct(name: string, unit: string, initialStock: number): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name,
      unit,
      initialStock,
      entries: 0,
      exits: 0,
      finalStock: initialStock,
    };
    products.push(newProduct);
    this.saveProducts(products);
    return newProduct;
  },

  updateProduct(id: string, name: string, unit: string, initialStock?: number): Product {
    const products = this.getProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new Error('Produto não encontrado');
    }
    products[idx].name = name;
    products[idx].unit = unit;
    if (initialStock !== undefined) {
      products[idx].initialStock = initialStock;
      products[idx].finalStock = initialStock + (products[idx].entries || 0) - (products[idx].exits || 0);
    }
    this.saveProducts(products);
    return products[idx];
  },

  deleteProduct(id: string): void {
    const products = this.getProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new Error('Produto não encontrado');
    }
    const p = products[idx];
    if (p.entries > 0 || p.exits > 0) {
      throw new Error('Não é possível excluir um produto com movimentações.');
    }
    products.splice(idx, 1);
    this.saveProducts(products);
  },

  importProductsFromCSV(importedItems: { name: string; unit: string; initialStock: number }[]): Product[] {
    const products = this.getProducts();
    const newProducts: Product[] = importedItems.map((item, idx) => ({
      id: `prod-csv-${Date.now()}-${idx}`,
      name: item.name,
      unit: item.unit,
      initialStock: item.initialStock,
      entries: 0,
      exits: 0,
      finalStock: item.initialStock,
    }));
    const updatedList = [...products, ...newProducts];
    this.saveProducts(updatedList);
    return newProducts;
  },

  // Movements
  getMovements(): Movement[] {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MOVEMENTS) || '[]');
  },

  addMovement(productId: string, type: 'Entrada' | 'Saída', quantity: number, date: string, details?: { isDistribution?: boolean; destination?: string }): Movement {
    const products = this.getProducts();
    const productIndex = products.findIndex((p) => p.id === productId);
    if (productIndex === -1) {
      throw new Error('Produto não encontrado');
    }

    const product = products[productIndex];
    if (type === 'Entrada') {
      product.entries += quantity;
    } else {
      product.exits += quantity;
    }
    product.finalStock = product.initialStock + product.entries - product.exits;
    
    // Update product totals
    this.saveProducts(products);

    const movements = this.getMovements();
    const newMovement: Movement = {
      id: `mov-${Date.now()}`,
      date,
      type,
      productId,
      productName: product.name,
      quantity,
      isDistribution: details?.isDistribution || false,
      destination: details?.destination || undefined,
    };

    movements.unshift(newMovement); // newest first
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
    return newMovement;
  },

  // Distributions
  getDistributions(): DistributionWeek[] {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DISTRIBUTIONS) || '[]');
  },

  saveDistribution(destination: string, items: { [productId: string]: { [day: string]: number } }): DistributionWeek {
    const distributions = this.getDistributions();
    const id = `dist-${destination.toLowerCase()}-${Date.now()}`;
    const newDist: DistributionWeek = {
      id,
      destination,
      items,
      status: 'Pendente',
    };
    
    // Check if there is already a pending distribution for this destination
    const existingIndex = distributions.findIndex(d => d.destination === destination && d.status === 'Pendente');
    if (existingIndex !== -1) {
      distributions[existingIndex] = newDist;
    } else {
      distributions.push(newDist);
    }
    
    localStorage.setItem(STORAGE_KEYS.DISTRIBUTIONS, JSON.stringify(distributions));
    return newDist;
  },

  confirmDistribution(distId: string): DistributionWeek {
    const distributions = this.getDistributions();
    const distIndex = distributions.findIndex(d => d.id === distId);
    if (distIndex === -1) {
      throw new Error('Distribuição não encontrada');
    }

    const dist = distributions[distIndex];
    if (dist.status === 'Confirmado') {
      return dist;
    }

    // Process exits in Central Stock for all items
    const todayStr = new Date().toISOString().split('T')[0];
    
    Object.entries(dist.items).forEach(([productId, dayData]) => {
      // Sum all quantities across the week days
      const totalQty = Object.values(dayData).reduce((sum, val) => sum + (val || 0), 0);
      if (totalQty > 0) {
        this.addMovement(productId, 'Saída', totalQty, todayStr, {
          isDistribution: true,
          destination: dist.destination,
        });
      }
    });

    dist.status = 'Confirmado';
    dist.confirmedAt = new Date().toISOString();
    distributions[distIndex] = dist;

    localStorage.setItem(STORAGE_KEYS.DISTRIBUTIONS, JSON.stringify(distributions));
    return dist;
  },

  // Audits
  getAudits(): AuditRecord[] {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDITS) || '[]');
  },

  performAudit(items: { [productId: string]: { theoretical: number; physical: number } }): AuditRecord {
    const audits = this.getAudits();
    
    // Build audit record details
    const auditItems: { [productId: string]: { theoretical: number; physical: number; difference: number } } = {};
    const products = this.getProducts();

    Object.entries(items).forEach(([productId, data]) => {
      const diff = data.physical - data.theoretical;
      auditItems[productId] = {
        theoretical: data.theoretical,
        physical: data.physical,
        difference: diff,
      };

      // Real audit updates the central stock position to reflect reality.
      // If there's a difference, we adjusts the Stock.
      // In this requirements, the user says "O sistema deve calcular automaticamente a diferença e se negativa destacar em vermelho".
      // Let's also adjust the stock to match the physical count! We can do it by launching an adjustment movement,
      // or simply adjusting the initial/entries/exits. For audit purposes, let's keep it simple: we can register a adjustment movement,
      // or just save it. To not overcomplicate, we keep the audit records logged and let the stock be corrected.
      // Let's register an automatic Correction Movement or just update the finalStock.
      // Let's do a Stock Adjustment if the admin confirms! But just logging the audit is what Módulo 4 requires. Let's make it log.
      const prodIndex = products.findIndex(p => p.id === productId);
      if (prodIndex !== -1 && diff !== 0) {
        // If physical is different, we can adjust entries or exits to match the reality,
        // or just set the finalStock directly. Let's register an entry adjustment or exit adjustment:
        if (diff > 0) {
          // surplus
          products[prodIndex].entries += diff;
        } else {
          // loss (quebra)
          products[prodIndex].exits += Math.abs(diff);
        }
        products[prodIndex].finalStock = products[prodIndex].initialStock + products[prodIndex].entries - products[prodIndex].exits;
      }
    });

    this.saveProducts(products);

    const newAudit: AuditRecord = {
      id: `audit-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      items: auditItems,
    };

    audits.unshift(newAudit);
    localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(audits));
    return newAudit;
  }
};
