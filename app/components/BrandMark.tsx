/* eslint-disable @next/next/no-img-element */

type BrandMarkProps = {
  className?: string;
  size?: number;
};

function publicAsset(path: string) {
  const configuredBasePath = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_PAGES_BASE_PATH || "" : "";
  if (configuredBasePath) return `${configuredBasePath}${path}`;
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/design-systems-lab")) return `/design-systems-lab${path}`;
  return path;
}

export function BrandMark({ className = "", size = 40 }: BrandMarkProps) {
  return (
    <span
      className={`brand-mark ${className}`}
      role="img"
      aria-label="Laboratorio de Sistemas de Diseño"
      style={{ width: size, height: size }}
    >
      <img className="brand-mark-image brand-mark-image-light" src={publicAsset("/brand/logo-for-light-mode.png")} alt="" aria-hidden="true" />
      <img className="brand-mark-image brand-mark-image-dark" src={publicAsset("/brand/logo-for-dark-mode.png")} alt="" aria-hidden="true" />
    </span>
  );
}
