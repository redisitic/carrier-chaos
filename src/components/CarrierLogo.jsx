/**
 * CarrierLogo — displays a carrier's brand logo image.
 * Falls back to the emoji icon if no logo is available.
 *
 * Usage:
 *   <CarrierLogo name="FedEx" size={28} />
 *   <CarrierLogo name="FedEx" size={28} className="my-class" />
 */

// Map carrier names to their public logo paths
export const CARRIER_LOGOS = {
  "FedEx": "/brand-logos/FedEx.svg",
  "UPS": "/brand-logos/UPS.svg",
  "DHL": "/brand-logos/DSL.svg",
  "Delhivery": "/brand-logos/Delhivery.svg",
  "Bluedart": "/brand-logos/Blue Dart.svg",
  "Maersk": "/brand-logos/Maersk.svg",
};

export default function CarrierLogo({ name, size = 28, className = "", style = {} }) {
  const src = CARRIER_LOGOS[name];
  if (!src) return null;

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className={`carrier-logo ${className}`}
      style={{ objectFit: "contain", display: "inline-block", verticalAlign: "middle", ...style }}
    />
  );
}
