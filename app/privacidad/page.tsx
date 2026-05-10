import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso de Privacidad — Diosa Interior",
  description:
    "Aviso de privacidad y tratamiento de datos personales en Diosa Interior.",
};

export default function PrivacidadPage() {
  return (
    <main className="dark-radial min-h-dvh">
      <article className="mx-auto max-w-[720px] px-6 py-16 sm:py-20">
        <h1 className="font-cormorant italic font-light text-marfil text-4xl sm:text-5xl leading-tight tracking-tight">
          Aviso de Privacidad
        </h1>
        <p className="font-raleway text-sm text-marfil-suave/70 mt-4 mb-12">
          <strong className="font-medium text-marfil-suave">
            Última actualización:
          </strong>{" "}
          9 de mayo de 2026
        </p>

        <p className="font-raleway text-marfil leading-relaxed mb-8">
          En Diosa Interior nos tomamos en serio tu privacidad. Este aviso
          explica qué datos recolectamos, por qué, y cómo los protegemos.
        </p>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          1. Quién es responsable
        </h2>
        <p className="font-raleway text-marfil-suave leading-relaxed mb-4">
          Diosa Interior (diosainterior.app) es responsable del tratamiento de
          tus datos personales.
        </p>
        <p className="font-raleway text-marfil-suave leading-relaxed">
          <strong className="font-medium text-marfil">
            Contacto del responsable:
          </strong>{" "}
          <a
            href="mailto:hola@diosainterior.app"
            className="text-terra-diosa hover:text-terra-2 transition-colors"
          >
            hola@diosainterior.app
          </a>
        </p>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          2. Qué datos recolectamos
        </h2>
        <p className="font-raleway text-marfil-suave leading-relaxed mb-4">
          Cuando usás nuestro servicio, recolectamos:
        </p>
        <ul className="font-raleway text-marfil-suave leading-relaxed list-disc pl-6 space-y-3">
          <li>
            <strong className="font-medium text-marfil">Datos de cuenta:</strong>{" "}
            tu email y nombre (vía Google Sign-In).
          </li>
          <li>
            <strong className="font-medium text-marfil">Fotografías:</strong>{" "}
            las 4 imágenes que vos subís voluntariamente para tu análisis. Estas
            son consideradas datos personales sensibles.
          </li>
          <li>
            <strong className="font-medium text-marfil">Datos de pago:</strong>{" "}
            procesados directamente por Stripe. Nosotros no almacenamos
            información de tu tarjeta.
          </li>
          <li>
            <strong className="font-medium text-marfil">Datos técnicos:</strong>{" "}
            dirección IP, navegador, dispositivo, para que la app funcione.
          </li>
        </ul>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          3. Para qué los usamos
        </h2>
        <ul className="font-raleway text-marfil-suave leading-relaxed list-disc pl-6 space-y-2">
          <li>Generar tu paleta personal de colorimetría.</li>
          <li>Permitirte acceder a tu guía cuando quieras.</li>
          <li>Comunicarnos con vos sobre tu pedido.</li>
          <li>Mejorar nuestro servicio.</li>
        </ul>
        <p className="font-raleway text-marfil-suave leading-relaxed mt-4">
          No vendemos tus datos. No los usamos para publicidad de terceros.
        </p>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          4. Con quién los compartimos
        </h2>
        <p className="font-raleway text-marfil-suave leading-relaxed mb-4">
          Solo con proveedores que nos ayudan a operar:
        </p>
        <ul className="font-raleway text-marfil-suave leading-relaxed list-disc pl-6 space-y-2">
          <li>
            <strong className="font-medium text-marfil">Supabase</strong>{" "}
            (almacenamiento y autenticación)
          </li>
          <li>
            <strong className="font-medium text-marfil">Stripe</strong>{" "}
            (procesamiento de pagos)
          </li>
          <li>
            <strong className="font-medium text-marfil">Anthropic</strong>{" "}
            (procesamiento de IA para generar tu guía)
          </li>
          <li>
            <strong className="font-medium text-marfil">Vercel</strong>{" "}
            (hosting de la aplicación)
          </li>
        </ul>
        <p className="font-raleway text-marfil-suave leading-relaxed mt-4">
          Cada uno de estos proveedores tiene sus propias políticas de
          privacidad y cumple con estándares internacionales de seguridad.
        </p>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          5. Datos sensibles: tus fotografías
        </h2>
        <p className="font-raleway text-marfil-suave leading-relaxed mb-4">
          Tus fotografías son consideradas datos personales sensibles bajo la
          ley mexicana (LFPDPPP) y leyes equivalentes en Argentina, Colombia y
          otros países. Las tratamos con cuidado especial:
        </p>
        <ul className="font-raleway text-marfil-suave leading-relaxed list-disc pl-6 space-y-2">
          <li>Solo se usan para generar tu paleta.</li>
          <li>Se almacenan en servidores con cifrado.</li>
          <li>No se comparten con nadie fuera de los proveedores listados arriba.</li>
          <li>Podés solicitar su eliminación en cualquier momento.</li>
        </ul>
        <p className="font-raleway text-marfil-suave leading-relaxed mt-4">
          Al subir tus fotos, nos das tu consentimiento expreso para
          procesarlas con este fin.
        </p>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          6. Tus derechos (ARCO)
        </h2>
        <p className="font-raleway text-marfil-suave leading-relaxed mb-4">
          Tenés derecho a:
        </p>
        <ul className="font-raleway text-marfil-suave leading-relaxed list-disc pl-6 space-y-2">
          <li>
            <strong className="font-medium text-marfil">Acceder</strong> a tus
            datos personales.
          </li>
          <li>
            <strong className="font-medium text-marfil">Rectificar</strong>{" "}
            datos incorrectos.
          </li>
          <li>
            <strong className="font-medium text-marfil">Cancelar</strong> o
            eliminar tus datos.
          </li>
          <li>
            <strong className="font-medium text-marfil">Oponerte</strong> al uso
            de tus datos.
          </li>
        </ul>
        <p className="font-raleway text-marfil-suave leading-relaxed mt-4">
          Para ejercerlos, escribinos a{" "}
          <a
            href="mailto:hola@diosainterior.app"
            className="text-terra-diosa hover:text-terra-2 transition-colors"
          >
            hola@diosainterior.app
          </a>
          . Te respondemos en un plazo máximo de 20 días hábiles.
        </p>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          7. Cuánto tiempo guardamos tus datos
        </h2>
        <ul className="font-raleway text-marfil-suave leading-relaxed list-disc pl-6 space-y-2">
          <li>
            <strong className="font-medium text-marfil">Datos de cuenta:</strong>{" "}
            mientras tu cuenta esté activa.
          </li>
          <li>
            <strong className="font-medium text-marfil">
              Fotografías originales:
            </strong>{" "}
            las eliminamos a los 90 días de generada tu guía.
          </li>
          <li>
            <strong className="font-medium text-marfil">Tu guía generada:</strong>{" "}
            permanece en tu cuenta hasta que vos la elimines.
          </li>
          <li>
            <strong className="font-medium text-marfil">Datos de pago:</strong>{" "}
            según los plazos legales fiscales (mínimo 5 años).
          </li>
        </ul>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          8. Transferencias internacionales
        </h2>
        <p className="font-raleway text-marfil-suave leading-relaxed">
          Tus datos pueden ser procesados en servidores ubicados en Estados
          Unidos (Vercel, Supabase, Stripe, Anthropic). Estos proveedores
          cumplen con cláusulas contractuales estándar y certificaciones
          internacionales de seguridad.
        </p>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          9. Seguridad
        </h2>
        <p className="font-raleway text-marfil-suave leading-relaxed">
          Implementamos medidas técnicas razonables: cifrado en tránsito
          (HTTPS), cifrado en reposo, acceso restringido por roles,
          autenticación segura. Ninguna plataforma online es 100% invulnerable,
          pero hacemos lo necesario para protegerte.
        </p>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          10. Menores de edad
        </h2>
        <p className="font-raleway text-marfil-suave leading-relaxed">
          Nuestro servicio está destinado a personas mayores de 18 años. No
          recolectamos intencionalmente datos de menores. Si detectamos que una
          cuenta pertenece a una persona menor de edad, la eliminamos.
        </p>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          11. Cambios a este aviso
        </h2>
        <p className="font-raleway text-marfil-suave leading-relaxed">
          Si actualizamos este aviso de forma sustancial, te lo notificaremos
          por email y publicaremos la nueva versión en esta página.
        </p>

        <h2 className="font-cormorant italic text-marfil text-2xl sm:text-3xl mt-12 mb-4 leading-tight">
          12. Contacto
        </h2>
        <p className="font-raleway text-marfil-suave leading-relaxed">
          Para cualquier consulta sobre privacidad:{" "}
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
