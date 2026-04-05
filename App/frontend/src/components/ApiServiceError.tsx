type ApiServiceErrorProps = {
  title?: string;
  message: string;
  statusCode?: number;
  onRetry?: () => void;
};

export function ApiServiceError({
  title = "Service unavailable",
  message,
  statusCode,
  onRetry,
}: ApiServiceErrorProps) {
  return (
    <div className="mx-auto my-8 max-w-3xl rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-50">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-red-100">{message}</p>
      {statusCode ? (
        <p className="mt-2 text-xs uppercase tracking-wide text-red-200">
          Error code: {statusCode}
        </p>
      ) : null}
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-4 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
          type="button"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
