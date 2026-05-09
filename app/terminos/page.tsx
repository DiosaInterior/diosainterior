import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones — Diosa Interior",
  description:
    "Términos y condiciones de uso del servicio Diosa Interior.",
};

export default function TerminosPage() {
  return (
    <main className="dark-radial min-h-dvh">
      <article className="mx-auto max-w-[720px] px-6 py-16 sm:py-20">
        <h1 className="font-cormorant italic font-light text-marfil text-4xl sm:text-5xl leading-tight tracking-tight">
          Términos y Condiciones
        </h1>
        <p className="font-raleway text-sm text-marfil-suave/70 mt-4 mb-12">
          <strong className="font-medium text-marfil-suave">
            Última actualización:
          </strong>{" "}
          9 de mayo de 2026
        </p>

        <p className="font-raleway text-marfil leading-relaxed mb-8">
          Bienvenida a Diosa Interior. Al usar este sitio web (diosainterior.app)
          y nuestros servicios, aceptás los siguientes términos. Si no estás de
          acuerdo, te pedimos no usar la plataforma.
        </p>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          1. Sobre Diosa Interior
        </h2>
        <p className="font-raleway text-marfil-suave leading-relaxed mb-4">
          Diosa Interior es una guía de colorimetría personal calibrada con
          sistemas científicos reconocidos (Munsell, CIE Lab*, Fitzpatrick
          Scale, Princeton PERLA Project). Generamos paletas cromáticas
          individuales basadas en el análisis de fotografías que vos nos
          provees.
        </p>
        <p className="font-raleway text-marfil-suave leading-relaxed">
          El servicio se ofrece &ldquo;tal como está&rdquo;. No somos una
          asesoría médica, dermatológica ni profesional de imagen certificada.
          Nuestras recomendaciones son orientativas, no prescriptivas.
        </p>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          2. Cómo funciona el servicio
        </h2>
        <p className="font-raleway text-marfil-suave leading-relaxed mb-4">
          Al contratar nuestro análisis:
        </p>
        <ul className="font-raleway text-marfil-suave leading-relaxed list-disc pl-6 space-y-2">
          <li>Vos nos das 4 fotografías tuyas en luz natural.</li>
          <li>Procesamos esas imágenes mediante inteligencia artificial.</li>
          <li>Generamos tu paleta personal y la entregamos en una guía digital.</li>
          <li>La guía queda disponible en tu cuenta de forma permanente.</li>
        </ul>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          3. Pagos
        </h2>
        <ul className="font-raleway text-marfil-suave leading-relaxed list-disc pl-6 space-y-2">
          <li>Los pagos se procesan a través de Stripe, nuestro proveedor de pagos.</li>
          <li>No almacenamos información de tu tarjeta en nuestros servidores.</li>
          <li>
            Los precios están expresados en pesos mexicanos (MXN) o la moneda
            local según tu región.
          </li>
          <li>
            Una vez procesado el análisis, no aplicamos reembolsos, ya que el
            servicio fue entregado en su totalidad.
          </li>
        </ul>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          4. Tus derechos
        </h2>
        <ul className="font-raleway text-marfil-suave leading-relaxed list-disc pl-6 space-y-2">
          <li>Tu guía es tuya. Podés guardarla, compartirla y usarla como prefieras.</li>
          <li>
            Podés solicitar acceso a tus datos, su corrección o eliminación, en
            cualquier momento, escribiendo a{" "}
            <a
              href="mailto:hola@diosainterior.app"
              className="text-terra-diosa hover:text-terra-2 transition-colors"
            >
              hola@diosainterior.app
            </a>
            .
          </li>
        </ul>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          5. Limitaciones
        </h2>
        <ul className="font-raleway text-marfil-suave leading-relaxed list-disc pl-6 space-y-2">
          <li>No nos hacemos responsables del uso que vos hagas de las recomendaciones.</li>
          <li>No garantizamos resultados específicos en términos de imagen personal.</li>
          <li>No nos responsabilizamos por interrupciones técnicas momentáneas.</li>
        </ul>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          6. Contenido del usuario
        </h2>
        <p className="font-raleway text-marfil-suave leading-relaxed">
          Las fotografías que vos subís son tuyas. Solo las usamos para generar
          tu análisis. No las publicamos, vendemos ni compartimos con terceros,
          salvo con nuestros proveedores de IA (Anthropic) y solo para procesar
          tu pedido.
        </p>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          7. Cambios
        </h2>
        <p className="font-raleway text-marfil-suave leading-relaxed">
          Podemos actualizar estos términos. Te notificaremos por email si los
          cambios son sustanciales.
        </p>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          8. Jurisdicción
        </h2>
        <p className="font-raleway text-marfil-suave leading-relaxed">
          Estos términos se rigen por las leyes de México. Cualquier disputa
          será resuelta en tribunales mexicanos.
        </p>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          9. Contacto
        </h2>
        <p className="font-raleway text-marfil-suave leading-relaxed">
          Si tenés preguntas:{" "}
          <a
            href="mailto:hola@diosainterior.app"
            className="text-terra-diosa hover:text-terra-2 transition-colors"
          >
            hola@diosainterior.app
          </a>
        </p>
      </article>
    </main>
  );
}
