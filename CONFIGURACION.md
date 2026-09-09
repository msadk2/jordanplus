# SpinningTV · configuración con Supabase

Este proyecto es independiente de M17Liv3. La página pública solo muestra la cartelera y el panel de administración permite leer una captura, corregir el texto y publicarlo.

## Acceso inicial

- Usuario visible: `admin`
- Contraseña temporal recomendada: `admin123`

Supabase exige normalmente un mínimo de 6 caracteres, por eso no se utiliza `admin` como contraseña. Después del primer acceso podrás cambiar tanto el usuario como la contraseña desde el apartado **Cambiar acceso**.

## 1. Crear el proyecto en Supabase

1. Entra en `https://supabase.com/dashboard`.
2. Pulsa **New project**.
3. Elige un nombre, por ejemplo `spinningtv-cartelera`.
4. Crea una contraseña para la base de datos y guárdala.
5. Espera a que el proyecto termine de prepararse.

## 2. Crear el administrador

1. En el menú de Supabase entra en **Authentication > Users**.
2. Pulsa **Add user > Create new user**.
3. Escribe un correo que controles.
4. Escribe como contraseña temporal `admin123`.
5. Activa **Auto Confirm User** y crea el usuario.
6. En la configuración de Authentication, desactiva el registro de nuevos usuarios si no vas a crear más administradores.

El correo se utilizará internamente para Supabase. En la página de administración entrarás escribiendo `admin`, no el correo.

## 3. Preparar la base de datos

1. Abre el archivo `supabase-configuracion.sql` con el Bloc de notas.
2. Reemplaza todas las apariciones de `TU_CORREO_ADMIN` por el mismo correo creado en el paso anterior.
3. En Supabase entra en **SQL Editor** y pulsa **New query**.
4. Copia todo el contenido del archivo SQL, pégalo y pulsa **Run**.
5. Debe aparecer el mensaje de ejecución correcta.

Este script deja la cartelera pública en modo lectura y reserva la modificación únicamente al usuario administrador.

## 4. Conectar los archivos

1. En Supabase abre **Project Settings > Data API** o **Settings > API**.
2. Copia **Project URL**.
3. Copia la **Publishable key**. Si tu proyecto todavía muestra las claves antiguas, copia la clave **anon public**.
4. Abre `config-cartelera.js` y completa:

```javascript
supabaseUrl: "PEGA_AQUI_PROJECT_URL",
supabaseKey: "PEGA_AQUI_PUBLISHABLE_O_ANON_KEY",
adminEmail: "EL_MISMO_CORREO_DEL_ADMINISTRADOR",
```

La Publishable/anon key puede estar en GitHub porque las reglas de seguridad protegen las modificaciones. No utilices ni publiques nunca `service_role`, `secret key` ni la contraseña de la base de datos.

## 5. Subir a GitHub

Sube a la raíz del repositorio `jordanplus` estos cinco archivos:

- `admin-cartelera.html`
- `cartelera.html`
- `cartelera.css`
- `cartelera-common.js`
- `config-cartelera.js`

El archivo `logo.png` ya está en el repositorio y se utilizará automáticamente. No es necesario subir `supabase-configuracion.sql`.

Direcciones finales:

- Administración: `https://msadk2.github.io/jordanplus/admin-cartelera.html`
- Clientes/app: `https://msadk2.github.io/jordanplus/cartelera.html`

No enlaces la página de administración desde `index.html`. Aunque alguien descubra su dirección, no podrá publicar sin las credenciales correctas.

## Uso diario

1. Abre `admin-cartelera.html`.
2. Entra con el usuario y contraseña del administrador.
3. Selecciona la captura.
4. Pulsa **LEER TEXTO DE LA CAPTURA**.
5. Corrige cualquier nombre u horario.
6. Pulsa **ACTUALIZAR VISTA PREVIA**.
7. Pulsa **PUBLICAR CARTELERA**.

Los clientes verán los cambios en `cartelera.html`; la página comprobará automáticamente si hay novedades cada minuto.

## Importante

- La captura se procesa dentro del navegador y no se publica.
- La página pública no permite editar la cartelera.
- El usuario puede cambiarse desde **Cambiar acceso**.
- La contraseña nueva debe contener al menos 6 caracteres.
- Si olvidas la contraseña, puedes restablecerla desde **Authentication > Users** en Supabase.
