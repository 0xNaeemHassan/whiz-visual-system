import assert from 'node:assert/strict';
import { normalizeDateInput } from '../src/domain/services/dateNormalizationService.js';
import { normalizeNumericFields } from '../src/utils/numericNormalization.js';

const us = normalizeDateInput('2026-03-15', { locale: 'en-US' });
const es = normalizeDateInput('2026-03-15', { locale: 'es-ES' });
assert.equal(us.valid, true);
assert.equal(es.valid, true);
assert.notEqual(us.displayDate, es.displayDate);

const usNum = normalizeNumericFields({ bigNumber: '1234.5' }, { locale: 'en-US' });
const esNum = normalizeNumericFields({ bigNumber: '1234.5' }, { locale: 'es-ES' });
assert.equal(usNum.content.bigNumber, '1,234.5');
assert.equal(esNum.content.bigNumber, '1234,5');

console.log('locale formatting regression checks passed');
