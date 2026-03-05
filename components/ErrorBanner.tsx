interface ErrorBannerProps {
  message: string;
}

export default function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="bg-red-500/10 border border-red-500/25 rounded-xl px-5 py-3.5
                 text-red-300 text-sm flex items-start gap-3"
    >
      <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
      <span>{message}</span>
    </div>
  );
}