export interface IProduct {
  id: number;
  name: string;
  description: string;
  price: number;      // > 0
  stock: number;      // >= 0
  available: boolean; // disponible o no
  imageUrl: string;
  categoryId: number;
  categoryName?: string;
}



