import { useEffect, useId, useRef, useState } from "react";

export type GoogleDriveControlState = "disconnected" | "remembered" | "connecting" | "connected" | "saving" | "error";

export type GoogleDriveControlLabels = {
  connect: string;
  reconnect: string;
  connecting: string;
  saving: string;
  connected: string;
  remembered: string;
  error: string;
  popover: string;
  syncDescription: string;
  disconnect: string;
};

type GoogleDriveControlProps = {
  state: GoogleDriveControlState;
  email: string | null;
  labels: GoogleDriveControlLabels;
  onConnect: () => void;
  onDisconnect: () => void;
  disabled?: boolean;
};

export function GoogleDriveControl({ state, email, labels, onConnect, onDisconnect, disabled = false }: GoogleDriveControlProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverId = useId();
  const tooltipId = useId();
  const connected = state === "connected";
  const activeLabel = labelsForState(state, labels);

  useEffect(() => {
    if (!popoverOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPopoverOpen(false);
      buttonRef.current?.focus();
    };
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setPopoverOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, [popoverOpen]);

  function handleControlClick() {
    if (connected) {
      setPopoverOpen((open) => !open);
      return;
    }
    setPopoverOpen(false);
    onConnect();
  }

  function handleDisconnect() {
    setPopoverOpen(false);
    onDisconnect();
    requestAnimationFrame(() => buttonRef.current?.focus());
  }

  return (
    <div className="sync-control-wrap" ref={rootRef}>
      <button
        aria-controls={connected ? popoverId : undefined}
        aria-describedby={tooltipId}
        aria-expanded={connected ? popoverOpen : undefined}
        aria-haspopup={connected ? "dialog" : undefined}
        aria-label={activeLabel}
        className="sync-control"
        data-state={state}
        disabled={disabled}
        onClick={handleControlClick}
        ref={buttonRef}
        title={activeLabel}
        type="button"
      >
        {state === "connected" ? (
          <CloudCheckIcon />
        ) : state === "error" ? (
          <CloudAlertIcon />
        ) : (
          <SyncIcon />
        )}
      </button>
      <span className="sync-control__tooltip" id={tooltipId} role="tooltip">{activeLabel}</span>
      <span aria-live="polite" className="visually-hidden">{activeLabel}</span>
      {connected && popoverOpen && (
        <section aria-label={labels.popover} className="sync-control-popover" id={popoverId} role="dialog">
          <strong>{labels.connected}</strong>
          {email && <span className="sync-control-popover__email">{email}</span>}
          <p className="sync-control-popover__description">{labels.syncDescription}</p>
          <button className="settings-action" onClick={handleDisconnect} type="button">{labels.disconnect}</button>
        </section>
      )}
    </div>
  );
}

function labelsForState(state: GoogleDriveControlState, labels: GoogleDriveControlLabels) {
  switch (state) {
    case "remembered": return labels.remembered;
    case "connecting": return labels.connecting;
    case "connected": return labels.connected;
    case "saving": return labels.saving;
    case "error": return labels.error;
    default: return labels.connect;
  }
}

function SyncIcon() {
  return (
    <svg aria-hidden="true" className="sync-control__arrows" fill="none" viewBox="0 0 24 24">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function CloudCheckIcon() {
  return (
    <svg aria-hidden="true" className="sync-control__cloud" fill="none" viewBox="0 0 24 24">
      <path d="M7.5 18.5h9a4.5 4.5 0 0 0 .85-8.92A5.75 5.75 0 0 0 6.4 11.1 3.7 3.7 0 0 0 7.5 18.5Z" />
      <path d="m9.5 14.1 1.7 1.7 3.6-3.8" />
    </svg>
  );
}

function CloudAlertIcon() {
  return (
    <svg aria-hidden="true" className="sync-control__cloud" fill="none" viewBox="0 0 24 24">
      <path d="M7.5 18.5h9a4.5 4.5 0 0 0 .85-8.92A5.75 5.75 0 0 0 6.4 11.1 3.7 3.7 0 0 0 7.5 18.5Z" />
      <path d="M12 10.5v3.3" />
      <path d="M12 16.5h.01" />
    </svg>
  );
}
