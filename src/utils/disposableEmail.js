const { Configuration } = require('@hpi-schul-cloud/commons');
const disposableDomains = require('disposable-email-domains');
const disposableDomainWildcards = require('disposable-email-domains/wildcard.json');

const constants = require('./constants');

function hasValidEmailFormat(email) {
	return constants.expressions.email.test(email);
}

function extractDomainFromEmail(email) {
	if (typeof email !== 'string') {
		return null;
	}

	const cleanEmail = email.trim().toLowerCase();
	if (!hasValidEmailFormat(cleanEmail)) {
		return null;
	}

	const parts = cleanEmail.split('@');
	return parts[1];
}

function isDisposableEmailDomain(domain) {
	// check for exact domain blacklist matches
	if (disposableDomains.includes(domain)) {
		return true;
	}

	// check wildcards to include subdomains
	const domainLength = domain.length;
	for (const wildcard of disposableDomainWildcards) {
		const index = domain.indexOf(wildcard);
		if (index !== -1 && index === domainLength - wildcard.length) {
			return true;
		}
	}

	// check custom wildcards
	if (Configuration.has('ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS')) {
		const customWildcards = Configuration.get('ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS');
		for (const wildcard of customWildcards.split(',')) {
			const index = domain.indexOf(wildcard);
			if (index !== -1 && wildcard.length > 0 && index === domainLength - wildcard.length) {
				return true;
			}
		}
	}

	return false;
}

function isDisposableEmail(email) {
	const domain = extractDomainFromEmail(email);
	if (domain === null) {
		return false;
	}

	return isDisposableEmailDomain(domain);
}

module.exports = {
	hasValidEmailFormat,
	extractDomainFromEmail,
	isDisposableEmailDomain,
	isDisposableEmail,
};
