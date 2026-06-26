'use client';

import { useState } from 'react';

const PREVIEW_ERROR_MESSAGE = 'Preview error: triggered from /blog/preview/error.';

const ErrorBoundaryTrigger = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error(PREVIEW_ERROR_MESSAGE);
  }

  return (
    <button
      type="button"
      onClick={() => setShouldThrow(true)}
      className="mt-6 inline-flex items-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
    >
      Trigger real error boundary
    </button>
  );
};

export default ErrorBoundaryTrigger;
