const { Configuration } = require('@hpi-schul-cloud/commons/lib');
const { BadRequest } = require('../../../errors');
const oauth2 = require('../../oauth2/hooks');

const webUri = Configuration.get('HOST');

/**
 * Validates that the token does not contain any injected content like query parameters,
 * URL fragments, or other potentially malicious characters.
 * Works for both JWT and opaque tokens.
 * @param {string} token - The token to validate
 * @throws {BadRequest} If the token contains suspicious characters
 */
const validateTokenFormat = (token) => {
	if (!token || typeof token !== 'string') {
		throw new BadRequest('Invalid token type');
	}

	// Block characters commonly used for injection attacks:
	// ? - query parameters
	// & - query parameter separator
	// # - URL fragments
	// < > - HTML/XML injection
	// spaces, newlines, carriage returns - header injection
	if (/[?&#<>\s\r\n]/.test(token)) {
		throw new BadRequest('Invalid token format');
	}

	// ensure reasonable length to prevent DoS
	if (token.length > 4096) {
		throw new BadRequest('Token too long');
	}
};

module.exports = {
	/**
	 * Authentication with oauth2 authorization token via Bearer/header from external tool (bettermarks)
	 * against hydra via internal oauth2 proxy service
	 * sets context.params.tokenInfo with oauth user information
	 * @param {*} context
	 */
	tokenIsActive: (context) => {
		const token = context.params.headers.authorization.replace('Bearer ', '');

		validateTokenFormat(token);

		return context.app
			.service('/oauth2/introspect')
			.create({ token })
			.then((introspection) => {
				if (introspection.active) {
					context.params.tokenInfo = introspection;
					return context;
				}
				throw new BadRequest('Access token invalid');
			});
	},

	/**
	 * expects obfuscated_subject to match external pseudonym from route.user or
	 * sub to match internal user id
	 * @param {*} context
	 */
	userIsMatching: (context) => {
		if (
			context.params.tokenInfo.obfuscated_subject === decodeURIComponent(context.params.route.user) ||
			context.params.tokenInfo.sub === context.params.user
		) {
			return context;
		}
		throw new BadRequest('No permissions for the user');
	},

	/**
	 * extracts plain pseudonym when receiving full iframe code in pseudonym
	 * @param {*} context
	 */
	stripIframe: (context) => {
		const regEx = /oauth2\/username\/(.*?)"/;
		const pseudonym = context.params.route.user;
		context.params.pseudonym = pseudonym.includes('iframe') ? pseudonym.match(regEx)[1] : pseudonym;

		return context;
	},

	groupContainsUser: (context) => {
		if (!context.result.data) return context;

		const users = context.result.data.students.concat(context.result.data.teachers);
		if (
			users.some(
				(user) =>
					user.user_id === oauth2.getSubject(context.params.tokenInfo.obfuscated_subject, webUri) ||
					user.user_id === context.params.tokenInfo.obfuscated_subject
			)
		)
			return context;

		throw new BadRequest('Current user is not part of group');
	},
};
