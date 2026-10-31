import { expect, test } from '@playwright/test'

test('создание заявки с мастером сохраняется после перезагрузки', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/overview$/)
  await expect(page.getByRole('heading', { name: 'Обзор' })).toBeVisible()

  await page.getByRole('menuitem', { name: 'Заявки' }).click()
  await expect(page).toHaveURL(/\/requests$/)

  await page.getByRole('button', { name: 'Создать заявку' }).first().click()

  const drawer = page.getByRole('dialog')
  await expect(drawer.getByText('Новая заявка')).toBeVisible()

  const submit = drawer.getByRole('button', { name: 'Создать заявку' })
  await expect(submit).toBeDisabled()

  const phone = drawer.getByLabel('Телефон')
  await phone.click()
  await phone.pressSequentially('9161234501')
  await phone.press('ArrowDown')
  await phone.press('Enter')
  await expect(phone).toHaveValue('+79161234501')

  await expect(drawer.getByLabel('Имя')).toHaveValue('Елена')
  await expect(drawer.getByLabel('Адрес выезда')).toHaveValue('ул. Ленина, 12, кв. 5')

  await drawer.getByLabel('Категория техники').click()
  const categoryOption = page.getByText('Стиральные машины')
  await expect(categoryOption).toBeVisible()
  await categoryOption.click()

  await expect(drawer.getByLabel('Мастер')).toBeEnabled()
  await drawer.getByLabel('Мастер').click()
  const masterOption = page.getByText('Смирнова Анна Викторовна')
  await expect(masterOption).toBeVisible()
  await masterOption.click()

  await drawer.getByLabel('Описание неисправности').fill('Не сливает воду после стирки.')

  await submit.click()

  await expect(page).toHaveURL(/\/requests\/[0-9a-f-]+$/)
  await expect(page.getByRole('heading', { name: 'SD-0001' })).toBeVisible()
  await expect(page.getByText('Назначена', { exact: true })).toBeVisible()

  await page.reload()

  await expect(page.getByRole('heading', { name: 'SD-0001' })).toBeVisible()
  await expect(page.getByText('Смирнова Анна Викторовна').first()).toBeVisible()
})
