import puppeteer, { Browser, Page, CookieData } from 'puppeteer';
import { SessionData } from '../types';

const blockedResourceTypes = [
  //'image',
  //'stylesheet',
  //'font'
];

export async function launchBrowser(): Promise<Browser> {
  const browser = await puppeteer.launch({
    headless: false, 
  });
  return browser;
}

export async function createPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    // if (blockedResourceTypes.includes(request.resourceType())) {
    //   request.abort();
    // } else {
    //   request.continue();
    // }
    request.continue();
  });

  return page;
}

export async function restoreSession(page: Page, sessionData: SessionData, browser: Browser): Promise<void> {
  // First navigate to a page in the same domain to set storage
  if (sessionData && sessionData.url) {
    await page.goto(sessionData.url, { waitUntil: 'domcontentloaded' });
  }

  // Restore cookies
  if (sessionData && sessionData.cookies) {
    const cookies: CookieData[] = sessionData.cookies.map((c: any) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      expires: c.expires,
      httpOnly: c.httpOnly,
      secure: c.secure,
      session: c.session
    }));
    await browser.setCookie(...cookies);
  }

  // Restore localStorage
  if (sessionData && sessionData.localStorage) {
    await page.evaluate((localStorageData) => {
      for (const [key, value] of Object.entries(localStorageData)) {
        localStorage.setItem(key, value as string);
      }
    }, sessionData.localStorage);
  }

  // Restore sessionStorage
  if (sessionData && sessionData.sessionStorage) {
    await page.evaluate((sessionStorageData) => {
      for (const [key, value] of Object.entries(sessionStorageData)) {
        sessionStorage.setItem(key, value as string);
      }
    }, sessionData.sessionStorage);
  }

  // Reload the page to ensure all restored data is available
  if (sessionData && sessionData.url) {
    await page.reload({ waitUntil: 'domcontentloaded' });
  }
}

export async function captureSession(page: Page, phoneNumber: string, browser: Browser): Promise<SessionData> {
  // Set a test cookie
  await page.evaluate(() => {
    document.cookie = 'myCookie=MyCookieValue';
  });

  // Capture cookies
  const cookies = await browser.cookies();
  
  // Capture localStorage
  const localStorage = await page.evaluate(() => {
    const storage: Record<string, string> = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) {
        storage[key] = window.localStorage.getItem(key) || '';
      }
    }
    return storage;
  });

  // Capture sessionStorage
  const sessionStorage = await page.evaluate(() => {
    const storage: Record<string, string> = {};
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (key) {
        storage[key] = window.sessionStorage.getItem(key) || '';
      }
    }
    return storage;
  });

  const url = page.url();
  
  return { 
    sessionId: '', 
    phoneNumber, 
    cookies, 
    localStorage,
    sessionStorage,
    url  
  }; 
}