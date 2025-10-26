import type { IProduct } from '../../../types/IProduct';
import { get } from '../../../utils/api';
import type { ICategoria } from '../../../types/ICategoria';
import { formatCurrency, onReady } from '../../../utils/navigate';
import { addItem, getCart } from '../../../utils/cart';
import { guard, getSession, logout } from '../../../utils/auth';

interface MenuSection {
  name: string;
  imageKey: string;
  items: Array<{ name: string; description: string; price: number }>;
}

const menuSections: MenuSection[] = [
  {
    name: 'Entradas',
    imageKey: 'Entradas',
    items: [
      { name: 'Provoleta', description: 'Clásico provolone con cherrys confitados.', price: 13900 },
      { name: 'Bastones de pollo crocante', description: 'Mix de verdes y cherrys con salsa Vittov.', price: 11900 },
      { name: 'Mila de mozzarella crocante', description: 'Acompañada de salsa filetto y albahaca.', price: 11900 },
      { name: 'Papas fritas', description: 'Nuestras famosas papas fritas.', price: 9900 },
      { name: 'Papas Gramajo', description: 'Jamón cocido, cebolla salteada en oliva y huevo.', price: 14500 },
      { name: 'Papas Vittov', description: 'Con panceta crujiente, cheddar y verdeo.', price: 14500 },
      { name: 'Papas a caballo', description: 'Dos huevos fritos, cebolla caramelizada y champiñones.', price: 12500 },
      { name: 'Rabas tiernas y crocantes', description: 'Con salsas Vittov.', price: 21000 },
      { name: 'Croquetas de espinaca y mozzarella', description: 'Emulsión de morrones y cebolla.', price: 9900 },
      { name: 'Degustación de entradas', description: '2 empanadas, milanesa de mozzarella crocante, media porción de rabas y papas Vittov.', price: 23000 },
    ],
  },
  {
    name: 'Empanadas',
    imageKey: 'Entradas',
    items: [
      { name: 'Empanada criolla', description: 'Empanada tradicional criolla.', price: 2600 },
      { name: 'Empanada cortada a cuchillo', description: 'Empanada de carne cortada a cuchillo.', price: 2700 },
      { name: 'Empanada jamón y queso', description: 'Rellena de jamón cocido y queso.', price: 2500 },
      { name: 'Empanada camarón', description: 'Empanada de camarones.', price: 3300 },
    ],
  },
  {
    name: 'Ensaladas',
    imageKey: 'Ensaladas',
    items: [
      { name: 'Del Chef', description: 'Mix de hojas verdes, pollo crujiente, jamón cocido, parmesano y tomates.', price: 14500 },
      { name: 'Ensalada de pollo', description: 'Pollo a la plancha, huevo duro, choclo, zanahoria, tomate, queso y crutones.', price: 14500 },
      { name: 'Ensalada Vittov', description: 'Mix de verdes, tomates cherry, queso brie, champiñones grillados y nueces.', price: 14500 },
      { name: 'Tibia de calabazas asadas', description: 'Calabazas asadas, parmesano, rúcula y focaccia crocante.', price: 14200 },
      { name: 'Ensalada Verde', description: 'Palta, hojas verdes, tomates cherry, parmesano y queso azul.', price: 14200 },
    ],
  },
  {
    name: 'Pizzas clásicas',
    imageKey: 'Pizzas Clásicas',
    items: [
      { name: 'Mozzarella y aceitunas (Individual)', description: 'Salsa de tomate, mozzarella y aceitunas.', price: 9900 },
      { name: 'Mozzarella y aceitunas (Mediana)', description: 'Salsa de tomate, mozzarella y aceitunas.', price: 14000 },
      { name: 'Mozzarella y jamón (Individual)', description: 'Salsa de tomate, mozzarella, jamón cocido y aceitunas.', price: 10900 },
      { name: 'Mozzarella y jamón (Mediana)', description: 'Salsa de tomate, mozzarella, jamón cocido y aceitunas.', price: 15900 },
      { name: 'Mozzarella y jamón (Grande)', description: 'Salsa de tomate, mozzarella, jamón cocido y aceitunas.', price: 19900 },
      { name: 'Especial de jamón (Individual)', description: 'Mozzarella, jamón, morrones y aceitunas.', price: 13900 },
      { name: 'Especial de jamón (Mediana)', description: 'Mozzarella, jamón, morrones y aceitunas.', price: 19700 },
      { name: 'Especial de jamón (Grande)', description: 'Mozzarella, jamón, morrones y aceitunas.', price: 24700 },
      { name: 'Napolitana (Individual)', description: 'Mozzarella, tomates frescos, ajo, perejil y aceitunas.', price: 10500 },
      { name: 'Napolitana (Mediana)', description: 'Mozzarella, tomates frescos, ajo, perejil y aceitunas.', price: 14800 },
      { name: 'Napolitana (Grande)', description: 'Mozzarella, tomates frescos, ajo, perejil y aceitunas.', price: 18500 },
      { name: 'Napolitana especial (Individual)', description: 'Mozzarella, tomates frescos, jamón cocido, ajo, perejil.', price: 13900 },
      { name: 'Napolitana especial (Mediana)', description: 'Mozzarella, tomates frescos, jamón cocido, ajo, perejil.', price: 19700 },
      { name: 'Napolitana especial (Grande)', description: 'Mozzarella, tomates frescos, jamón cocido, ajo, perejil.', price: 24700 },
      { name: 'Provolone (Individual)', description: 'Mozzarella y provolone con mix de condimentos y aceitunas.', price: 13900 },
      { name: 'Provolone (Mediana)', description: 'Mozzarella y provolone con mix de condimentos y aceitunas.', price: 19800 },
      { name: 'Provolone (Grande)', description: 'Mozzarella y provolone con mix de condimentos y aceitunas.', price: 24800 },
      { name: 'Fugazzeta (Individual)', description: 'Mozzarella, cebolla y aceitunas.', price: 10500 },
      { name: 'Fugazzeta (Mediana)', description: 'Mozzarella, cebolla y aceitunas.', price: 14800 },
      { name: 'Fugazzeta (Grande)', description: 'Mozzarella, cebolla y aceitunas.', price: 18500 },
      { name: 'Fugazzeta especial (Individual)', description: 'Mozzarella, jamón cocido, cebolla y aceitunas.', price: 12200 },
      { name: 'Fugazzeta especial (Mediana)', description: 'Mozzarella, jamón cocido, cebolla y aceitunas.', price: 17200 },
      { name: 'Fugazzeta especial (Grande)', description: 'Mozzarella, jamón cocido, cebolla y aceitunas.', price: 21500 },
      { name: 'Palmitos especial (Individual)', description: 'Palmitos, jamón cocido, morrones, salsa golf y aceitunas.', price: 20500 },
      { name: 'Palmitos especial (Mediana)', description: 'Palmitos, jamón cocido, morrones, salsa golf y aceitunas.', price: 28900 },
      { name: 'Palmitos especial (Grande)', description: 'Palmitos, jamón cocido, morrones, salsa golf y aceitunas.', price: 36200 },
      { name: 'Tropical (Individual)', description: 'Mozzarella, jamón, ananá y azúcar negra.', price: 16800 },
      { name: 'Tropical (Mediana)', description: 'Mozzarella, jamón, ananá y azúcar negra.', price: 23600 },
      { name: 'Tropical (Grande)', description: 'Mozzarella, jamón, ananá y azúcar negra.', price: 29500 },
    ],
  },
  {
    name: 'Pizzas gourmet',
    imageKey: 'Pizzas Gourmet',
    items: [
      { name: 'Rúcula y jamón crudo (Individual)', description: 'Mozzarella, rúcula y jamón crudo.', price: 18000 },
      { name: 'Rúcula y jamón crudo (Mediana)', description: 'Mozzarella, rúcula y jamón crudo.', price: 25500 },
      { name: 'Rúcula y jamón crudo (Grande)', description: 'Mozzarella, rúcula y jamón crudo.', price: 31900 },
      { name: 'Rúcula y parmesano (Individual)', description: 'Mozzarella, rúcula y parmesano.', price: 17800 },
      { name: 'Rúcula y parmesano (Mediana)', description: 'Mozzarella, rúcula y parmesano.', price: 25000 },
      { name: 'Rúcula y parmesano (Grande)', description: 'Mozzarella, rúcula y parmesano.', price: 31300 },
      { name: 'Rúcula y queso brie (Individual)', description: 'Mozzarella, queso brie, rúcula.', price: 17800 },
      { name: 'Rúcula y queso brie (Mediana)', description: 'Mozzarella, queso brie, rúcula.', price: 25000 },
      { name: 'Rúcula y queso brie (Grande)', description: 'Mozzarella, queso brie, rúcula.', price: 31300 },
      { name: 'Provolone y panceta crocante (Individual)', description: 'Mozzarella, provolone, panceta crocante.', price: 16800 },
      { name: 'Provolone y panceta crocante (Mediana)', description: 'Mozzarella, provolone, panceta crocante.', price: 23600 },
      { name: 'Provolone y panceta crocante (Grande)', description: 'Mozzarella, provolone, panceta crocante.', price: 29500 },
      { name: 'Panceta y champiñones salteados (Individual)', description: 'Mozzarella, champiñones salteados, perejil.', price: 16800 },
      { name: 'Panceta y champiñones salteados (Mediana)', description: 'Mozzarella, champiñones salteados, perejil.', price: 23600 },
      { name: 'Panceta y champiñones salteados (Grande)', description: 'Mozzarella, champiñones salteados, perejil.', price: 29500 },
      { name: 'Cuatro quesos (Individual)', description: 'Mozzarella, queso azul, parmesano y provolone.', price: 15100 },
      { name: 'Cuatro quesos (Mediana)', description: 'Mozzarella, queso azul, parmesano y provolone.', price: 21500 },
      { name: 'Cuatro quesos (Grande)', description: 'Mozzarella, queso azul, parmesano y provolone.', price: 26900 },
      { name: 'Potrerillos (Individual)', description: 'Mozzarella, hongos de Potrerillos, panceta y huevo.', price: 17000 },
      { name: 'Potrerillos (Mediana)', description: 'Mozzarella, hongos de Potrerillos, panceta y huevo.', price: 23900 },
      { name: 'Potrerillos (Grande)', description: 'Mozzarella, hongos de Potrerillos, panceta y huevo.', price: 29900 },
      { name: 'Pepperoni (Individual)', description: 'Mozzarella y pepperoni de Las Dinas.', price: 15100 },
      { name: 'Pepperoni (Mediana)', description: 'Mozzarella y pepperoni de Las Dinas.', price: 21500 },
      { name: 'Pepperoni (Grande)', description: 'Mozzarella y pepperoni de Las Dinas.', price: 26900 },
      { name: 'Pizza Vittov (Individual)', description: 'Mozzarella, rúcula, jamón crudo, cherry y parmesano.', price: 17800 },
      { name: 'Pizza Vittov (Mediana)', description: 'Mozzarella, rúcula, jamón crudo, cherry y parmesano.', price: 25000 },
      { name: 'Pizza Vittov (Grande)', description: 'Mozzarella, rúcula, jamón crudo, cherry y parmesano.', price: 31300 },
      { name: 'Mariscos (Individual)', description: 'Mozzarella, langostinos, mejillones y calamar al vino blanco.', price: 22200 },
      { name: 'Mariscos (Mediana)', description: 'Mozzarella, langostinos, mejillones y calamar al vino blanco.', price: 31200 },
      { name: 'Mariscos (Grande)', description: 'Mozzarella, langostinos, mejillones y calamar al vino blanco.', price: 39000 },
      { name: 'Queso azul y panceta (Individual)', description: 'Mozzarella, queso azul y panceta.', price: 15100 },
      { name: 'Queso azul y panceta (Mediana)', description: 'Mozzarella, queso azul y panceta.', price: 21500 },
      { name: 'Queso azul y panceta (Grande)', description: 'Mozzarella, queso azul y panceta.', price: 26900 },
      { name: 'Vegetariana (Individual)', description: 'Verduras asadas, tomates cherry y nueces.', price: 16200 },
      { name: 'Vegetariana (Mediana)', description: 'Verduras asadas, tomates cherry y nueces.', price: 22800 },
      { name: 'Vegetariana (Grande)', description: 'Verduras asadas, tomates cherry y nueces.', price: 28500 },
      { name: 'Opción vegana (Individual)', description: 'Verduras asadas, tomates cherry y nueces.', price: 14400 },
      { name: 'Opción vegana (Mediana)', description: 'Verduras asadas, tomates cherry y nueces.', price: 20700 },
      { name: 'Opción vegana (Grande)', description: 'Verduras asadas, tomates cherry y nueces.', price: 25900 },
      { name: 'Papa y panceta crocante (Individual)', description: 'Salsa blanca, láminas de papa, panceta y perejil fresco.', price: 14500 },
      { name: 'Papa y panceta crocante (Mediana)', description: 'Salsa blanca, láminas de papa, panceta y perejil fresco.', price: 21000 },
      { name: 'Papa y panceta crocante (Grande)', description: 'Salsa blanca, láminas de papa, panceta y perejil fresco.', price: 26300 },
    ],
  },
  {
    name: 'Calzones',
    imageKey: 'Calzones',
    items: [
      { name: 'Calzón cebolla y panceta', description: 'Cebolla, mozzarella, jamón y panceta.', price: 16500 },
      { name: 'Calzón cuatro quesos', description: 'Mozzarella, parmesano, queso azul y provolone.', price: 17500 },
      { name: 'Calzón jamón y tomates', description: 'Jamón, mozzarella y tomates.', price: 16500 },
      { name: 'Calzón panceta y morrón', description: 'Panceta, morrones, huevos y mozzarella.', price: 16500 },
    ],
  },
  {
    name: 'Hamburguesas',
    imageKey: 'Hamburguesas',
    items: [
      { name: 'Hamburguesa americana', description: 'Medallón 200g, cheddar, panceta, tomate, lechuga y cebolla morada.', price: 14500 },
      { name: 'Hamburguesa clásica', description: 'Medallón 200g, jamón, queso, tomate, lechuga y huevo a la plancha.', price: 14500 },
      { name: 'Hamburguesa Vittov', description: 'Medallón 200g, panceta crocante, cheddar y salsa barbacoa.', price: 14900 },
      { name: 'Hamburguesа doble Vittov', description: 'Doble medallón 200g, panceta crocante, cheddar y salsa barbacoa.', price: 17300 },
      { name: 'Hamburguesa infantil con papas', description: 'Medallón 100% vacuna y queso cheddar.', price: 12500 },
      { name: 'Hamburguesa veggie', description: 'Calabaza y arroz integral, cebollas caramelizadas, tomates confitados, rúcula y guacamole.', price: 13900 },
    ],
  },
  {
    name: 'Sandwiches',
    imageKey: 'Sandwiches',
    items: [
      { name: 'Sandwich de entraña', description: 'Entraña con verduras salteadas, rúcula y mozzarella.', price: 22000 },
      { name: 'Pollo crispy y guacamole', description: 'Pollo crocante, mozzarella, tomates frescos y guacamole.', price: 21900 },
      { name: 'Lomo Sarli completo', description: 'Lomo, queso cuartirolo, salsa Vittov, huevo, jamón y lechuga.', price: 20500 },
      { name: 'Lomito clásico', description: 'Lomo, jamón cocido, queso, huevo, tomate y lechuga.', price: 19500 },
      { name: 'Lomito Provolomo', description: 'Lomo, provolone especiado, panceta ahumada y tomates.', price: 19700 },
      { name: 'Lomo Guacamole Plus', description: 'Lomo, jamón cocido, queso, tomate, lechuga, huevo y guacamole.', price: 21900 },
      { name: 'Tostado jamón y queso', description: 'Pan Vittov artesanal, jamón y queso.', price: 9900 },
    ],
  },
  {
    name: 'Principales',
    imageKey: 'Principales',
    items: [
      { name: 'Matambre tiernizado a la pizza', description: 'Con guarnición.', price: 21500 },
      { name: 'Supremitas de pollo grilladas', description: 'Con emulsión de albahaca y menta al limón.', price: 17500 },
      { name: 'Milanesa de pollo y guarnición', description: 'Incluye guarnición a elección.', price: 17500 },
      { name: 'Milanesa de carne y guarnición', description: 'Incluye guarnición a elección.', price: 19500 },
      { name: 'Milanesa de carne con dos huevos', description: 'Incluye guarnición a elección.', price: 21800 },
      { name: 'Milanesa napolitana y guarnición', description: 'Salsa de tomate, mozzarella y jamón cocido.', price: 24500 },
      { name: 'Pamplona de pollo', description: 'Suprema de pollo envuelta en panceta con mozzarella, morrones y verduras asadas.', price: 21500 },
    ],
  },
  {
    name: 'Pastas',
    imageKey: 'Pastas',
    items: [
      { name: 'Ñoquis rellenos', description: 'Mozzarella, crema de champiñones y panceta.', price: 21500 },
      { name: 'Lasagna casera', description: 'Capas de jamón y queso con salsa bolognesa.', price: 23500 },
      { name: 'Sorrentinos', description: 'De jamón y queso.', price: 20900 },
      { name: 'Ñoquis de papa', description: 'Incluye salsa a elección.', price: 18900 },
    ],
  },
  {
    name: 'Sin TACC',
    imageKey: 'Sin TACC',
    items: [
      { name: 'Pizzeta muzza sin TACC', description: 'Apta celíacos.', price: 16500 },
      { name: 'Sorrentinos sin TACC', description: 'Apta celíacos.', price: 21500 },
      { name: 'Fideos rellenos sin TACC', description: 'Apta celíacos.', price: 21500 },
      { name: 'Pizzeta jamón sin TACC', description: 'Apta celíacos.', price: 18000 },
      { name: 'Chocotorta sin TACC', description: 'Postre apto celíacos.', price: 6500 },
      { name: 'Cerveza sin gluten', description: 'Michelob Ultra 473cc.', price: 5500 },
    ],
  },
  {
    name: 'Menú niños',
    imageKey: 'Menú Niños',
    items: [
      { name: 'Nuggets con papas smile', description: 'Incluye bebida y helado.', price: 16500 },
      { name: 'Pizzeta de muzza kids', description: 'Incluye bebida y helado.', price: 16500 },
      { name: 'Ñoquis kids', description: 'Incluye bebida y helado.', price: 16500 },
      { name: 'Hamburguesa infantil', description: 'Hamburguesa con cheddar y papas.', price: 16500 },
    ],
  },
  {
    name: 'Postres',
    imageKey: 'Postres',
    items: [
      { name: 'Flan con dulce de leche y crema', description: 'Postre clásico con dulce de leche y crema.', price: 6500 },
      { name: 'Chocotorta', description: 'Base de galletas de chocolate con dulce de leche y queso crema.', price: 5400 },
      { name: 'Postrezitto (1 sabor)', description: 'Elegí entre Oreo Shot, Lemon Pie o Tiramisú.', price: 5400 },
      { name: 'Postrezittos (2 sabores)', description: 'Doble degustación.', price: 9500 },
      { name: 'Postrezittos (4 sabores)', description: 'Los cuatro mini postres.', price: 17700 },
    ],
  },
  {
    name: 'Cervezas tiradas',
    imageKey: 'Bebidas',
    items: [
      { name: 'Quilmes Chopp 330 ml', description: 'Cerveza tirada.', price: 3800 },
      { name: 'Quilmes Pinta', description: 'Cerveza tirada.', price: 4200 },
      { name: 'Stella Artois Chopp 330 ml', description: 'Cerveza tirada.', price: 4700 },
      { name: 'Stella Artois Pinta', description: 'Cerveza tirada.', price: 5700 },
      { name: 'Patagonia Chopp 330 ml', description: 'Cerveza tirada.', price: 4900 },
      { name: 'Patagonia Pinta', description: 'Cerveza tirada.', price: 5900 },
    ],
  },
  {
    name: 'Más cervezas',
    imageKey: 'Bebidas',
    items: [
      { name: 'Corona long neck', description: 'Botella individual.', price: 5400 },
      { name: 'Andes Origen 1L', description: 'Botella de litro.', price: 9900 },
      { name: 'Stella Artois 1L', description: 'Botella de litro.', price: 10900 },
      { name: 'Stella Artois 0.0 (330 ml)', description: 'Cerveza sin alcohol.', price: 4500 },
    ],
  },
  {
    name: 'Cafetería',
    imageKey: 'Bebidas',
    items: [
      { name: 'Espresso', description: 'Café espresso.', price: 2600 },
      { name: 'Macchiato', description: 'Cortado.', price: 2600 },
      { name: 'Espresso o cortado mediano', description: 'Tamaño mediano.', price: 3000 },
      { name: 'Latte', description: 'Café con leche.', price: 3900 },
      { name: 'Variedades de té', description: 'Selección de té.', price: 2500 },
    ],
  },
  {
    name: 'Bebidas sin alcohol',
    imageKey: 'Bebidas',
    items: [
      { name: 'Agua mineral', description: 'Con o sin gas.', price: 2900 },
      { name: 'Agua saborizada', description: 'Bebida refrescante.', price: 3000 },
      { name: 'Gaseosa 350 ml', description: 'Gaseosa individual.', price: 3000 },
      { name: 'Jugo de naranja grande', description: 'Jugo natural.', price: 4200 },
      { name: 'Limonada 1 litro', description: 'Jarra refrescante.', price: 6900 },
    ],
  },
];

