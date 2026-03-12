import { useEffect, useState } from "react";

function useIsPortraitMobile() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.matchMedia("(max-width: 900px)").matches;
      const portrait = window.matchMedia("(orientation: portrait)").matches;
      setShow(mobile && portrait);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  return show;
}

export default function PortraitOverlay() {
  const show = useIsPortraitMobile();
  if (!show) return null;
  return (
    <div className="portrait-overlay">
      <div className="portrait-overlay-inner">
        <div className="portrait-icon">📱➡️🔄</div>
        <h2>Rotate Your Device</h2>
        <p>CarrierChaos is best played in <strong>landscape</strong> mode.</p>
        <p className="portrait-sub">Please rotate your phone sideways to continue.</p>
      </div>
    </div>
  );
}
