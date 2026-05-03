import { createExportContract } from './contracts';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const classifyExportError = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const name = String(error?.name || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  const nonRetryableSignals = ['VALIDATION', 'UNSUPPORTED', 'SECURITY', 'TYPE'];
  if (nonRetryableSignals.some((signal) => code.includes(signal) || name.includes(signal))) {
    return { retryable: false, reason: code || name || 'NON_RETRYABLE_CLASSIFIED' };
  }
  if (message.includes('invalid') || message.includes('unsupported') || message.includes('tainted canvas')) {
    return { retryable: false, reason: 'NON_RETRYABLE_MESSAGE_CLASSIFIED' };
  }
  return { retryable: true, reason: 'RETRYABLE_DEFAULT' };
};

async function runStepWithPolicy({
  stepName,
  execute,
  timeoutMs = 4500,
  maxRetries = 2,
  initialBackoffMs = 150,
  diagnostics,
}) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    attempt += 1;
    const attemptStartedAt = Date.now();
    try {
      const result = await Promise.race([
        execute(),
        new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error(`${stepName} timed out`), { code: 'STEP_TIMEOUT' })), timeoutMs)),
      ]);
      diagnostics.steps.push({
        step: stepName,
        status: 'success',
        attempt,
        durationMs: Date.now() - attemptStartedAt,
      });
      return result;
    } catch (error) {
      const classification = classifyExportError(error);
      const canRetry = classification.retryable && attempt <= maxRetries;
      const failureRecord = {
        step: stepName,
        status: 'failure',
        attempt,
        durationMs: Date.now() - attemptStartedAt,
        errorCode: error?.code || null,
        errorName: error?.name || null,
        reason: error?.message || 'unknown export error',
        retryable: classification.retryable,
        classification: classification.reason,
      };
      diagnostics.steps.push(failureRecord);
      diagnostics.failures.push(failureRecord);
      if (!canRetry) throw error;
      await wait(initialBackoffMs * 2 ** (attempt - 1));
    }
  }
}

export async function exportFrame({ contractInput, sceneModel, sceneRenderer, domFallbackRenderer, preflightResult = null }) {
  const contract = createExportContract(contractInput);
  const exportMetadata = {
    preflight: preflightResult,
    citationMode: contract.citationMode || 'off',
    exportedAt: new Date().toISOString(),
  };
  const diagnostics = {
    policy: { timeoutMs: 4500, maxRetries: 2, backoff: 'exponential', nonRetryableClassifier: 'error-code-name-message' },
    steps: [],
    failures: [],
    fallback: null,
  };
  try {
    const canvas = await runStepWithPolicy({
      stepName: 'scene-render',
      execute: () => sceneRenderer(sceneModel, contract),
      diagnostics,
    });
    return { canvas, contract, usedFallback: false, exportMetadata, diagnostics };
  } catch (error) {
    if (!domFallbackRenderer) throw error;
    diagnostics.fallback = {
      chosen: 'dom-snapshot',
      triggerStep: 'scene-render',
      triggerReason: error?.message || 'scene renderer failed',
    };
    const canvas = await runStepWithPolicy({
      stepName: 'dom-fallback-render',
      execute: () => domFallbackRenderer(contract, error),
      diagnostics,
    });
    return { canvas, contract, usedFallback: true, fallbackReason: error?.message || 'scene renderer failed', exportMetadata, diagnostics };
  }
}