const offlineProducts: IProduct[] = (() => {
  let idCounter = 1;
  return menuSections.flatMap((section, sectionIndex) =>
    section.items.map((item) => ({
      id: idCounter++,
      name: item.name,
      description: item.description,
      price: item.price,
      stock: 99,
      available: true,
      imageUrl: pickImage(section.imageKey),
      categoryId: sectionIndex + 1,
      categoryName: section.name,
    }))
  );
})();

function pickImage(category: string): string {
  const map: Record<string, string> = {
    Entradas: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop',
    Ensaladas: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop',
    'Pizzas Clásicas': 'https://images.unsplash.com/photo-1548365328-9f547ddb49d0?w=800&auto=format&fit=crop',
    'Pizzas Gourmet': 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=800&auto=format&fit=crop',
    Calzones: 'https://images.unsplash.com/photo-1585238341986-37b1c517c8bd?w=800&auto=format&fit=crop',
    Hamburguesas: 'https://images.unsplash.com/photo-1606755962773-0e7d4f40da3e?w=800&auto=format&fit=crop',
    Sandwiches: 'https://images.unsplash.com/photo-1570610155223-7d68a5b67bdd?w=800&auto=format&fit=crop',
    Principales: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&auto=format&fit=crop',
    Pastas: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&auto=format&fit=crop',
    'Sin TACC': 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=800&auto-format&fit=crop',
    'Menú niños': 'https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?w=800&auto=format&fit=crop',
    Postres: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop',
    Bebidas: 'https://images.unsplash.com/photo-1527169402691-feff5539e52c?w=800&auto=format&fit=crop',
  };
  return map[category] || 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&auto=format&fit=crop';
}

