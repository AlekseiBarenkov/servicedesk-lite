import { expect, test } from '@playwright/test'

import { createRequest } from './helpers'

test('адрес списка хранит поиск и фильтры, обзор ведёт в тот же список', async ({ page }) => {
  await page.goto('/requests')

  await createRequest(page, {
    firstName: 'Елена',
    phone: '9161234501',
    address: 'ул. Ленина, 12, кв. 5',
    category: 'Стиральные машины',
    master: 'Смирнова Анна Викторовна',
    description: 'Не сливает воду после стирки.',
  })

  await page.getByRole('link', { name: 'К заявкам' }).click()

  await createRequest(page, {
    firstName: 'Игорь',
    phone: '9161234502',
    address: 'пр. Мира, 45, кв. 18',
    category: 'Мелкая техника',
    description: 'Микроволновка не греет.',
  })

  await page.getByRole('link', { name: 'К заявкам' }).click()

  await expect(page.getByRole('link', { name: 'SD-0001' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'SD-0002' })).toBeVisible()

  const search = page.getByLabel('Поиск по номеру, клиенту или телефону')
  await search.fill('SD-0001')

  await expect(page.getByRole('link', { name: 'SD-0001' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'SD-0002' })).toHaveCount(0)
  await expect(page).toHaveURL(/q=SD-0001/)

  await page.reload()

  await expect(page.getByRole('link', { name: 'SD-0001' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'SD-0002' })).toHaveCount(0)
  await expect(page).toHaveURL(/q=SD-0001/)

  await page.getByRole('button', { name: 'Сбросить фильтры' }).click()
  await expect(page).toHaveURL(/\/requests$/)

  await expect(page.getByRole('link', { name: 'SD-0001' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'SD-0002' })).toBeVisible()

  await page.getByRole('menuitem', { name: 'Обзор' }).click()
  await page.getByRole('link', { name: /Активные/ }).click()

  await expect(page).toHaveURL(/status=new(?:,|%2C)assigned(?:,|%2C)in_progress/)
  await expect(page.getByRole('link', { name: 'SD-0001' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'SD-0002' })).toBeVisible()
})
