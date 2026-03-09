const { Configuration } = require('@hpi-schul-cloud/commons/lib');
const jwt = require('jsonwebtoken');
const { BadRequest } = require('../../../errors');
const oauth2 = require('../../oauth2/hooks');

const webUri = Configuration.get('HOST');

/**
 * Validates that the token is a valid JWT format with no additional injected content
 * @param {string} token - The token to validate
 * @throws {BadRequest} If the token is not a valid JWT or contains additional content
 */
const validateJwtFormat = (token) => {
	// Ensure token only contains valid JWT characters (Base64URL: alphanumeric, hyphen, underscore, and exactly 2 dots)
	if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(token)) {
		throw new BadRequest('Invalid token format');
	}

	// Verify it can be decoded as a valid JWT
	if (!jwt.decode(token)) {
		throw new BadRequest('Invalid token format');
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

		// Validate that the token is a valid JWT format
		validateJwtFormat(token);

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
