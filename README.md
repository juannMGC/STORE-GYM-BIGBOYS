# STORE-GYM-BIGBOYS - Ecommerce

## Descripción del Proyecto

**STORE-GYM-BIGBOYS** es la plataforma digital oficial de **BIG BOIS GIM**, un gimnasio ubicado en Manizales, Caldas, cuyo objetivo es consolidar su presencia en internet mediante una solución moderna, escalable y orientada al negocio.

La plataforma tendrá dos grandes enfoques:

1. **Sitio web corporativo del gimnasio**
   - Presentación de la marca BIG BOIS GIM
   - Información general del gimnasio
   - Galería de imágenes
   - Descripción de máquinas, instalaciones y servicios
   - Sección visual moderna orientada al posicionamiento de marca

2. **Tienda virtual**
   - Catálogo de productos exclusivos de BIG BOIS
   - Visualización de productos por categorías
   - Gestión de carrito de compras
   - Autenticación de usuarios
   - Proceso de compra en línea
   - Integración con pasarela de pagos
   - Panel administrativo para gestión de productos, categorías, tallas, pedidos y clientes

El sistema está diseñado para soportar tanto la operación comercial de la tienda como la administración interna del catálogo, facilitando futuras ampliaciones como promociones, dashboard administrativo, gestión de inventario, analítica comercial y nuevas integraciones digitales.

---

## Objetivos del Proyecto

### Objetivo General
Desarrollar una plataforma ecommerce moderna, segura, rápida y escalable para BIG BOIS GIM, permitiendo la presentación digital del gimnasio y la comercialización de productos exclusivos en línea.

### Objetivos Específicos
- Crear una página web atractiva, futurista y optimizada para SEO.
- Permitir a los usuarios consultar productos por categorías.
- Habilitar compras en línea para usuarios registrados.
- Implementar pagos digitales mediante Wompi con PSE.
- Proveer un panel administrativo para la gestión de productos, categorías, tallas y pedidos.
- Diseñar una arquitectura desacoplada, mantenible y preparada para crecimiento.

---

## Alcance Funcional

La plataforma contempla inicialmente los siguientes módulos funcionales:

### Portal público
- Página principal del gimnasio
- Información institucional
- Galería visual
- Sección de productos
- Detalle de producto
- Navegación por categorías

### Portal de clientes
- Registro e inicio de sesión
- Consulta de productos
- Carrito de compras
- Proceso de checkout
- Pago en línea
- Historial de pedidos

### Portal administrativo
- Gestión de productos
- Gestión de categorías
- Gestión de tallas
- Gestión de pedidos
- Gestión de clientes
- Control del estado de las compras

---

## Actores del Sistema

### 1. Cliente
Usuario final que puede:
- Navegar por la página principal
- Consultar productos
- Registrarse e iniciar sesión
- Añadir productos al carrito
- Realizar compras en línea
- Consultar sus pedidos

### 2. Administrador
Usuario con permisos avanzados que puede:
- Iniciar sesión en el panel administrativo
- Crear, editar y eliminar productos
- Crear, editar y eliminar categorías
- Crear, editar y eliminar tallas
- Gestionar pedidos
- Validar el estado de las compras
- Administrar la operación general de la tienda

---

## Casos de Uso Principales

### Módulo público
- Visualización de la página principal
- Consulta de productos
- Consulta del detalle de productos

### Módulo de compras
- Registro de usuario
- Inicio de sesión
- Agregar producto al carrito
- Selección de forma de pago
- Confirmación de compra

### Módulo administrativo
- Crear productos
- Editar productos
- Eliminar productos
- Crear categorías
- Editar categorías
- Eliminar categorías
- Crear tallas
- Editar tallas
- Eliminar tallas

---

## Stack Tecnológico

## Backend
El backend estará orientado a exponer una API robusta para autenticación, administración del catálogo, procesamiento de pedidos, integración con pagos y crecimiento futuro.

- **NestJS** - Framework principal del backend
- **TypeScript** - Lenguaje principal del backend
- **PostgreSQL** - Base de datos relacional principal
- **Prisma** - ORM para modelado, consultas y persistencia de datos
- **JWT** - Autenticación basada en tokens
- **Guards y Roles** - Control de acceso por tipo de usuario
- **Docker** - Contenedores para desarrollo local y despliegue
- **Wompi API** - Integración con pagos y soporte para PSE

## Frontend
El frontend estará orientado a ofrecer una experiencia moderna, visual, responsiva y optimizada para SEO.

- **Next.js** - Framework principal del frontend
- **TypeScript** - Lenguaje principal del frontend
- **React** - Base para construcción de interfaces
- **CSS Modules** - Estilos encapsulados por componente
- **SASS / SCSS** - Preprocesador de estilos
- **Axios / Fetch API** - Consumo de servicios del backend
- **React Hook Form** - Manejo de formularios
- **Zod** - Validaciones del lado cliente
- **Zustand o Context API** - Manejo de estado global

## Base de Datos
- **PostgreSQL**
- Modelo relacional
- Integridad referencial
- Escalable para crecimiento del ecommerce

## ORM
- **Prisma**
- Modelado de entidades
- Migraciones
- Acceso tipado a base de datos
- Consultas seguras y mantenibles

## Autenticación y Seguridad
- **JWT**
- Control de acceso por roles:
  - `admin`
  - `client`

## Gestión de Archivos e Imágenes
- **Cloudinary** o **Amazon S3**
- Almacenamiento de imágenes de productos, banners y recursos multimedia

## Pasarela de Pagos
- **Wompi**
- Integración con **PSE** como método principal de pago
- Preparado para registrar referencias, estados y confirmaciones de transacción

## Infraestructura y Despliegue
- **Docker**
- **Docker Compose**
- Separación entre frontend, backend y base de datos
- Preparado para despliegue en infraestructura cloud
- Arquitectura escalable y mantenible

## Mobile
La arquitectura queda preparada para futuras aplicaciones móviles orientadas a clientes o administración.

- **iOS**
- **Android**
- Posible integración futura mediante:
  - **React Native**
  - **Flutter**
  - consumo de la misma API construida en **NestJS**

---

## Arquitectura del Sistema

La solución se implementará bajo una arquitectura desacoplada por capas, separando claramente frontend, backend y persistencia de datos.

### Arquitectura General

```text
[ Cliente / Administrador ]
            |
            v
   [ Frontend Web ]
 Next.js + TypeScript
            |
            v
    [ API Backend REST ]
 NestJS + TypeScript
            |
            v
 [ PostgreSQL + Prisma ]
            |
            +----------------------+
            |                      |
            v                      v
 [ Wompi - Pagos PSE ]   [ Cloudinary / S3 ]
