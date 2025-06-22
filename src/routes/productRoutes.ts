import express, { Request, Response, NextFunction } from 'express';
import * as puppeteerService from '../services/puppeteerService';
import * as redisService from '../services/redisService';
import * as mongoService from '../services/mongoService';
import config from '../config';
import { AddProductsRequestBody, SessionData, SelectorConfig, CartDetails } from '../types';
import {Browser , Page} from "puppeteer" ; 

const router = express.Router();

function getPlatform(url: string): keyof typeof config.SELECTORS | null {
  //if (url.includes('blinkit.com')) return 'blinkit';
  if (url.includes('zeptonow.com')) return 'zepto';
  //if (url.includes('swiggy.com/instamart')) return 'instamart';
  return null;
}
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
// POST /add-products/
router.post('/add-products', async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
  const { session_id, product_urls, variants } = req.body as AddProductsRequestBody; 

  if (!session_id || !Array.isArray(product_urls) || product_urls.length === 0) {
   res.status(400).json({ status: 'ERROR', message: 'Session ID and product URLs are required.' });
   return 
  }

  let browser: Browser | undefined;
  let page: Page | undefined;
  let finalCartDetails: CartDetails = {
    items: [],
    priceBreakdown: {}
  };
  let finalPrice: number = 0;

  try {
    const sessionData: SessionData | null = await redisService.getSession(session_id);
    if (!sessionData) {
       res.status(404).json({ status: 'ERROR', message: 'Session not found or expired.' });
       return ; 
    }

    browser = await puppeteerService.launchBrowser();
    page = await puppeteerService.createPage(browser);

    await puppeteerService.restoreSession(page, sessionData , browser );

    for (const productURL of product_urls) {
      const platform = getPlatform(productURL);
      if (!platform) {
        console.warn(`Could not determine platform for URL: ${productURL}`);
        continue;
      }
      const selectors: SelectorConfig = config.SELECTORS[platform];

      await page.goto(productURL, { waitUntil: 'domcontentloaded' });

      const productId = productURL.split('/').pop() || ''; 
    

      
      // Add to cart button
      const addToCartSelector = selectors.addToCartButton;
      if (addToCartSelector) {
        try {
          await page.waitForSelector(addToCartSelector, { visible: true });
          await page.click(addToCartSelector);
          console.log(`Added product from ${productURL} to cart.`);
          await delay(1000);
        } catch (addError) {
          console.error(`Could not add product from ${productURL} to cart using selector "${addToCartSelector}":`, (addError as Error).message);
        }
      } else {
        console.warn(`No 'addToCartButton' selector defined for platform ${platform}. Skipping add to cart for ${productURL}.`);
      }
    }

    const platformOfLastProduct = getPlatform(product_urls[product_urls.length - 1]) || 'blinkit';
    const cartUrl = "https://www.zeptonow.com/?cart=open";
    let cartPageHtml : string = ""; 
    if (cartUrl) {
        await page.goto(cartUrl, { waitUntil: 'domcontentloaded' });
        const modalContentSelector = 'div.border-\\[rgba\\(238\\,192\\,81\\,1\\)\\]';
        
       
        try {
            await page.waitForSelector(modalContentSelector, { visible: true, timeout: 5000 });
            await page.mouse.click(10, 10);
            await delay(1000); 
            console.log('Clicked to dismiss modal at (10,10)');
        } catch (modalError) {
            console.warn(`Modal content selector "${modalContentSelector}" not found or timed out. Proceeding without explicit modal close. Error:`, (modalError as Error).message);
        
        }
        
        cartPageHtml = await page.content(); 
        console.log('Captured cart page HTML after modal dismissal attempt.');
    } else {
        console.warn(`No cart URL configured. Cannot navigate to cart.`);
    }


    const finalSessionData = await puppeteerService.captureSession(page, sessionData.phoneNumber , browser);
    finalSessionData.sessionId = session_id;
    await redisService.setSession(session_id, finalSessionData, 86400);
    await mongoService.saveSessionToMongo(finalSessionData);

    res.json({
        status: 'SUCCESS', 
        message: 'Cart page HTML captured successfully.',
        cart_page_html: cartPageHtml 
    });

  } catch (error) {
    console.error('Add products and price extraction error:', error);
    next(error);
  } finally {
    if (browser) {
      //await browser.close();
    }
  }
});

export default router;