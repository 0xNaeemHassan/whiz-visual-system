import { resolveFrameContract } from './frameContracts';

const VALID_TIERS = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
export const FOOTER_FIELD_ORDER = Object.freeze(['source', 'timestamp', 'issueId', 'status']);
export const REQUIRED_FOOTER_FIELDS = new Set(FOOTER_FIELD_ORDER);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function assert(condition, message, errors) {
  if (!condition) errors.push(message);
}

function normalizeFooter(content = {}) {
  return {
    source: content.handle,
    timestamp: content.date,
    issueId: content.issueNum,
    status: content.status,
  };
}

export function resolveFooterData(content = {}) {
  const normalized = normalizeFooter(content);
  return FOOTER_FIELD_ORDER.reduce((acc, key) => {
    acc[key] = normalized[key];
    return acc;
  }, {});
}

function validateFrame(frame, index, ids, errors) {
  const prefix = `FRAMES[${index}]`;
  assert(Number.isInteger(frame.id) && frame.id > 0, `${prefix}: id must be a positive integer`, errors);
  if (Number.isInteger(frame.id)) {
    assert(!ids.has(frame.id), `${prefix}: duplicate id ${frame.id}`, errors);
    ids.add(frame.id);
  }

  assert(isNonEmptyString(frame.name), `${prefix}: name must be a non-empty string`, errors);
  assert(isNonEmptyString(frame.desc), `${prefix}: desc must be a non-empty string`, errors);
  assert(isNonEmptyString(frame.layout), `${prefix}: layout must be a non-empty string`, errors);
  assert(isNonEmptyString(frame.tier), `${prefix}: tier must be a non-empty string`, errors);

  if (isNonEmptyString(frame.tier)) {
    assert(VALID_TIERS.has(frame.tier), `${prefix}: tier must be one of ${Array.from(VALID_TIERS).join(', ')}`, errors);
  }

  assert(isNonEmptyString(frame.difficulty), `${prefix}: difficulty must be a non-empty string`, errors);
  if (isNonEmptyString(frame.difficulty)) {
    assert(VALID_DIFFICULTIES.has(frame.difficulty), `${prefix}: difficulty must be one of ${Array.from(VALID_DIFFICULTIES).join(', ')}`, errors);
  }

  assert(Number.isFinite(frame.effortMinutes), `${prefix}: effortMinutes must be a number`, errors);
  if (Number.isFinite(frame.effortMinutes)) {
    assert(frame.effortMinutes > 0, `${prefix}: effortMinutes must be greater than 0`, errors);
  }

  assert(Array.isArray(frame.tags), `${prefix}: tags must be an array`, errors);
  if (Array.isArray(frame.tags)) {
    assert(frame.tags.length > 0, `${prefix}: tags must not be empty`, errors);
    frame.tags.forEach((tag, tagIndex) => {
      assert(isNonEmptyString(tag), `${prefix}: tags[${tagIndex}] must be a non-empty string`, errors);
    });
  }

  const isStructural = frame.structureClass === 'structural';
  const isVariant = frame.structureClass === 'variant';
  assert(isStructural || isVariant, `${prefix}: structureClass must be "structural" or "variant"`, errors);
  assert(Number.isInteger(frame.archetypeId) && frame.archetypeId > 0, `${prefix}: archetypeId must be a positive integer`, errors);
  if (isStructural) {
    assert(frame.variantOf === null || frame.variantOf === undefined, `${prefix}: structural frame cannot define variantOf`, errors);
  }
  if (isVariant) {
    assert(Number.isInteger(frame.variantOf) && frame.variantOf > 0, `${prefix}: variant frame must define a valid variantOf id`, errors);
  }
}

function validateFrameRelationships(frame, frameById, errors) {
  if (frame.structureClass !== 'variant') return;
  const target = frameById.get(frame.variantOf);
  const prefix = `FRAMES[${frame.id}]`;
  assert(Boolean(target), `${prefix}: variantOf ${frame.variantOf} must reference an existing frame`, errors);
  if (!target) return;
  const allowVariantParent = frame.allowVariantOfVariant === true;
  if (!allowVariantParent) {
    assert(target.structureClass !== 'variant', `${prefix}: variants cannot target another variant unless allowVariantOfVariant=true`, errors);
  }
}

