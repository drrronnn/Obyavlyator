export type AdStatus = "new" | "in_progress" | "rejected";

export interface Ad {
  id: number | string;
  address: string;
  price: number;
  area: number;
  rooms: number;
  dealType: "sale" | "rent";
  source: "cian" | "avito";
  status: AdStatus;
  responsible: string;
  createdAt: string;
  isFavorite: boolean;
  url?: string;
  phone_number?: string;
  isNew?: boolean;
  is_in_rent?: boolean;
}

export const dealTypeOptions = [
  { name: "Продажа", uid: "sale" },
  { name: "Аренда", uid: "rent" },
];

export const sourceOptions = [
  { name: "Циан", uid: "cian" },
  { name: "Авито", uid: "avito" },
];

export const adStatusOptions = [
  { name: "Новый", uid: "new" },
  { name: "В работе", uid: "in_progress" },
  { name: "Отклонено", uid: "rejected" },
];

export const mockAds: Ad[] = [
  {
    id: 1,
    address: "ул. Маршала Тухачевского, д. 33А",
    price: 150000,
    area: 116,
    rooms: 3,
    dealType: "rent",
    source: "cian",
    status: "new",
    responsible: "1",
    createdAt: "2025-05-18T09:31:00Z",
    isFavorite: false,
  },
  {
    id: 2,
    address: "ул. Зои и Александра Космодемьянских, д. 7, кв. 66",
    price: 70000,
    area: 46,
    rooms: 1,
    dealType: "rent",
    source: "cian",
    status: "new",
    responsible: "2",
    createdAt: "2025-05-17T19:45:00Z",
    isFavorite: true,
  },
  {
    id: 3,
    address: "ул. Народного Ополчения, д. 255, к. 1, кв. 212",
    price: 210000,
    area: 189,
    rooms: 4,
    dealType: "rent",
    source: "cian",
    status: "in_progress",
    responsible: "3",
    createdAt: "2025-05-15T19:45:00Z",
    isFavorite: true,
  },
  {
    id: 4,
    address: "ул. Народного Ополчения, д. 455",
    price: 85000,
    area: 75,
    rooms: 2,
    dealType: "rent",
    source: "avito",
    status: "new",
    responsible: "4",
    createdAt: "2025-05-14T14:20:00Z",
    isFavorite: false,
  },
  {
    id: 5,
    address: "пр. Ленинский, д. 123, кв. 45",
    price: 12500000,
    area: 95,
    rooms: 3,
    dealType: "sale",
    source: "cian",
    status: "in_progress",
    responsible: "5",
    createdAt: "2025-05-13T11:15:00Z",
    isFavorite: false,
  },
];

// Mock data for rent page (сдается) - 3 elements from general mock
export const mockRentAds: Ad[] = [
  {
    id: 1,
    address: "ул. Маршала Тухачевского, д. 33А",
    price: 150000,
    area: 116,
    rooms: 3,
    dealType: "rent",
    source: "cian",
    status: "in_progress",
    responsible: "1",
    createdAt: "2025-05-18T09:31:00Z",
    isFavorite: false,
  },
  {
    id: 2,
    address: "ул. Зои и Александра Космодемьянских, д. 7, кв. 66",
    price: 70000,
    area: 46,
    rooms: 1,
    dealType: "rent",
    source: "cian",
    status: "in_progress",
    responsible: "2",
    createdAt: "2025-05-17T19:45:00Z",
    isFavorite: true,
  },
  {
    id: 3,
    address: "ул. Народного Ополчения, д. 255, к. 1, кв. 212",
    price: 210000,
    area: 189,
    rooms: 4,
    dealType: "rent",
    source: "cian",
    status: "in_progress",
    responsible: "3",
    createdAt: "2025-05-15T19:45:00Z",
    isFavorite: true,
  },
];
