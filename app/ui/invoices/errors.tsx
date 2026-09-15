type ErrorsDisplayProps = {
  id: string;
  errors?: string[];
};

export function ErrorsDisplay({ id, errors }: ErrorsDisplayProps) {
  return (
    <div id={id} aria-live="polite" aria-atomic="true">
      {errors &&
        errors.map((error) => (
          <p className="mt-2 text-sm text-red-500" key={error}>
            {error}
          </p>
        ))}
    </div>
  );
}

type ErrorMessageDisplayProps = {
  id: string;
  message?: string;
};

export function ErrorMessageDisplay({ id, message }: ErrorMessageDisplayProps) {
  return (
    <div id={id} aria-live="polite" aria-atomic="true">
      {message && <p className="mt-2 text-sm text-red-500">{message}</p>}
    </div>
  );
}
