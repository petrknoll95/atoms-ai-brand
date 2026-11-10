import { test, expect, type Page } from '@playwright/test';

async function clickEmptyVisual(page: Page) {
  const hero = await page.locator('main .hero').boundingBox();
  if (!hero) throw new Error('Missing hero');
  const pins = await page.locator('#pindrop-web-pins > *').evaluateAll(elements => elements.map(el => {
    const r = el.getBoundingClientRect(); return { x:r.x+r.width/2, y:r.y+r.height/2 };
  }));
  for (const fy of [.5,.7,.3,.85]) for (const fx of [.4,.7,.85,.2]) {
    const x=hero.x+hero.width*fx, y=hero.y+hero.height*fy;
    if (pins.every(p => Math.hypot(p.x-x,p.y-y)>65)) { await page.mouse.click(x,y); return; }
  }
  throw new Error('No empty visual area for test pin');
}

test('two guests share pins and replies without signing in', async ({ browser }) => {
  const first = await browser.newContext();
  const second = await browser.newContext();
  const a = await first.newPage();
  const b = await second.newPage();
  const marker = `Feedback check ${Date.now()}`;
  await a.goto('logo/');
  await a.getByRole('button', { name: 'Feedback', exact: true }).click();
  await a.getByRole('button', { name: /Comment mode/ }).click();
  await expect(a.locator('#pindrop-web-overlay')).toBeVisible();
  await clickEmptyVisual(a);
  await a.getByPlaceholder('Enter your name').fill('Test reviewer A');
  await a.getByRole('button', { name: 'Save', exact: true }).click();
  await a.getByPlaceholder('Add a comment...').fill(marker);
  await a.getByRole('button', { name: 'Send comment', exact: true }).click();
  await expect(a.getByText('Shared feedback · Saved', { exact:true })).toBeVisible();
  await b.goto('logo/');
  await b.getByRole('button', { name: 'Feedback', exact: true }).click();
  await b.getByRole('button', { name: /Review mode/ }).click();
  await b.locator('#pindrop-web-root').getByText(marker, { exact:true }).click();
  await b.getByPlaceholder('Reply...').fill('Second guest reply');
  await b.getByRole('button', { name: 'Send comment', exact:true }).click();
  await b.getByPlaceholder('Enter your name').fill('Test reviewer B');
  await b.getByRole('button', { name:'Save', exact:true }).click();
  await expect(b.getByText('Shared feedback · Saved', {exact:true})).toBeVisible();
  await a.reload();
  await a.getByRole('button', { name: 'Feedback', exact:true }).click();
  await a.getByRole('button', { name: /Review mode/ }).click();
  await a.locator('#pindrop-web-root').getByText(marker, { exact:true }).click();
  await expect(a.locator('#pindrop-web-root').getByText('Second guest reply', {exact:true})).toBeVisible();
  await a.getByRole('button', { name: 'View mode — interact with prototype', exact:true }).click();
  const pin = a.locator('#pindrop-web-pins > [data-comment-id]').filter({ visible:true }).first();
  await expect(pin).toBeVisible();
  await expect(a.locator('#pindrop-web-overlay')).toBeHidden();
  await pin.click();
  await expect(a.getByPlaceholder('Reply...')).toBeVisible();
  await a.getByRole('button',{name:'Close feedback',exact:true}).click();
  await expect(a.locator('#pindrop-web-pins')).toBeHidden();
  await a.getByRole('button',{name:'Feedback',exact:true}).click();
  await expect(pin).toBeVisible();
  await a.getByRole('button',{name:'Close feedback',exact:true}).click();
  await a.goto('color/');
  await a.getByRole('button',{name:'Feedback',exact:true}).click();
  await a.getByRole('button',{name:/Review mode/}).click();
  await expect(a.locator('#pindrop-web-root').getByText(marker,{exact:true})).toHaveCount(0);
  await first.close(); await second.close();
});


test('mobile guest can pin a visual and reopen hidden feedback', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  await page.goto('color/');
  await page.getByRole('button',{name:'Feedback',exact:true}).click();
  await page.getByRole('button',{name:/Comment mode/}).click();
  await clickEmptyVisual(page);
  await page.getByPlaceholder('Enter your name').fill('Mobile verification');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  const marker = `Mobile feedback check ${Date.now()}`;
  await page.getByPlaceholder('Add a comment...').fill(marker);
  await page.getByRole('button',{name:'Send comment',exact:true}).click();
  await expect(page.getByText('Shared feedback · Saved',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Close feedback',exact:true}).click();
  await page.getByRole('button',{name:'Feedback',exact:true}).click();
  await page.getByRole('button',{name:/Review mode/}).click();
  await expect(page.locator('#pindrop-web-root').getByText(marker, {exact:true})).toBeVisible();
});
