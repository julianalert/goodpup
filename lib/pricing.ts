/** Single source of truth for product pricing — safe to import in client and server code */
export const LIST_PRICE_CENTS = 9700 // $97.00 strikethrough / "regular" price
export const PRICE_CENTS = 2700 // $27.00 charged at checkout

export const LIST_PRICE_LABEL = '$97'
export const PRICE_LABEL = '$27'

export const DISCOUNT_CENTS = LIST_PRICE_CENTS - PRICE_CENTS
export const DISCOUNT_LABEL = `−$${(DISCOUNT_CENTS / 100).toFixed(2)}`
