"use client";

interface LocationButtonProps {
  loading: boolean;
  hasLocation: boolean;
  onClick: () => void;
  label?: string;
  refreshLabel?: string;
}

export default function LocationButton({
  loading,
  hasLocation,
  onClick,
  label = "Use My Location",
  refreshLabel = "Refresh",
}: LocationButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="btn-gold w-full rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 text-sm"
    >
      {loading ? (
        <>
          <span className="spinner" />
          <span>Locating…</span>
        </>
      ) : (
        <>
          <span>{hasLocation ? refreshLabel : label}</span>
        </>
      )}
    </button>
  );
}