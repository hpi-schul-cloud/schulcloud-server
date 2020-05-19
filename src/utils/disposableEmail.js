const domains = require('disposable-email-domains');
const wildcards = require('disposable-email-domains/wildcard.json');

const customWildcards = [
	'grugrug.ru',
	'yeezus.ru',
];

module.exports = {
	isDisposableEmail: (email) => {
		if (!email) {
			return false;
		}

		// extract domain from email
		const [, domain] = email.toString().split('@');
		if (!domain) {
			return false;
		}

		// check for exact domain blacklist matches
		if (domains.includes(domain)) {
			return true;
		}

		// check wildcards to include subdomains
		for (const wildcard of wildcards) {
			if (domain.endsWith(wildcard)) {
				return true;
			}
		}

		// check custom wildcards
		for (const wildcard of customWildcards) {
			if (domain.endsWith(wildcard)) {
				return true;
			}
		}

		return false;
	},
};