function validateTemplateEntry(frameId, template, frameById, errors) {
  const frame = frameById.get(frameId);
  const frameLabel = frame ? `Frame ${frame.id} (${frame.layout})` : `Frame ${frameId} (unknown layout)`;
  const prefix = `FRAME_TEMPLATES[${frameId}] ${frameLabel}`;

  ['topicTag', 'title', 'deck'].forEach((key) => {
    assert(isNonEmptyString(template[key]), `${prefix}: required text field "${key}" must be a non-empty string`, errors);
  });

  if (template.body !== undefined) {
    assert(isNonEmptyString(template.body), `${prefix}: body must be a non-empty string when provided`, errors);
  }

  if (template.stats !== undefined) {
    assert(Array.isArray(template.stats), `${prefix}: stats must be an array when provided`, errors);
    if (Array.isArray(template.stats)) {
      template.stats.forEach((stat, statIndex) => {
        const statPrefix = `${prefix}: stats[${statIndex}]`;
        assert(stat && typeof stat === 'object', `${statPrefix} must be an object`, errors);
        if (stat && typeof stat === 'object') {
          assert(isNonEmptyString(stat.label), `${statPrefix}.label must be a non-empty string`, errors);
          assert(isNonEmptyString(stat.value), `${statPrefix}.value must be a non-empty string`, errors);
        }
      });
    }
  }

  if (template.tableRows !== undefined) {
    assert(Array.isArray(template.tableRows), `${prefix}: tableRows must be an array when provided`, errors);
    if (Array.isArray(template.tableRows)) {
      assert(template.tableRows.length > 0, `${prefix}: tableRows must not be empty`, errors);
      template.tableRows.forEach((row, rowIndex) => {
        const rowPrefix = `${prefix}: tableRows[${rowIndex}]`;
        assert(row && typeof row === 'object' && !Array.isArray(row), `${rowPrefix} must be an object`, errors);
        if (row && typeof row === 'object' && !Array.isArray(row)) {
          const colKeys = Object.keys(row).filter((key) => /^col\d+$/.test(key));
          assert(colKeys.length > 0, `${rowPrefix} must include at least one colN field`, errors);
          colKeys.forEach((colKey) => {
            assert(isNonEmptyString(row[colKey]), `${rowPrefix}.${colKey} must be a non-empty string`, errors);
          });
        }
      });
    }
  }

  if (frame?.tier === 'B') {
    assert(isNonEmptyString(template.thesis), `${prefix}: Tier B requires non-empty thesis`, errors);
    ['mechanismSteps', 'riskNotes', 'evidencePoints'].forEach((field) => {
      assert(Array.isArray(template[field]), `${prefix}: Tier B requires ${field} array`, errors);
      if (Array.isArray(template[field])) {
        assert(template[field].length > 0, `${prefix}: Tier B ${field} must not be empty`, errors);
        template[field].forEach((entry, idx) => {
          assert(isNonEmptyString(entry), `${prefix}: Tier B ${field}[${idx}] must be non-empty`, errors);
        });
      }
    });
  }
}


