export type Lang='en'|'ar'|'he';
export type Product={id:number,name:string,category:string,brand:string,price:number,oldPrice?:number,rating:number,reviews:number,image:string,badge?:string,description:string,colors:string[],sizes:string[],stock:number,sku:string};
export type CartItem={product:Product,qty:number,color:string,size:string};
export type OrderStatus='Confirmed'|'Preparing'|'Shipped'|'Out for delivery'|'Delivered';
export type Order={id:string,date:string,total:number,status:OrderStatus,items:CartItem[],address:string,lastFour:string};
