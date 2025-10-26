# 🍕 Food Store - Backend API

Backend REST API desarrollado en Spring Boot para el sistema de gestión de pedidos de comida.

## 📋 Descripción

API REST que proporciona endpoints para la gestión completa de un negocio de comidas, incluyendo:
- Gestión de usuarios y autenticación
- CRUD de categorías
- CRUD de productos
- Gestión de pedidos

## 🛠️ Tecnologías

- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Data JPA**
- **H2 Database** (base de datos en memoria)
- **Maven**
- **Lombok**

## 📦 Requisitos Previos

- Java 17 o superior
- Maven 3.6 o superior

## 🚀 Instalación y Ejecución

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd backend-food-store
```

### 2. Compilar el proyecto

```bash
mvn clean install
```

### 3. Ejecutar la aplicación

```bash
mvn spring-boot:run
```

La API estará disponible en: `http://localhost:8080`

## 📚 Endpoints de la API

### Usuarios (`/users`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/users` | Obtener todos los usuarios |
| GET | `/users/{id}` | Obtener usuario por ID |
| POST | `/users` | Crear nuevo usuario |
| PUT | `/users/{id}` | Actualizar usuario |
| DELETE | `/users/{id}` | Eliminar usuario |

### Categorías (`/categories`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/categories` | Obtener todas las categorías |
| GET | `/categories/{id}` | Obtener categoría por ID |
| GET | `/categories/active/{active}` | Obtener categorías por estado |
| POST | `/categories` | Crear nueva categoría |
| PUT | `/categories/{id}` | Actualizar categoría |
| DELETE | `/categories/{id}` | Eliminar categoría |

### Productos (`/products`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/products` | Obtener todos los productos |
| GET | `/products/{id}` | Obtener producto por ID |
| GET | `/products/category/{categoryId}` | Obtener productos por categoría |
| GET | `/products/available/{available}` | Obtener productos por disponibilidad |
| POST | `/products` | Crear nuevo producto |
| PUT | `/products/{id}` | Actualizar producto |
| DELETE | `/products/{id}` | Eliminar producto |

### Pedidos (`/orders`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/orders` | Obtener todos los pedidos |
| GET | `/orders/{id}` | Obtener pedido por ID |
| GET | `/orders/user/{userId}` | Obtener pedidos de un usuario |
| GET | `/orders/status/{status}` | Obtener pedidos por estado |
| POST | `/orders` | Crear nuevo pedido |
| PUT | `/orders/{id}` | Actualizar pedido |
| PATCH | `/orders/{id}/status` | Actualizar solo el estado |
| DELETE | `/orders/{id}` | Eliminar pedido |

## 🗄️ Base de Datos

La aplicación usa **H2 Database** (base de datos en memoria) para desarrollo.

### Consola H2

Podés acceder a la consola H2 en: `http://localhost:8080/h2-console`

**Credenciales:**
- JDBC URL: `jdbc:h2:mem:foodstoredb`
- Username: `sa`
- Password: _(dejar vacío)_

## 👥 Usuarios de Prueba

La aplicación carga automáticamente estos usuarios al iniciar:

### Administrador
- Email: `admin@food.com`
- Password: `admin123`
- Role: `admin`

### Cliente
- Email: `cliente@food.com`
- Password: `cliente123`
- Role: `cliente`

### Admin Personal
- Email: `adrianfredes12@gmail.com`
- Password: `123456`
- Role: `admin`

## 📊 Datos de Prueba

Al iniciar la aplicación, se cargan automáticamente:
- ✅ 3 usuarios
- ✅ 4 categorías (Pizzas, Hamburguesas, Bebidas, Postres)
- ✅ 8 productos de ejemplo

## 🔧 Configuración

El archivo `application.properties` contiene la configuración principal:

```properties
# Puerto del servidor
server.port=8080

# Base de datos H2
spring.datasource.url=jdbc:h2:mem:foodstoredb

# CORS (permitir peticiones desde el frontend)
spring.web.cors.allowed-origins=http://localhost:5173
```

## 🌐 CORS

El backend está configurado para aceptar peticiones desde:
- `http://localhost:5173` (frontend en desarrollo)
- `http://127.0.0.1:5173`

## 📝 Modelos de Datos

### User
```json
{
  "id": 1,
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "123456",
  "role": "cliente"
}
```

### Category
```json
{
  "id": 1,
  "name": "Pizzas",
  "description": "Deliciosas pizzas artesanales",
  "imageUrl": "https://...",
  "active": true
}
```

### Product
```json
{
  "id": 1,
  "name": "Pizza Margarita",
  "description": "Pizza clásica con tomate y mozzarella",
  "price": 1200.0,
  "stock": 15,
  "available": true,
  "imageUrl": "https://...",
  "categoryId": 1,
  "categoryName": "Pizzas"
}
```

### Order
```json
{
  "id": 1,
  "userId": 2,
  "userName": "Cliente Test",
  "createdAt": "2024-01-15T10:30:00",
  "status": "pending",
  "items": "[{\"productId\":1,\"name\":\"Pizza Margarita\",\"price\":1200,\"qty\":2}]",
  "subtotal": 2400.0,
  "shipping": 500.0,
  "total": 2900.0,
  "deliveryAddress": "Calle Falsa 123",
  "phone": "1234567890",
  "paymentMethod": "efectivo",
  "notes": "Sin cebolla"
}
```

## 🔒 Seguridad

⚠️ **IMPORTANTE**: Este proyecto es educativo y **NO implementa seguridad real**:
- Las contraseñas se almacenan en texto plano
- No hay tokens JWT
- No hay encriptación
- **NO usar en producción**

## 🧪 Testing

Para ejecutar los tests:

```bash
mvn test
```

## 📦 Build para Producción

Para generar el JAR ejecutable:

```bash
mvn clean package
```

El archivo JAR se generará en `target/food-store-1.0.0.jar`

Para ejecutarlo:

```bash
java -jar target/food-store-1.0.0.jar
```

## 🤝 Contribución

Este es un proyecto académico para la materia Programación 3 de la UTN.

## 👨‍💻 Autor

Adrian Fredes - UTN

## 📄 Licencia

Este proyecto es de uso educativo.

