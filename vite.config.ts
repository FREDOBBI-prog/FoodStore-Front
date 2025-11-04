
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// entradas html para multipagina, mantener rutas relativas en build
const pages = {
  index: resolve(__dirname, 'index.html'),
  login: resolve(__dirname, 'src/pages/auth/login/login.html'),
  register: resolve(__dirname, 'src/pages/auth/register/register.html'),
  store_home: resolve(__dirname, 'src/pages/store/home/home.html'),
  store_product: resolve(__dirname, 'src/pages/store/productDetail/productDetail.html'),
  store_cart: resolve(__dirname, 'src/pages/store/cart/cart.html'),
  client_orders: resolve(__dirname, 'src/pages/client/orders/orders.html'),
  admin_home: resolve(__dirname, 'src/pages/admin/adminHome/adminHome.html'),
  admin_categories: resolve(__dirname, 'src/pages/admin/categories/categories.html'),
  admin_products: resolve(__dirname, 'src/pages/admin/products/products.html'),
  admin_orders: resolve(__dirname, 'src/pages/admin/orders/orders.html'),
};

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: pages,
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    open: '/src/pages/auth/login/login.html',
  },
});



