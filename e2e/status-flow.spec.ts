import { expect, test } from '@playwright/test'

import { createRequest } from './helpers'

test('заявка проходит путь до выполнения с обязательным результатом', async ({ page }) => {
  await page.goto('/requests')

  await createRequest(page, {
    firstName: 'Елена',
    phone: '9161234501',
    address: 'ул. Ленина, 12, кв. 5',
    category: 'Стиральные машины',
    master: 'Смирнова Анна Викторовна',
    description: 'Сильно шумит при отжиме.',
  })

  await expect(page.getByText('Назначена', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'В работу' }).click()
  await expect(page.getByText('В работе', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Выполнить' }).click()

  const dialog = page.getByRole('dialog')
  const confirm = dialog.getByRole('button', { name: 'Выполнить' })
  await expect(confirm).toBeDisabled()

  await dialog.getByPlaceholder('Что сделано').fill('Заменён подшипник.')
  await expect(confirm).toBeEnabled()
  await confirm.click()

  await expect(page.getByText('Выполнена', { exact: true })).toBeVisible()
  await expect(page.getByText('Результат', { exact: true })).toBeVisible()
  await expect(page.getByRole('main').getByText('Заменён подшипник.', { exact: true })).toBeVisible()
  await expect(page.getByText('Статус изменён: В работе → Выполнена', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Отменить' })).toHaveCount(0)
})
