import { expect, test } from '@playwright/test';

test.describe('calculator workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
  });

  test('completes calculations with buttons, keyboard, mode toggles, and history reuse', async ({
    page,
  }) => {
    const result = page.getByTestId('display-result');
    const expression = page.getByTestId('display-expression');

    await page.getByRole('button', { exact: true, name: 'Clear' }).click();
    await page.getByRole('button', { exact: true, name: 'One' }).click();
    await page.getByRole('button', { exact: true, name: 'Two' }).click();
    await page.getByRole('button', { exact: true, name: 'Add' }).click();
    await page.getByRole('button', { exact: true, name: 'Three' }).click();
    await page.getByRole('button', { exact: true, name: 'Equals' }).click();

    await expect(result).toHaveText('15');
    await expect(expression).toHaveText('12 + 3');
    await expect(page.getByRole('button', { name: 'Reuse result 15' })).toBeVisible();

    await page.getByRole('button', { name: 'Reuse result 15' }).click();
    await page.keyboard.press('*');
    await page.keyboard.press('2');
    await page.keyboard.press('Enter');

    await expect(result).toHaveText('30');
    await expect(expression).toHaveText('15 × 2');

    await page.getByRole('button', { name: 'Use radian mode' }).click();
    await expect(page.getByRole('button', { name: 'Use radian mode' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.getByRole('button', { name: 'Use degree mode' }).click();
    await expect(page.getByRole('button', { name: 'Use degree mode' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.getByRole('button', { name: 'Use scientific notation' }).click();
    await expect(page.getByRole('button', { name: 'Use scientific notation' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.getByRole('button', { exact: true, name: 'Clear' }).click();
    await page.keyboard.press('9');
    await page.keyboard.press('0');
    await page.keyboard.press('s');

    await expect(result).toHaveText('1e+0');
    await expect(expression).toHaveText('sin(90)');
    await expect(page.getByRole('button', { name: 'Reuse result 1e+0' })).toBeVisible();
  });
});
