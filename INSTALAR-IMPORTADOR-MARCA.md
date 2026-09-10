# Actualizar el importador de hoy y la consulta de mañana

El importador necesita una **Edge Function de Supabase** porque una página de GitHub no puede leer directamente la web de MARCA. No hay que ejecutar ningún archivo SQL.

## 1. Actualizar la función en Supabase

1. Abre tu proyecto `spinningtv-cartelera` en Supabase.
2. En el menú izquierdo entra en **Edge Functions**.
3. Abre la función que ya tienes con este nombre:

   `importar-marca`

4. Abre el archivo `index.ts` incluido en este paquete, copia todo su contenido y sustituye el código anterior.
5. Pulsa **Deploy function**.
6. Mantén desactivado **Verify JWT / Enforce JWT verification**. Esta función no guarda ni modifica la base de datos: únicamente lee una dirección fija de MARCA y devuelve los eventos solicitados.

## 2. Actualizar GitHub

Sustituye en la raíz del repositorio `jordanplus` los archivos incluidos en el paquete. No sustituyas tu `config-cartelera.js`.

El archivo situado en `supabase/functions/importar-marca/index.ts` **no se sube a GitHub**: se pega en el editor de la Edge Function de Supabase.

## 3. Probar

Espera unos segundos y abre:

`https://msadk2.github.io/jordanplus/panel-cartelera.html?v=manana1`

Después:

1. Pulsa **IMPORTAR EVENTOS DE HOY** y comprueba que solo carga el día actual.
2. Pulsa **VER EVENTOS DE MAÑANA** y comprueba que aparecen en el recuadro independiente.
3. Pulsa **COPIAR TEXTO** si quieres copiar la programación de mañana.
4. Publica solamente los eventos de hoy cuando estén revisados.

La consulta de mañana no cambia el borrador ni modifica la cartelera pública.
