import Image from "next/image";

// Logo oficial de Diosa Interior — flor de 8 pétalos en marfil.
// Único punto de referencia al asset /public/logo.png. Si el logo
// cambia, sólo este componente se actualiza.

type LogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function Logo({
  size = 120,
  className = "",
  priority = true,
}: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Diosa Interior"
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
