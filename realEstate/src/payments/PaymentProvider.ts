export type DemoPaymentData={cardholder:string;cardNumber:string;expiry:string;cvv:string;type:'property_reservation'|'listing_promotion'};
export type PaymentResult={id:string;provider:'fake';status:'paid'|'declined'|'failed';amount:number;lastFour:string;simulation:true;createdAt:string};
export interface PaymentProvider{processPayment(amount:number,data:DemoPaymentData):Promise<PaymentResult>}
