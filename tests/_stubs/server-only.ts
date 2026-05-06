// Stub para vitest — el paquete real `server-only` lanza al ser
// importado en contextos no-server (su index.js es un `throw new Error(...)`
// top-level). Vitest corre como Node fuera del contexto de Next, así
// que cualquier módulo bajo test que haga `import 'server-only'`
// crashea al cargar.
//
// La verdadera protección "este módulo no debe importarse desde
// cliente" la hace Next.js durante el build de producción al detectar
// el paquete real. En tests, este alias lo neutraliza.
export {};