onReady(() => {
  guard('cliente');
  const container = document.querySelector<HTMLDivElement>('#productsGrid');
  const resultCount = document.querySelector<HTMLParagraphElement>('#resultCount');
  const errorBox = document.querySelector<HTMLDivElement>('#errorBox');
  const loading = document.querySelector<HTMLDivElement>('#loading');
  if (!container || !resultCount || !errorBox || !loading) return;

  setupNavbar();
  errorBox.style.display = 'none';
  loading.style.display = 'none';
  renderSections(container, resultCount, menuSections, offlineProducts);

  container.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest('button[data-action="add"]') as HTMLButtonElement | null;
    if (!btn) return;
    const id = Number(btn.dataset.id || '0');
    const product = offlineProducts.find((p) => p.id === id);
    if (!product) return;
    try {
      addItem(product, 1);
      const cartCount = document.querySelector<HTMLSpanElement>('#cartCount');
      if (cartCount) cartCount.textContent = String(getCart().items.reduce((a, b) => a + b.qty, 0));
      btn.textContent = 'Agregado!';
      setTimeout(() => { btn.textContent = 'Agregar'; }, 1200);
    } catch (error) {
      alert((error as Error).message);
    }
  });
});

function renderSections(
  container: HTMLDivElement,
  resultCount: HTMLParagraphElement,
  sections: MenuSection[],
  products: IProduct[],
): void {
  resultCount.textContent = `${products.length} producto${products.length !== 1 ? 's' : ''} disponibles`;
  container.innerHTML = sections
    .map((section) => {
      const cards = products
        .filter((p) => p.categoryName?.toLowerCase() === section.name.toLowerCase())
        .map((p) => {
          return `
            <article class="card">
              <img src="${p.imageUrl}" alt="${p.name}" />
              <div class="card-body">
                <h4 class="card-title">${p.name}</h4>
                <p class="card-subtitle">${p.description}</p>
                <strong>${formatCurrency(p.price)}</strong>
                <div class="card-actions">
                  <button class="btn" data-action="add" data-id="${p.id}">Agregar</button>
                </div>
              </div>
            </article>`;
        })
        .join('');
      return cards
        ? `<section class="category-section"><h2 class="category-title">${section.name}</h2><div class="menu-container">${cards}</div></section>`
        : '';
    })
    .join('');
}

function setupNavbar(): void {
  const session = getSession();
  const userName = document.querySelector<HTMLSpanElement>('#userName');
  if (userName && session) userName.textContent = session.name;
  document.getElementById('logoutBtn')?.addEventListener('click', () => logout());
  const cartCount = document.querySelector<HTMLSpanElement>('#cartCount');
  if (cartCount) cartCount.textContent = String(getCart().items.reduce((a, b) => a + b.qty, 0));
}


// Carga remota (API): categorías y productos
async function loadCategories(): Promise<void> {
  const cats = await get<ICategoria[]>('/categories');
  void cats; // Integrar con UI si hay sidebar/select
}

async function loadProducts(params: { categoryId?: number; q?: string; sort?: string } = {}): Promise<void> {
  const query = new URLSearchParams();
  if (params.categoryId != null) query.set('categoryId', String(params.categoryId));
  if (params.q) query.set('q', params.q);
  if (params.sort) query.set('sort', params.sort);
  const products = await get<IProduct[]>(`/products${query.toString() ? `?${query}` : ''}`);
  void products; // Integrar con grid de productos si corresponde
}

void loadCategories();
void loadProducts();


