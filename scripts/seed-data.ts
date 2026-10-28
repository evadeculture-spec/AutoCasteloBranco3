import type { FeatureCategoryKey } from "../src/lib/labels";

export type SeedVehicle = {
  brand: string;
  model: string;
  version: string;
  year: number;
  month: number;
  km: number;
  price: number;
  previousPrice?: number;
  fuel: "gasolina" | "gasoleo" | "hibrido" | "hibrido_plugin" | "eletrico" | "gpl";
  gearbox: "manual" | "automatica";
  bodyType: "citadino" | "utilitario" | "berlina" | "carrinha" | "suv" | "monovolume" | "coupe" | "comercial";
  powerHp: number;
  engineCc?: number;
  batteryKwh?: number;
  rangeKm?: number;
  doors: number;
  seats: number;
  color: string;
  colorHex: string;
  trimHex: string;
  consumption: string;
  co2?: number;
  warrantyMonths: number;
  vatDeductible?: boolean;
  owners: number;
  status?: "disponivel" | "reservado" | "vendido" | "rascunho";
  featured?: boolean;
  description: string;
  features: Partial<Record<FeatureCategoryKey, string[]>>;
};

const BASE_SAFETY = ["ABS e ESP", "Airbags frontais e laterais", "Sistema Isofix", "Aviso de saída de faixa"];
const BASE_COMFORT = ["Ar condicionado", "Vidros elétricos", "Fecho centralizado com comando"];
const BASE_MEDIA = ["Bluetooth", "Apple CarPlay e Android Auto", "Entrada USB"];

