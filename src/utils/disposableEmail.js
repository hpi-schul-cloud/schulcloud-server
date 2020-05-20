const { Configuration } = require('@schul-cloud/commons');
const domains = require('disposable-email-domains');
const wildcards = require('disposable-email-domains/wildcard.json');

const constants = require('./constants');

function hasValidEmailFormat(email) {
	return constants.expressions.email.test(email);
}

function isDisposableEmail(email) {
	if (!hasValidEmailFormat(email)) {
		return false;
	}

	// extract domain from email
	const parts = email.toString().split('@');
	const domain = parts[1].toLowerCase();

	// check for exact domain blacklist matches
	if (domains.includes(domain)) {
		return true;
	}

	// check wildcards to include subdomains
	const domainLength = domain.length;
	for (const wildcard of wildcards) {
		const index = domain.indexOf(wildcard);
		if (index !== -1 && index === domainLength - wildcard.length) {
			return true;
		}
	}

	// check custom wildcards
	if (Configuration.has('ADDITIONAL_BLACKLISTED_EMAIL_TOP_LEVEL_DOMAINS')) {
		const customWildcards = Configuration.get('ADDITIONAL_BLACKLISTED_EMAIL_TOP_LEVEL_DOMAINS');
		for (const wildcard of customWildcards.split(',')) {
			const index = domain.indexOf(wildcard);
			if (index !== -1 && wildcard.length > 0 && index === domainLength - wildcard.length) {
				return true;
			}
		}
	}

	return false;
}

module.exports = {
	hasValidEmailFormat,
	isDisposableEmail,
};
