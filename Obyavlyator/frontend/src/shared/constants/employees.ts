export interface Employee {
  id: number;
  name: string;
  role: string;
  team: string;
  status: 'active' | 'paused' | 'vacation';
  age: string;
  avatar: string;
  email: string;
  phone?: string;
  salary?: string;
  hireDate?: string;
}

export const employees: Employee[] = [
  {
    id: 1,
    name: "Антон Рейхерт",
    role: "CEO",
    team: "Управление",
    status: "active",
    age: "29",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    email: "anton.reichert@example.com",
    phone: "+7 (999) 123-45-67",
    salary: "250000",
    hireDate: "2020-01-15"
  },
  {
    id: 2,
    name: "Зоя Ланг",
    role: "Tech Lead",
    team: "Разработка",
    status: "paused",
    age: "25",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    email: "zoya.lang@example.com",
    phone: "+7 (999) 234-56-78",
    salary: "180000",
    hireDate: "2021-03-10"
  },
  {
    id: 3,
    name: "Джейн Фишер",
    role: "Sr. Dev",
    team: "Разработка",
    status: "active",
    age: "22",
    avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d",
    email: "jane.fisher@example.com",
    phone: "+7 (999) 345-67-89",
    salary: "150000",
    hireDate: "2022-06-01"
  },
  {
    id: 4,
    name: "Уильям Ховард",
    role: "Менеджер",
    team: "Маркетинг",
    status: "vacation",
    age: "28",
    avatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d",
    email: "william.howard@example.com",
    phone: "+7 (999) 456-78-90",
    salary: "120000",
    hireDate: "2021-09-15"
  },
  {
    id: 5,
    name: "Кристен Купер",
    role: "Менеджер по продажам",
    team: "Продажи",
    status: "active",
    age: "24",
    avatar: "https://i.pravatar.cc/150?u=a092581d4ef9026700d",
    email: "kristen.cooper@example.com",
    phone: "+7 (999) 567-89-01",
    salary: "110000",
    hireDate: "2022-01-20"
  },
  {
    id: 6,
    name: "Брайан Ким",
    role: "Менеджер проекта",
    team: "Управление",
    age: "29",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    email: "brian.kim@example.com",
    status: "active",
    phone: "+7 (999) 678-90-12",
    salary: "140000",
    hireDate: "2020-11-05"
  },
  {
    id: 7,
    name: "Майкл Хант",
    role: "Дизайнер",
    team: "Дизайн",
    status: "paused",
    age: "27",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29027007d",
    email: "michael.hunt@example.com",
    phone: "+7 (999) 789-01-23",
    salary: "95000",
    hireDate: "2021-07-12"
  },
  {
    id: 8,
    name: "Саманта Брукс",
    role: "HR Менеджер",
    team: "HR",
    status: "active",
    age: "31",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e27027008d",
    email: "samantha.brooks@example.com",
    phone: "+7 (999) 890-12-34",
    salary: "130000",
    hireDate: "2020-04-08"
  },
  {
    id: 9,
    name: "Фрэнк Харрисон",
    role: "Финансовый менеджер",
    team: "Финансы",
    status: "vacation",
    age: "33",
    avatar: "https://i.pravatar.cc/150?img=4",
    email: "frank.harrison@example.com",
    phone: "+7 (999) 901-23-45",
    salary: "160000",
    hireDate: "2019-12-03"
  },
  {
    id: 10,
    name: "Эмма Адамс",
    role: "Операционный менеджер",
    team: "Операции",
    status: "active",
    age: "35",
    avatar: "https://i.pravatar.cc/150?img=5",
    email: "emma.adams@example.com",
    phone: "+7 (999) 012-34-56",
    salary: "145000",
    hireDate: "2020-08-17"
  }
];

export const employeeColumns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "ИМЯ", uid: "name", sortable: true },
  { name: "ВОЗРАСТ", uid: "age", sortable: true },
  { name: "РОЛЬ", uid: "role", sortable: true },
  { name: "КОМАНДА", uid: "team" },
  { name: "EMAIL", uid: "email" },
  { name: "СТАТУС", uid: "status", sortable: true },
  { name: "ДЕЙСТВИЯ", uid: "actions" },
];

export const statusOptions = [
  { name: "Активный", uid: "active" },
  { name: "Приостановлен", uid: "paused" },
  { name: "В отпуске", uid: "vacation" },
];

export const teamOptions = [
  { name: "Управление", uid: "management" },
  { name: "Разработка", uid: "development" },
  { name: "Дизайн", uid: "design" },
  { name: "Маркетинг", uid: "marketing" },
  { name: "Продажи", uid: "sales" },
  { name: "HR", uid: "hr" },
  { name: "Финансы", uid: "finance" },
  { name: "Операции", uid: "operations" },
];