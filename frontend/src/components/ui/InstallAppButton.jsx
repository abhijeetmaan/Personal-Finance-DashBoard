import { useEffect, useState } from "react";
import { Download } from "lucide-react";

function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setCanInstall(true);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  if (!canInstall) return null;

  return (
    <button
      type="button"
      onClick={handleInstall}
      className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      <Download className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
      Install app
    </button>
  );
}

export default InstallAppButton;