export const SEED_VEHICLES: SeedVehicle[] = [
  {
    brand: "Peugeot", model: "208", version: "1.2 PureTech Allure", year: 2021, month: 5, km: 48300, price: 15900,
    fuel: "gasolina", gearbox: "manual", bodyType: "citadino", powerHp: 100, engineCc: 1199, doors: 5, seats: 5,
    color: "Branco Nacarado", colorHex: "#e6e4de", trimHex: "#3a3b3f", consumption: "5,4 l/100 km", co2: 122, warrantyMonths: 18, owners: 1,
    featured: true,
    description: "Citadino com um só dono, revisões feitas na marca e depois na nossa oficina. Pneus dianteiros novos e travões revistos na entrega.",
    features: {
      seguranca: [...BASE_SAFETY, "Travagem automática de emergência", "Reconhecimento de sinais de trânsito"],
      conforto: [...BASE_COMFORT, "Ar condicionado automático", "Cruise control", "Sensores de estacionamento traseiros"],
      multimedia: [...BASE_MEDIA, "Ecrã tátil de 7\"", "Painel de instrumentos digital"],
      exterior: ["Jantes de liga leve 16\"", "Faróis LED", "Vidros traseiros escurecidos"],
    },
  },
  {
    brand: "Renault", model: "Clio", version: "1.0 TCe Intens", year: 2020, month: 9, km: 62100, price: 13400, previousPrice: 13900,
    fuel: "gasolina", gearbox: "manual", bodyType: "citadino", powerHp: 90, engineCc: 999, doors: 5, seats: 5,
    color: "Vermelho Flamme", colorHex: "#a3282c", trimHex: "#2f3034", consumption: "5,2 l/100 km", co2: 118, warrantyMonths: 18, owners: 1,
    description: "Clio de 5.ª geração em ótimo estado, ideal para cidade e estrada. Inspeção multipontos aprovada e revisão completa com óleo e filtros.",
    features: {
      seguranca: [...BASE_SAFETY, "Travagem automática de emergência"],
      conforto: [...BASE_COMFORT, "Cruise control com limitador", "Cartão mãos-livres", "Câmara de marcha-atrás"],
      multimedia: [...BASE_MEDIA, "Sistema EASY LINK 7\""],
      exterior: ["Jantes de liga leve 16\"", "Faróis LED Pure Vision"],
    },
  },
  {
    brand: "Volkswagen", model: "Golf", version: "2.0 TDI Life", year: 2021, month: 3, km: 78500, price: 21900,
    fuel: "gasoleo", gearbox: "manual", bodyType: "utilitario", powerHp: 115, engineCc: 1968, doors: 5, seats: 5,
    color: "Cinzento Lua", colorHex: "#8a8f96", trimHex: "#2b2c30", consumption: "4,3 l/100 km", co2: 112, warrantyMonths: 24, owners: 1,
    featured: true,
    description: "Golf 8 com motor TDI económico e equipamento muito completo. Livro de revisões em dia, distribuição verificada.",
    features: {
      seguranca: [...BASE_SAFETY, "Front Assist", "Lane Assist", "Detetor de fadiga"],
      conforto: [...BASE_COMFORT, "Climatronic bizona", "Cruise control adaptativo", "Sensores de estacionamento dianteiros e traseiros", "Arranque sem chave"],
      multimedia: [...BASE_MEDIA, "Digital Cockpit", "Navegação com ecrã de 10\"", "Carregamento sem fios"],
      exterior: ["Jantes de liga leve 16\"", "Faróis LED"],
    },
  },
  {
    brand: "Seat", model: "Arona", version: "1.0 TSI FR DSG", year: 2022, month: 6, km: 35200, price: 20500,
    fuel: "gasolina", gearbox: "automatica", bodyType: "suv", powerHp: 110, engineCc: 999, doors: 5, seats: 5,
    color: "Azul Safira", colorHex: "#2f4f7f", trimHex: "#2a2b2f", consumption: "5,8 l/100 km", co2: 131, warrantyMonths: 24, owners: 1,
    description: "SUV compacto com caixa automática DSG de 7 velocidades e acabamento desportivo FR. Ainda com garantia de fábrica até ao fim de 2026.",
    features: {
      seguranca: [...BASE_SAFETY, "Assistente de arranque em subida", "Travagem automática de emergência"],
      conforto: [...BASE_COMFORT, "Climatronic", "Câmara de marcha-atrás", "Modos de condução"],
      multimedia: [...BASE_MEDIA, "Digital Cockpit", "Ecrã tátil de 9,2\""],
      exterior: ["Jantes de liga leve 18\" FR", "Tejadilho em cor contrastante", "Faróis full LED"],
    },
  },
  {
    brand: "Toyota", model: "C-HR", version: "1.8 Hybrid Comfort", year: 2020, month: 2, km: 71000, price: 22900,
    fuel: "hibrido", gearbox: "automatica", bodyType: "suv", powerHp: 122, engineCc: 1798, doors: 5, seats: 5,
    color: "Branco Pérola", colorHex: "#efede6", trimHex: "#2c2d31", consumption: "4,9 l/100 km", co2: 110, warrantyMonths: 24, owners: 1,
    featured: true,
    description: "Híbrido auto-recarregável com consumos muito baixos em cidade. Teste de bateria híbrida efetuado na nossa oficina com relatório disponível.",
    features: {
      seguranca: [...BASE_SAFETY, "Toyota Safety Sense", "Cruise control adaptativo", "Reconhecimento de sinais"],
      conforto: [...BASE_COMFORT, "Ar condicionado automático bizona", "Câmara de marcha-atrás", "Retrovisores rebatíveis eletricamente"],
      multimedia: [...BASE_MEDIA, "Ecrã tátil de 8\""],
      exterior: ["Jantes de liga leve 17\"", "Faróis LED"],
    },
  },
  {
    brand: "Toyota", model: "Yaris", version: "1.5 Hybrid Comfort", year: 2022, month: 4, km: 29800, price: 18500,
    fuel: "hibrido", gearbox: "automatica", bodyType: "citadino", powerHp: 116, engineCc: 1490, doors: 5, seats: 5,
    color: "Cinzento Escuro", colorHex: "#55595f", trimHex: "#2c2d31", consumption: "3,9 l/100 km", co2: 89, warrantyMonths: 24, owners: 1,
    description: "O citadino híbrido mais eficiente do stand. Poucos quilómetros, interior impecável e ainda com garantia Toyota.",
    features: {
      seguranca: [...BASE_SAFETY, "Toyota Safety Sense", "Airbag central dianteiro"],
      conforto: [...BASE_COMFORT, "Ar condicionado automático", "Câmara de marcha-atrás"],
      multimedia: [...BASE_MEDIA, "Ecrã tátil de 8\""],
      exterior: ["Jantes de liga leve 16\"", "Faróis LED"],
    },
  },
  {
    brand: "BMW", model: "Série 3 Touring", version: "320d Line Sport Auto", year: 2019, month: 11, km: 112000, price: 26900, previousPrice: 27900,
    fuel: "gasoleo", gearbox: "automatica", bodyType: "carrinha", powerHp: 190, engineCc: 1995, doors: 5, seats: 5,
    color: "Preto Safira", colorHex: "#26282c", trimHex: "#3a2c24", consumption: "4,8 l/100 km", co2: 126, warrantyMonths: 18, owners: 2,
    featured: true,
    description: "Carrinha familiar com motor 320d e caixa automática de 8 velocidades. Histórico completo, última revisão com substituição de óleo da caixa.",
    features: {
      seguranca: [...BASE_SAFETY, "Driving Assistant", "Aviso de colisão frontal"],
      conforto: [...BASE_COMFORT, "Climatização automática tri-zona", "Bancos desportivos aquecidos", "Portão traseiro elétrico", "Sensores de estacionamento dianteiros e traseiros"],
      multimedia: [...BASE_MEDIA, "BMW Live Cockpit Professional", "Navegação"],
      interior: ["Estofos em pele Vernasca", "Volante desportivo em pele"],
      exterior: ["Jantes de liga leve 18\"", "Faróis LED", "Barras de tejadilho"],
    },
  },
  {
    brand: "Mercedes-Benz", model: "Classe A", version: "A 180 d Style Auto", year: 2020, month: 7, km: 84000, price: 23500,
    fuel: "gasoleo", gearbox: "automatica", bodyType: "utilitario", powerHp: 116, engineCc: 1461, doors: 5, seats: 5,
    color: "Prata Íris", colorHex: "#b8bcc2", trimHex: "#2b2c30", consumption: "4,4 l/100 km", co2: 115, warrantyMonths: 18, owners: 1,
    status: "reservado",
    description: "Classe A com sistema MBUX e caixa automática 7G-DCT. Viatura reservada — contacte-nos para alternativas semelhantes.",
    features: {
      seguranca: [...BASE_SAFETY, "Active Brake Assist", "Assistente de ângulo morto"],
      conforto: [...BASE_COMFORT, "Ar condicionado automático", "Câmara de marcha-atrás", "Iluminação ambiente"],
      multimedia: [...BASE_MEDIA, "MBUX com dois ecrãs de 7\"", "Comando por voz"],
      exterior: ["Jantes de liga leve 17\"", "Faróis LED High Performance"],
    },
  },
  {
    brand: "Dacia", model: "Sandero Stepway", version: "1.0 TCe Comfort Bi-Fuel", year: 2022, month: 1, km: 41000, price: 14200,
    fuel: "gpl", gearbox: "manual", bodyType: "utilitario", powerHp: 100, engineCc: 999, doors: 5, seats: 5,
    color: "Laranja Arizona", colorHex: "#b8642f", trimHex: "#2b2c30", consumption: "7,0 l/100 km (GPL)", co2: 113, warrantyMonths: 24, owners: 1,
    description: "Bi-fuel gasolina/GPL de fábrica: depósito de GPL com 40 l e autonomia combinada superior a 1000 km. Custo por quilómetro imbatível.",
    features: {
      seguranca: [...BASE_SAFETY],
      conforto: [...BASE_COMFORT, "Cruise control", "Sensores de estacionamento traseiros", "Barras de tejadilho modulares"],
      multimedia: [...BASE_MEDIA, "Media Display 8\""],
      exterior: ["Jantes de 16\" Flex", "Proteções de carroçaria"],
    },
  },
  {
    brand: "Dacia", model: "Duster", version: "1.5 Blue dCi Prestige", year: 2021, month: 10, km: 68000, price: 17900,
    fuel: "gasoleo", gearbox: "manual", bodyType: "suv", powerHp: 115, engineCc: 1461, doors: 5, seats: 5,
    color: "Cinzento Cometa", colorHex: "#6d7176", trimHex: "#2b2c30", consumption: "4,7 l/100 km", co2: 123, warrantyMonths: 18, owners: 1,
    status: "vendido",
    description: "SUV robusto e económico.",
    features: { seguranca: [...BASE_SAFETY], conforto: [...BASE_COMFORT, "Câmara multiview"], multimedia: [...BASE_MEDIA] },
  },
  {
    brand: "Renault", model: "Grand Scénic", version: "1.7 Blue dCi Intens 7L", year: 2019, month: 6, km: 98000, price: 16900,
    fuel: "gasoleo", gearbox: "manual", bodyType: "monovolume", powerHp: 120, engineCc: 1749, doors: 5, seats: 7,
    color: "Azul Cosmos", colorHex: "#2b3d5c", trimHex: "#2b2c30", consumption: "4,9 l/100 km", co2: 128, warrantyMonths: 18, owners: 1,
    description: "Monovolume de 7 lugares para famílias grandes. Bancos da 3.ª fila rebatíveis no piso, revisão completa e embraiagem verificada.",
    features: {
      seguranca: [...BASE_SAFETY, "Alerta de distância de segurança", "Travagem de emergência ativa"],
      conforto: [...BASE_COMFORT, "Ar condicionado automático bizona", "Mesas tipo avião", "Cartão mãos-livres", "Teto panorâmico"],
      multimedia: [...BASE_MEDIA, "R-Link 2 com navegação"],
      exterior: ["Jantes de 20\"", "Faróis LED"],
    },
  },
  {
    brand: "Peugeot", model: "3008", version: "1.5 BlueHDi GT Line EAT8", year: 2021, month: 2, km: 73000, price: 25900,
    fuel: "gasoleo", gearbox: "automatica", bodyType: "suv", powerHp: 130, engineCc: 1499, doors: 5, seats: 5,
    color: "Cinzento Platinium", colorHex: "#7b8087", trimHex: "#2a2b2f", consumption: "5,0 l/100 km", co2: 131, warrantyMonths: 24, owners: 1,
    featured: true,
    description: "SUV familiar com acabamento GT Line e caixa automática EAT8. i-Cockpit, câmara 180° e portão elétrico.",
    features: {
      seguranca: [...BASE_SAFETY, "Cruise control adaptativo com Stop&Go", "Vigilância de ângulo morto"],
      conforto: [...BASE_COMFORT, "Ar condicionado automático bizona", "Portão traseiro mãos-livres", "Câmara 180°", "Bancos com massagem"],
      multimedia: [...BASE_MEDIA, "i-Cockpit digital 12,3\"", "Navegação 3D", "Carregamento por indução"],
      exterior: ["Jantes de liga leve 18\" diamantadas", "Faróis full LED", "Tejadilho preto"],
    },
  },
  {
    brand: "Renault", model: "Zoe", version: "R110 Zen 52 kWh", year: 2020, month: 12, km: 52000, price: 15900,
    fuel: "eletrico", gearbox: "automatica", bodyType: "citadino", powerHp: 108, batteryKwh: 52, rangeKm: 395, doors: 5, seats: 5,
    color: "Verde Celadon", colorHex: "#5f7a6c", trimHex: "#2b2c30", consumption: "17,2 kWh/100 km", co2: 0, warrantyMonths: 24, vatDeductible: true, owners: 1,
    description: "Elétrico com bateria própria (sem aluguer) de 52 kWh. Teste de estado da bateria (SOH 92 %) efetuado na nossa oficina.",
    features: {
      seguranca: [...BASE_SAFETY],
      conforto: [...BASE_COMFORT, "Ar condicionado automático", "Bomba de calor", "Sensores de estacionamento traseiros"],
      multimedia: [...BASE_MEDIA, "EASY LINK 9,3\" com navegação"],
      outros: ["Carregador CCS 50 kW", "Cabo de carregamento tipo 2"],
    },
  },
  {
    brand: "Volkswagen", model: "ID.3", version: "Pro Performance 58 kWh", year: 2021, month: 8, km: 46000, price: 22900,
    fuel: "eletrico", gearbox: "automatica", bodyType: "utilitario", powerHp: 204, batteryKwh: 58, rangeKm: 420, doors: 5, seats: 5,
    color: "Cinzento Moonstone", colorHex: "#9a9ea3", trimHex: "#2b2c30", consumption: "15,4 kWh/100 km", co2: 0, warrantyMonths: 24, vatDeductible: true, owners: 1,
    description: "Elétrico com tração traseira e carregamento rápido até 120 kW. Garantia da bateria até 8 anos / 160 000 km.",
    features: {
      seguranca: [...BASE_SAFETY, "Travel Assist", "Front Assist"],
      conforto: [...BASE_COMFORT, "Climatronic bizona", "Bomba de calor", "Câmara de marcha-atrás", "Arranque sem chave"],
      multimedia: [...BASE_MEDIA, "Navegação Discover Pro 10\"", "Carregamento sem fios"],
      outros: ["Carregamento DC 120 kW", "Cabo modo 3"],
    },
  },
  {
    brand: "Peugeot", model: "e-208", version: "GT 50 kWh", year: 2021, month: 11, km: 38000, price: 19900,
    fuel: "eletrico", gearbox: "automatica", bodyType: "citadino", powerHp: 136, batteryKwh: 50, rangeKm: 340, doors: 5, seats: 5,
    color: "Amarelo Faro", colorHex: "#c9a23a", trimHex: "#2a2b2f", consumption: "16,4 kWh/100 km", co2: 0, warrantyMonths: 24, vatDeductible: true, owners: 1,
    description: "Versão GT com i-Cockpit 3D e carregamento rápido de 100 kW. Excelente para deslocações diárias na região.",
    features: {
      seguranca: [...BASE_SAFETY, "Cruise control adaptativo", "Travagem automática de emergência"],
      conforto: [...BASE_COMFORT, "Ar condicionado automático", "Bomba de calor", "Câmara de marcha-atrás"],
      multimedia: [...BASE_MEDIA, "i-Cockpit 3D", "Ecrã tátil de 10\""],
      exterior: ["Jantes de liga leve 17\"", "Faróis full LED com garras"],
    },
  },
  {
    brand: "Mercedes-Benz", model: "GLC", version: "300 de 4MATIC AMG Line", year: 2020, month: 5, km: 89000, price: 39900, previousPrice: 41500,
    fuel: "hibrido_plugin", gearbox: "automatica", bodyType: "suv", powerHp: 306, engineCc: 1950, batteryKwh: 13, rangeKm: 43, doors: 5, seats: 5,
    color: "Preto Obsidiana", colorHex: "#232528", trimHex: "#3a3b3f", consumption: "1,9 l/100 km (ponderado)", co2: 50, warrantyMonths: 18, vatDeductible: true, owners: 1,
    description: "Híbrido plug-in a gasóleo com tração integral e acabamento AMG Line. IVA dedutível para empresas (dentro dos limites legais).",
    features: {
      seguranca: [...BASE_SAFETY, "Pacote de assistência à condução", "Câmara 360°"],
      conforto: [...BASE_COMFORT, "Climatização THERMATIC", "Bancos dianteiros aquecidos e elétricos", "Portão elétrico EASY-PACK"],
      multimedia: [...BASE_MEDIA, "MBUX 10,25\"", "Head-up display"],
      interior: ["Estofos em pele ARTICO/microfibra", "Iluminação ambiente 64 cores"],
      exterior: ["Jantes AMG de 19\"", "Faróis MULTIBEAM LED"],
    },
  },
  {
    brand: "Citroën", model: "Berlingo Van", version: "1.5 BlueHDi Driver 3 lugares", year: 2021, month: 4, km: 87000, price: 15900,
    fuel: "gasoleo", gearbox: "manual", bodyType: "comercial", powerHp: 100, engineCc: 1499, doors: 4, seats: 3,
    color: "Branco Banquise", colorHex: "#ecebe7", trimHex: "#2b2c30", consumption: "5,2 l/100 km", co2: 137, warrantyMonths: 12, vatDeductible: true, owners: 1,
    description: "Comercial ligeiro de 3 lugares com divisória de carga e porta lateral. IVA dedutível. Pronto a trabalhar.",
    features: {
      seguranca: [...BASE_SAFETY],
      conforto: ["Ar condicionado", "Vidros elétricos", "Sensores de estacionamento traseiros", "Banco do passageiro duplo"],
      multimedia: ["Bluetooth", "Rádio com comandos no volante"],
      outros: ["Divisória de carga", "Porta lateral deslizante", "Argolas de fixação"],
    },
  },
  {
    brand: "Fiat", model: "500", version: "1.0 Hybrid Dolcevita", year: 2021, month: 6, km: 27000, price: 12900,
    fuel: "hibrido", gearbox: "manual", bodyType: "citadino", powerHp: 70, engineCc: 999, doors: 3, seats: 4,
    color: "Verde Rugiada", colorHex: "#9fb3a6", trimHex: "#d9d2c4", consumption: "5,3 l/100 km", co2: 120, warrantyMonths: 18, owners: 1,
    description: "Citadino mild-hybrid com teto de abrir panorâmico e interior em tons claros. Poucos quilómetros, como novo.",
    features: {
      seguranca: [...BASE_SAFETY],
      conforto: [...BASE_COMFORT, "Teto de abrir panorâmico", "Sensores de estacionamento traseiros"],
      multimedia: [...BASE_MEDIA, "Uconnect 7\""],
      exterior: ["Jantes de liga leve 16\"", "Frisos cromados"],
    },
  },
];

