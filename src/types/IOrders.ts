export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface IOrderItem {
  productId: number;
  name: string;
  price: number;
  qty: number;
  imageUrl?: string;
}

export interface IOrder {
  id: number;
  userId: number;
  userName: string;
  createdAt: string; // ISO
  status: OrderStatus;
  items: IOrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  deliveryAddress: string;
  phone: string;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
  notes?: string;
}



