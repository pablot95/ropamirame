# Configuración de MercadoPago en Hostinger

## 🔒 Seguridad de Credenciales

### ¿Dónde están las credenciales?

1. **Public Key** (frontend): En `checkout.js` - ✅ SEGURO (es pública)
2. **Access Token** (backend): En `admin/api/mp_config.php` - ⚠️ NO SUBIR A GITHUB

### 📋 Pasos para desplegar en Hostinger:

#### 1. Subir archivos al servidor
- Sube todos los archivos EXCEPTO `admin/api/mp_config.php`
- Este archivo debe crearse directamente en el servidor

#### 2. Crear mp_config.php en el servidor
Accede al administrador de archivos de Hostinger y crea el archivo `admin/api/mp_config.php` con este contenido:

```php
<?php
// Configuración de MercadoPago
define('MP_ACCESS_TOKEN', 'APP_USR-7082288961159030-021613-508913ef639703ee65712094526a4b18-232942814');
define('MP_PUBLIC_KEY', 'APP_USR-0105d511-0e85-4b9f-b131-ae47ad7210a6');
?>
```

#### 3. Proteger el archivo (importante)
En Hostinger, agrega estas reglas al archivo `.htaccess` en la carpeta `admin/api/`:

```apache
<Files "mp_config.php">
    Order allow,deny
    Deny from all
</Files>
```

Esto evita que alguien pueda acceder directamente a `tudominio.com/admin/api/mp_config.php`

### 🔐 Proteger el repositorio de GitHub

El archivo `.gitignore` ya está configurado para NO subir `mp_config.php`.

Antes de hacer `git push`, verifica que no se incluya:
```bash
git status
```

Si aparece `mp_config.php`, asegúrate de que `.gitignore` esté correcto.

### 🌐 URLs de retorno de MercadoPago

Actualmente las URLs de retorno están configuradas como:
```php
"back_urls" => [
    "success" => "http://" . $_SERVER['HTTP_HOST'] . "/index.html",
    "failure" => "http://" . $_SERVER['HTTP_HOST'] . "/index.html",
    "pending" => "http://" . $_SERVER['HTTP_HOST'] . "/index.html"
]
```

Esto detecta automáticamente tu dominio. Si necesitas URLs específicas, modifícalas en `admin/api/create_preference.php`.

### ✅ Verificación

Para verificar que todo funciona:
1. Accede a tu sitio en Hostinger
2. Agrega productos al carrito
3. Ve al checkout
4. Completa el formulario
5. Verifica que aparezca el botón de MercadoPago

---

## 📦 Sistema de Órdenes

### Cómo funciona:
1. Cuando un cliente confirma el pago, la orden se guarda automáticamente en Firebase
2. En el panel de administración puedes ver todas las órdenes
3. Puedes filtrar por estado: Todas, Pendientes, Aprobadas
4. Puedes cambiar el estado de las órdenes
5. Se guarda toda la información del cliente y los productos comprados

### Datos que se guardan:
- Información del cliente (nombre, email, teléfono, dirección)
- Productos comprados (nombre, cantidad, precio)
- Total de la compra
- Estado del pago
- Fecha y hora de la orden

### Acceder a las órdenes:
1. Ingresa al panel de administración
2. Desplázate hasta la sección "Órdenes de Compra"
3. Filtra y gestiona las órdenes según necesites
