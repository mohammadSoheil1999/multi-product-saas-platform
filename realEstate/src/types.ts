export type Lang='en'|'ar'|'he';
export type ListingType='sale'|'rent';
export type Property={id:number,title:Record<Lang,string>,city:string,area:string,price:number,type:string,listing:ListingType,beds:number,baths:number,size:number,image:string,featured:boolean,lat:number,lng:number,agent:string,views:number,amenities:string[],description:Record<Lang,string>};
export type Role='customer'|'agent'|'admin';
