# Huaman.com

Marketplace estilo OLX enfocado en 3 categorías:
- 👕 Ropa
- 📱 Electrónica
- 🪑 Hogar

Stack: Next.js fullstack (App Router) + MongoDB Atlas + despliegue en Vercel.

## Funcionalidades
- Registro/login con roles user/admin
- Publicación de anuncios por usuarios
- Geolocalización del aviso (lat/lng + ciudad/dirección)
- Detalle de anuncio con botón de chat al vendedor
- Chat comprador-vendedor
- Panel administrador con métricas
- Flujo de moderación de anuncios: pending/approved/rejected
- Admin puede asignar Pago Link por anuncio
- Botón de pago visible en el detalle del aviso

## Variables de entorno
Crear `.env.local` con:

```env
MONGO_URI=mongodb+srv://rhuamanc21_db_user:vmHsQLKtkvWzmXXa@cluster0.ik5cg80.mongodb.net/huaman?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=huaman_super_secret_2026_change_me
```

## Correr local
```bash
npm install
npm run seed
npm run dev
```

## Colecciones Mongo creadas
- users
- listings
- conversations
- messages

El script `npm run seed` crea documentos iniciales para todas esas colecciones.

## Despliegue en Vercel
1. Subir repo a GitHub.
2. Importar proyecto en Vercel.
3. Configurar Environment Variables:
	- MONGO_URI
	- JWT_SECRET
4. Deploy.

No necesita servidor aparte: frontend y backend corren en el mismo proyecto Next.js.
