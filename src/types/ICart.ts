export interface ICartItem {
  productId: number;
  name: string;
  price: number;
  imageUrl: string;
  qty: number; // 1..stock
  max: number; // stock actual
}
export interface ICart {
  items: ICartItem[];
  subtotal: number;
  shipping: number;   // fijo: 500
  total: number;
  updatedAt: string;  // ISO
}



