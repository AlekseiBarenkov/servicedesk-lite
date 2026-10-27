import type { Category, Client, Master, Person } from '../model/types'

export const CATEGORY_ID = {
  fridge: crypto.randomUUID(),
  washer: crypto.randomUUID(),
  dishwasher: crypto.randomUUID(),
  ac: crypto.randomUUID(),
  small: crypto.randomUUID(),
  tv: crypto.randomUUID(),
} as const

export const MASTER_ID = {
  ivanov: crypto.randomUUID(),
  smirnova: crypto.randomUUID(),
  kuznetsov: crypto.randomUUID(),
  popova: crypto.randomUUID(),
  lebedev: crypto.randomUUID(),
} as const

export const CLIENT_ID = {
  sokolova: crypto.randomUUID(),
  petrov: crypto.randomUUID(),
  grigorieva: crypto.randomUUID(),
  morozov: crypto.randomUUID(),
} as const

export const SEED_USER: Person = {
  lastName: null,
  firstName: 'Диспетчер',
  patronymic: null,
  phone: '+79161234500',
  email: null,
}

export const SEED_CATEGORIES: Category[] = [
  { categoryId: CATEGORY_ID.fridge, name: 'Холодильники' },
  { categoryId: CATEGORY_ID.washer, name: 'Стиральные машины' },
  { categoryId: CATEGORY_ID.dishwasher, name: 'Посудомоечные машины' },
  { categoryId: CATEGORY_ID.ac, name: 'Кондиционеры' },
  { categoryId: CATEGORY_ID.small, name: 'Мелкая техника' },
  { categoryId: CATEGORY_ID.tv, name: 'Телевизоры' },
]

export const SEED_MASTERS: Master[] = [
  {
    masterId: MASTER_ID.ivanov,
    lastName: 'Иванов',
    firstName: 'Пётр',
    patronymic: 'Сергеевич',
    phone: '+79161234511',
    email: 'ivanov.petr@example.com',
    categoryIds: [CATEGORY_ID.fridge],
  },
  {
    masterId: MASTER_ID.smirnova,
    lastName: 'Смирнова',
    firstName: 'Анна',
    patronymic: 'Викторовна',
    phone: '+79161234512',
    email: 'smirnova.anna@example.com',
    categoryIds: [CATEGORY_ID.washer, CATEGORY_ID.dishwasher],
  },
  {
    masterId: MASTER_ID.kuznetsov,
    lastName: 'Кузнецов',
    firstName: 'Дмитрий',
    patronymic: 'Андреевич',
    phone: '+79161234513',
    email: 'kuznetsov.dmitry@example.com',
    categoryIds: [CATEGORY_ID.ac],
  },
  {
    masterId: MASTER_ID.popova,
    lastName: 'Попова',
    firstName: 'Мария',
    patronymic: 'Игоревна',
    phone: '+79161234514',
    email: 'popova.maria@example.com',
    categoryIds: [CATEGORY_ID.small, CATEGORY_ID.washer],
  },
  {
    masterId: MASTER_ID.lebedev,
    lastName: 'Лебедев',
    firstName: 'Артём',
    patronymic: 'Олегович',
    phone: '+79161234515',
    email: 'lebedev.artem@example.com',
    categoryIds: [CATEGORY_ID.fridge, CATEGORY_ID.ac],
  },
]

export const SEED_CLIENTS: Client[] = [
  {
    clientId: CLIENT_ID.sokolova,
    lastName: 'Соколова',
    firstName: 'Елена',
    patronymic: 'Андреевна',
    phone: '+79161234501',
    email: 'sokolova.elena@example.com',
    lastAddress: 'ул. Ленина, 12, кв. 5',
  },
  {
    clientId: CLIENT_ID.petrov,
    lastName: 'Петров',
    firstName: 'Игорь',
    patronymic: 'Николаевич',
    phone: '+79161234502',
    email: 'petrov.igor@example.com',
    lastAddress: 'пр. Мира, 45, кв. 18',
  },
  {
    clientId: CLIENT_ID.grigorieva,
    lastName: 'Григорьева',
    firstName: 'Ольга',
    patronymic: 'Сергеевна',
    phone: '+79161234503',
    email: null,
    lastAddress: 'пер. Садовый, 3',
  },
  {
    clientId: CLIENT_ID.morozov,
    lastName: 'Морозов',
    firstName: 'Денис',
    patronymic: 'Владимирович',
    phone: '+79161234504',
    email: 'morozov.denis@example.com',
    lastAddress: 'ул. Гагарина, 78, кв. 22',
  },
]