export const SEED_SERVICES = [
  { slug: "revisao-completa", name: "Revisão completa", description: "Mudança de óleo e filtros (óleo, ar, habitáculo e combustível), verificação de 40 pontos e reposição de níveis.", priceFrom: 139, durationMinutes: 120 },
  { slug: "mudanca-oleo", name: "Mudança de óleo e filtro", description: "Óleo de especificação do fabricante e filtro de óleo. Inclui verificação de níveis e pressão dos pneus.", priceFrom: 69, durationMinutes: 60 },
  { slug: "travoes", name: "Pastilhas e discos de travão", description: "Substituição de pastilhas e/ou discos, com verificação do líquido de travões.", priceFrom: 89, durationMinutes: 90 },
  { slug: "diagnostico", name: "Diagnóstico eletrónico", description: "Leitura de avarias com equipamento multimarca e relatório explicado ao cliente.", priceFrom: 35, durationMinutes: 60 },
  { slug: "pre-inspecao", name: "Pré-inspeção (IPO)", description: "Verificação dos pontos da inspeção periódica obrigatória para evitar reprovações.", priceFrom: 29, durationMinutes: 60 },
  { slug: "ar-condicionado", name: "Carga de ar condicionado", description: "Verificação de fugas, vácuo e carga de gás. Inclui higienização do circuito.", priceFrom: 59, durationMinutes: 60 },
  { slug: "pneus", name: "Pneus e alinhamento", description: "Montagem, equilibragem e alinhamento de direção. Pneus de várias gamas sob consulta.", priceFrom: 25, durationMinutes: 60 },
  { slug: "hibridos-eletricos", name: "Check-up híbridos e elétricos", description: "Teste do estado da bateria de alta tensão (SOH), sistema de refrigeração e travagem regenerativa.", priceFrom: 49, durationMinutes: 60 },
];
