import { assertCrossSuiteFixtureConsistency, assertFixtureCompletenessForSuite } from './frame-family-fixtures.mjs';

assertFixtureCompletenessForSuite('contract');
assertFixtureCompletenessForSuite('visual');
assertFixtureCompletenessForSuite('exportSnapshot');
assertCrossSuiteFixtureConsistency();

console.log('Frame family fixture completeness + cross-suite consistency passed');