function validateTemplateAgainstContract(frameId, frame, template, errors) {
  const contract = resolveFrameContract(frame);
  const layoutLabel = frame?.layout || 'unknown-layout';
  const prefix = `FRAME_TEMPLATES[${frameId}] (layout: ${layoutLabel})`;

  contract.requiredMetadataFields.forEach((field) => {
    if (!isNonEmptyString(template[field])) {
      errors.push(`${prefix}: missing required metadata field "${field}" (expected non-empty string)`);
    }
  });

  contract.requiredContent.forEach((rule) => {
    const value = rule.path === 'tableRows[].col1' || rule.path === 'stats[].label' || rule.path === 'stats[].value' ? null : template[rule.path];

    if (rule.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${prefix}: missing required content "${rule.path}" (expected array)`);
        return;
      }
      if (typeof rule.minItems === 'number' && value.length < rule.minItems) {
        errors.push(`${prefix}: content rule "${rule.path}" requires at least ${rule.minItems} item(s), found ${value.length}`);
      }
      return;
    }

    if (rule.path === 'tableRows[].col1' && Array.isArray(template.tableRows)) {
      template.tableRows.forEach((row, idx) => {
        if (!isNonEmptyString(row?.col1)) errors.push(`${prefix}: content rule "tableRows[].col1" failed at row ${idx} (missing/non-empty col1)`);
      });
      return;
    }

    if (rule.path === 'stats[].label' && Array.isArray(template.stats)) {
      template.stats.forEach((stat, idx) => {
        if (!isNonEmptyString(stat?.label)) errors.push(`${prefix}: content rule "stats[].label" failed at index ${idx}`);
      });
      return;
    }

    if (rule.path === 'stats[].value' && Array.isArray(template.stats)) {
      template.stats.forEach((stat, idx) => {
        if (!isNonEmptyString(stat?.value)) errors.push(`${prefix}: content rule "stats[].value" failed at index ${idx}`);
      });
    }
  });

  Object.entries(contract.limits || {}).forEach(([field, limit]) => {
    const value = template[field];
    if (value === undefined || value === null || value === '') return;
    if (limit.type === 'string') {
      if (typeof value !== 'string') {
        errors.push(`${prefix}: field "${field}" must be a string`);
        return;
      }
      if (limit.nonEmpty && !isNonEmptyString(value)) {
        errors.push(`${prefix}: field "${field}" must be non-empty`);
      }
      if (typeof limit.maxLength === 'number' && value.length > limit.maxLength) {
        errors.push(`${prefix}: field "${field}" exceeds ${limit.maxLength} characters (found ${value.length})`);
      }
    }
  });
}

function validateFooter(content, label, errors) {
  const footer = resolveFooterData(content);
  FOOTER_FIELD_ORDER.forEach((field, index) => {
    assert(field === FOOTER_FIELD_ORDER[index], `${label}: footer field order drift detected`, errors);
    assert(isNonEmptyString(footer[field]), `${label}: footer.${field} is required`, errors);
  });
}

export function validateFrameData({ frames, templates, guidanceById }) {
  const errors = [];
  const ids = new Set();
  const frameById = new Map();

  assert(Array.isArray(frames), 'FRAMES must be an array', errors);
  if (Array.isArray(frames)) {
    frames.forEach((frame, index) => {
      validateFrame(frame, index, ids, errors);
      if (Number.isInteger(frame.id) && !frameById.has(frame.id)) frameById.set(frame.id, frame);
    });
    frames.forEach((frame) => validateFrameRelationships(frame, frameById, errors));
  }

  assert(guidanceById && typeof guidanceById === 'object' && !Array.isArray(guidanceById), 'FRAME_GUIDANCE_BY_ID must be an object', errors);
  assert(templates && typeof templates === 'object' && !Array.isArray(templates), 'FRAME_TEMPLATES must be an object', errors);

  if (guidanceById && typeof guidanceById === 'object' && !Array.isArray(guidanceById)) {
    frameById.forEach((frame, frameId) => {
      const prefix = `FRAME_GUIDANCE_BY_ID[${frameId}]`;
      const guidance = guidanceById[frameId];
      assert(guidance && typeof guidance === 'object' && !Array.isArray(guidance), `${prefix}: entry must exist and be an object`, errors);
      if (guidance && typeof guidance === 'object' && !Array.isArray(guidance)) {
        ['bestUseCases', 'antiPatterns', 'whenNotToUse'].forEach((key) => {
          assert(Array.isArray(guidance[key]), `${prefix}.${key} must be an array`, errors);
          if (Array.isArray(guidance[key])) {
            assert(guidance[key].length > 0, `${prefix}.${key} must not be empty`, errors);
            guidance[key].forEach((item, index) => {
              assert(isNonEmptyString(item), `${prefix}.${key}[${index}] must be a non-empty string`, errors);
            });
          }
        });
      }
    });
  }

  if (templates && typeof templates === 'object' && !Array.isArray(templates)) {
    Object.entries(templates).forEach(([rawId, template]) => {
      const frameId = Number(rawId);
      const prefix = `FRAME_TEMPLATES[${rawId}]`;
      assert(Number.isInteger(frameId), `${prefix}: key must be numeric frame id`, errors);
      assert(template && typeof template === 'object' && !Array.isArray(template), `${prefix}: entry must be an object`, errors);
      if (Number.isInteger(frameId)) {
        assert(frameById.has(frameId), `${prefix}: no matching frame id found in FRAMES`, errors);
      }
      if (template && typeof template === 'object' && !Array.isArray(template)) {
        validateTemplateEntry(frameId, template, frameById, errors);
        validateTemplateAgainstContract(frameId, frameById.get(frameId), template, errors);
        validateFooter(template, `${prefix}`, errors);
      }
    });
    validateTemplateInheritance(templates, errors);
  }

  if (errors.length > 0) {
    throw new Error(`Frame schema validation failed with ${errors.length} issue(s):\n${errors.map((e) => `- ${e}`).join('\n')}`);
  }
}
