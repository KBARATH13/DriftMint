import React, { useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import "./NotificationToast.css";

export default function NotificationToast() {
  const { toast, clearToast } = useWeb3();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      clearToast();
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  const { message, type, txHash } = toast;

  let icon = "ℹ️";
  let borderClass = "toast-info";
  if (type === "success") {
    icon = "⚡";
    borderClass = "toast-success";
  } else if (type === "error") {
    icon = "⚠️";
    borderClass = "toast-error";
  }

  return (
    <div className={`notification-toast ${borderClass}`}>
      <span className="toast-icon">{icon}</span>
      <div className="toast-body">
        <div className="toast-message">{message}</div>
        {txHash && (
          <div className="toast-tx-hash">
            Tx: <code>{txHash.slice(0, 10)}...{txHash.slice(-8)}</code>
          </div>
        )}
      </div>
      <button className="toast-close" onClick={clearToast}>✕</button>
    </div>
  );
}

