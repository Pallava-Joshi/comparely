import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as puppeteerService from '../services/puppeteerService'; // Import all exports
import * as redisService from '../services/redisService';
import * as mongoService from '../services/mongoService';
import config from '../config';
import { SessionData, SelectorConfig } from '../types'; // Import types
import {Page , Browser } from "puppeteer" ; 

const router = express.Router();
const activeBrowsers = new Map<string, { browser: Browser; page: Page; timestamp: number }>();
function getPlatform(url: string): keyof typeof config.SELECTORS | null {
  //if (url.includes('blinkit.com')) return 'blinkit';
  if (url.includes('zeptonow.com')) return 'zepto';
  //if (url.includes('swiggy.com/instamart')) return 'instamart';
  return null;
}
setInterval(() => {
    const now = Date.now();
    const timeout = 10 * 60 * 1000; 
    
    for (const [sessionId, browserData] of activeBrowsers.entries()) {
      if (now - browserData.timestamp > timeout) {
        browserData.browser.close().catch(console.error);
        activeBrowsers.delete(sessionId);
      }
    }
  }, 60000);

router.post('/login', async (req: Request, res: Response, next: NextFunction) : Promise<void>=> {
  const { phone_number } = req.body;
  if (!phone_number) {
    res.status(400).json({ status: 'ERROR', message: 'Phone number is required.' });
    return 
  }

  const sessionId = uuidv4();
  let browser: Browser | undefined;
  let page: Page | undefined;

  try {
    browser = await puppeteerService.launchBrowser();
    page = await puppeteerService.createPage(browser);

    const platform: keyof typeof config.SELECTORS = 'zepto'; 
    const selectors: SelectorConfig = config.SELECTORS[platform];

    await page.goto('https://www.zeptonow.com/');
    await page.waitForSelector(selectors.loginButton, { visible: true });
    await page.click(selectors.loginButton);

    await page.waitForSelector(selectors.phoneNumberInput, { visible: true });
    await page.type(selectors.phoneNumberInput, phone_number);

    await page.click(selectors.submitButton);

    await page.waitForSelector(selectors.otpInput, { visible: true, timeout: 15000 });

    const sessionData: SessionData = await puppeteerService.captureSession(page, phone_number , browser );
    sessionData.sessionId = sessionId; 

    await redisService.setSession(sessionId, sessionData);
    await mongoService.saveSessionToMongo(sessionData);
    activeBrowsers.set(sessionId, { 
        browser, 
        page, 
        timestamp: Date.now() 
      });
    res.json({
      status: 'OTP_SENT',
      message: 'OTP has been sent to the provided phone number.',
      sessionId: sessionId
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  } finally {
    // if (browser) {
    //   await browser.close();
    //   return 
    // }
  }
});

// POST /submit-otp/
router.post('/submit-otp', async (req: Request, res: Response, next: NextFunction) : Promise<void> =>  {
  
  
    const { otp, session_id } = req.body;
  if (!otp || !session_id) {
     res.status(400).json({ status: 'ERROR', message: 'OTP and Session ID are required.' });
     return ; 
  }

  let browser: Browser | undefined ;
  let page: Page | undefined ;

  try {
    const sessionData = await redisService.getSession(session_id);

    console.log("L 86",sessionData)
    if (!sessionData) {
      res.status(404).json({ status: 'ERROR', message: 'Session not found or expired.' });
      return 
    }
    const browserData = activeBrowsers.get(session_id);


   if (!browserData) {
      res.status(404).json({ status: 'ERROR', message: 'Browser session expired. Please restart login.' });
      return;
    }

    browser = browserData.browser;
    page = browserData.page ; 


    //await puppeteerService.restoreSession(page, sessionData , browser );

    const platform = getPlatform(sessionData.url) || 'zepto';
    const selectors: SelectorConfig = config.SELECTORS[platform];

    await page.waitForSelector(selectors.otpInput, { visible: true });
    await page.type(selectors.otpInput, otp);
    //await page.click(selectors.submitButton);
    await page.waitForSelector("#zui-modal-undefined > div > div > div > div > div > div > div:nth-child(2) > div > button" , { visible : true }) ; 
    await page.click("#zui-modal-undefined > div > div > div > div > div > div > div:nth-child(2) > div > button") ; 
    
    await page.waitForSelector(selectors.locationSelector as string , {visible : true }) ; 
    await page.click(selectors.locationSelector as string) ; 
    await page.waitForSelector(selectors.locationInput as string , {visible : true }) ; 
    await page.type(selectors.locationInput as string , "Delhi") ; 
    await page.waitForSelector(selectors.locationSelect as string , {visible : true}) ; 
    await page.click(selectors.locationSelect as string ) ; 
    await page.waitForSelector('button[class*="bg-skin-primary"][class*="w-full"]', { visible: true });
    await page.click('button[class*="bg-skin-primary"][class*="w-full"]'); 
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 });
    const finalSessionData = await puppeteerService.captureSession(page, sessionData.phoneNumber , browser);
    finalSessionData.sessionId = session_id; 

    await redisService.setSession(session_id, finalSessionData, 86400);
    await mongoService.saveSessionToMongo(finalSessionData);
    res.json({
      status: 'SUCCESS',
      message: 'User authenticated and session saved.',
      session_data: {
        cookies: finalSessionData.cookies,
        url: finalSessionData.url
      }
    });
  } catch (error) {
    console.error('OTP submission error:', error);
    next(error);
  } finally {
    if (browser) {
      //await browser.close();
     return  
    }
  }
});

export default router;