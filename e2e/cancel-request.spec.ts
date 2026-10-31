import { expect, test } from '@playwright/test'

import { createRequest } from './helpers'

test('заявка отменяется с причиной, у конечного статуса нет действий', async ({ page }) => {
  await page.goto('/requests')

  await createRequest(page, {
    firstName: 'Игорь',
    phone: '9161234502',
    address: 'пр. Мира, 45, кв. 18',
    category: 'Мелкая техника',
    description: 'Микроволновка не греет.',
  })

  await expect(page.getByText('Новая', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'В работу' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Отменить' }).click()

  const dialog = page.getByRole('dialog')
  const confirm = dialog.getByRole('button', { name: 'Отменить' })
  await expect(confirm).toBeDisabled()

  await dialog.getByPlaceholder('Причина отмены').fill('Клиент купил новую технику.')
  await expect(confirm).toBeEnabled()
  await confirm.click()

  await expect(page.getByText('Отменена', { exact: true })).toBeVisible()
  await expect(page.getByText('Причина отмены', { exact: true })).toBeVisible()
  await expect(page.getByRole('main').getByText('Клиент купил новую технику.', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Отменить' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Редактировать' })).toHaveCount(0)
})
