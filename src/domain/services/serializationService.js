import { normalizeContentTaxonomy } from '../../utils/contentNormalization';
import { evaluateContentFreshness } from '../provenanceFreshnessPolicy.js';

export function buildFrameSave({ frameId, theme, content, overrides, aspectRatio, bgGradient, patternOverlay, workflowPhase = "draft", phaseChecklist = null, sectionLocks = {}, signoffRecord = null }) {
  const normalization = normalizeContentTaxonomy(content || {});
  const freshness = evaluateContentFreshness({ stats: normalization.content?.stats, tableRows: normalization.content?.tableRows });
  const saveMetadata = {
    freshness: {
      classification: freshness.totals,
      fields: {
        stats: freshness.stats.map((entry) => ({
          field: `content.stats[${entry.index}].provenance.date`,
          status: entry.status,
          metricClass: entry.metricClass,
          diagnostics: entry.diagnostics,
        })),
        tableRows: freshness.tableRows.map((entry) => ({
          field: `content.tableRows[${entry.index}].provenance.date`,
          status: entry.status,
          metricClass: entry.metricClass,
          diagnostics: entry.diagnostics,
        })),
      },
    },
  };
  return {
    frameId,
    theme,
    content: normalization.content,
    overrides,
    aspectRatio,
    bgGradient,
    patternOverlay,
    workflowPhase,
    sectionLocks,
    phaseChecklist: phaseChecklist || { draftAt: Date.now(), reviewAt: null, publishReadyAt: null, lastTransitionAt: Date.now() },
    signoffRecord,
    savedAt: Date.now(),
    saveMetadata,
    telemetry: {
      taxonomyAutoCorrected: normalization.compliance.autoCorrected.length > 0,
      taxonomyInvalidCount: normalization.compliance.invalid.length,
    },
  };
}

export function parseImportedState(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid JSON');
  }
  const normalization = normalizeContentTaxonomy(raw.content || {});
  const immutableLedgerRef = raw.immutableLedgerRef || raw?.manifest?.immutableLedgerRef || raw?.signoff?.immutableLedgerRef || null;
  const nextContent = {
    ...normalization.content,
    evidenceLedger: normalizeEvidenceLedger(immutableLedgerRef?.evidenceLedger || normalization.content?.evidenceLedger, normalization.content?.issueNum || raw?.issueNum),
  };
  return {
    ...raw,
    immutableLedgerRef,
    content: nextContent,
    sectionLocks: raw.sectionLocks || null,
    auditTrail: Array.isArray(raw.auditTrail) ? raw.auditTrail : [],
    telemetry: {
      ...(raw.telemetry || {}),
      taxonomyAutoCorrected: normalization.compliance.autoCorrected.length > 0,
      taxonomyInvalidCount: normalization.compliance.invalid.length,
    },
    saveMetadata: raw.saveMetadata || null,
  };
}
