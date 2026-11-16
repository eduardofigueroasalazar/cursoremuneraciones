# Capacitación SIGPER Remuneraciones y Centralización 2026

Aplicación web estática de estudio y evaluación basada en las 4 sesiones del curso SIGPER Remuneraciones & Centralización Contable.

## Funcionalidades
1. **Cuestionario (100 preguntas):**
   - 25 preguntas por cada sesión (Sesión 1 a Sesión 4), con referencia a la lámina correspondiente y explicación de la respuesta.
   - Filtros por sesión, dificultad y modo (todas, repaso rápido de 20 aleatorias o solo incorrectas).
   - Guardado automático del progreso en `localStorage`.
2. **Explicador de Cálculos Excel (6 libros de taller):**
   - Desglose de fórmulas, datos de entrada, resultados y explicación paso a paso para cada taller (`Taller_Sesion_1`, `Sesion_2_Taller_Ejercicio_1`, `Sesion_3_Taller_Ejercicio_1/2/3`, `Sesion_4_Taller_Ejercicio_1`).
   - Buscador por concepto, fórmula o celda.

## Prueba local
Como la aplicación carga archivos JSON mediante `fetch`, ábrela a través de un servidor HTTP local:

```powershell
python -m http.server 8080
```

Luego abre `http://localhost:8080` en el navegador.

## Publicación en GitHub Pages
1. Sube este repositorio a GitHub (los archivos `.pptx`, `.xlsx`, `.docx` y `.mp3` están excluidos en `.gitignore`).
2. En GitHub, ve a **Settings → Pages**.
3. En **Build and deployment**, selecciona **Deploy from a branch**, rama `main` y carpeta `/ (root)`.
4. Guarda los cambios y abre la URL generada por GitHub Pages para testear la aplicación.
