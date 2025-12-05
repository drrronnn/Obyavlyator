# Метаданные объявлений - Frontend

## Что добавлено

### 1. Hook для обновления метаданных
**Файл:** `src/shared/hooks/useListingMetadata.ts`

```typescript
const updateMetadata = useUpdateListingMetadata();

updateMetadata.mutate({
  listingId: "listing-id",
  data: {
    responsible_user_id: "user-id",
    status: "in_progress"
  }
});
```

### 2. Обновленная таблица объявлений
**Файл:** `src/components/ui/AdsTable.tsx`

Добавлены колонки:
- **Ответственный** - Select с выбором сотрудника из API
- **Статус** - Select с выбором статуса (новый, в работе, завершено, отклонено)

### 3. Интеграция с API
**Файл:** `src/shared/services/listingService.ts`

Добавлены поля в интерфейс `Listing`:
```typescript
interface Listing {
  // ...
  responsible?: string | null;
  status?: string;
}
```

## Как работает

### 1. Загрузка объявлений
```typescript
const { data } = useListings(page, filters);
// data.ads содержит объявления с полями responsible и status
```

### 2. Изменение ответственного
Пользователь выбирает сотрудника из dropdown → отправляется PATCH запрос:
```
PATCH /listings/{listing_id}/metadata
{
  "responsible_user_id": "user-uuid"
}
```

### 3. Изменение статуса
Пользователь выбирает статус из dropdown → отправляется PATCH запрос:
```
PATCH /listings/{listing_id}/metadata
{
  "status": "in_progress"
}
```

### 4. Автообновление
После успешного обновления:
- Инвалидируются кэши `listings` и `favorites`
- Таблица автоматически перезагружается с новыми данными
- Показывается toast уведомление

## Статусы

- `new` - Новый
- `in_progress` - В работе
- `completed` - Завершено
- `rejected` - Отклонено

## Изоляция данных

Каждая команда (админ + сотрудники) видит только свои метаданные:
- Админ видит метаданные для своей команды
- Сотрудник видит метаданные своей команды
- Разные команды не видят метаданные друг друга

## Пример использования

```typescript
// В компоненте таблицы
const { data: employeesData } = useEmployees();
const employees = employeesData?.employees || [];

// При изменении ответственного
const handleResponsibleChange = (listingId: string, userId: string) => {
  updateMetadata.mutate({
    listingId,
    data: { responsible_user_id: userId }
  });
};

// При изменении статуса
const handleStatusChange = (listingId: string, status: string) => {
  updateMetadata.mutate({
    listingId,
    data: { status }
  });
};
```

## TODO

- [ ] Добавить фильтрацию по статусу
- [ ] Добавить фильтрацию по ответственному
- [ ] WebSocket уведомления при изменении метаданных
- [ ] История изменений в UI
