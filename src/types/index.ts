import {Browser } from "puppeteer" ; 

export interface SessionData {
    sessionId: string;
    phoneNumber: string;
    cookies: Array<any>; 
    url: string;
    domSnapshot?: string;
    apiSessionDetails?: Record<string, any>; 
    localStorage?: { [key: string]: string }; // Optional, as some sessions might not have it
    sessionStorage?: { [key: string]: string };
  }
export interface BrowserData {
  browser : Browser ; 
}
  export interface SelectorConfig {
    loginButton: string;
    phoneNumberInput: string;
    submitButton: string;
    otpInput: string;
    cartPageUrl: string;
    addToCartButton?: string; 
    variantSelector?: string; 
    locationSelector?: string; 
    locationInput?:string ; 
    locationSelect?:string ; 
    locationSubmit?:string ; 
  }

  export interface PlatformSelectors {
    //blinkit: SelectorConfig;
    zepto: SelectorConfig;
    //instamart: SelectorConfig;
    //[key: string]: SelectorConfig; 
  }
  
  export interface AddProductsRequestBody {
    session_id: string;
    product_urls: string[];
    variants: { [productId: string]: string }; 
  }
  
  export interface CartItem {
    name: string;
    quantity: string;
    price: string;
  }
  
  export interface PriceBreakdown {
    [productName: string]: ItemPriceDetails; 
  }
  export interface ItemPriceDetails {
    current: string;
    original: string; 
  }
  
  export interface CartDetails {
    items: CartItem[];
    priceBreakdown: PriceBreakdown;
  }