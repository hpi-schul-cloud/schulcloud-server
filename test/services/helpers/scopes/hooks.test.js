/* eslint-disable global-require */
/**
 * This file is only used to group the hook tests together
 */
describe('ScopeService hooks', () => {
	require('./hooks/lookupScope');
	require('./hooks/rejectQueryingForOtherUsers');
	require('./hooks/checkScopePermissions');
});
