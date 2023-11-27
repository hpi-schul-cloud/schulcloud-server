/**
 * Remove sources like ldap und source and replace it with isExternal tag
 * @param  {...Object} users
 */
const isExternal = (...users) =>
	users.map(({ ldapId, ldapDn, source, ...user }) => ({
		...user,
		isExternal: !!(ldapDn || ldapId || source),
	}));

module.exports = {
	isExternal,
};
