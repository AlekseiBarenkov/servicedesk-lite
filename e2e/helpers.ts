import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

type CreateRequestInput = {
  firstName: string
  phone: string
  address: string
  category: string
  description: string
  master?: string
}

export const createRequest = async (page: Page, input: CreateRequestInput): Promise<void> => {
  await page.getByRole('button', { name: 'Создать заявку' }).first().click()

  const drawer = page.getByRole('dialog')
  await expect(drawer.getByText('Новая заявка')).toBeVisible()

  await drawer.getByLabel('Имя').fill(input.firstName)
  await drawer.getByLabel('Телефон').fill(input.phone)
  await drawer.getByLabel('Адрес выезда').fill(input.address)
  await drawer.getByLabel('Описание неисправности').fill(input.description)

  await drawer.getByLabel('Категория техники').click()
  const categoryOption = page.getByText(input.category, { exact: true })
  await expect(categoryOption).toBeVisible()
  await categoryOption.click()

  if (input.master !== undefined) {
    await drawer.getByLabel('Мастер').click()
    const masterOption = page.getByText(input.master, { exact: true })
    await expect(masterOption).toBeVisible()
    await masterOption.click()
  }

  await drawer.getByRole('button', { name: 'Создать заявку' }).click()

  await expect(page).toHaveURL(/\/requests\/[0-9a-f-]+$/)
}
