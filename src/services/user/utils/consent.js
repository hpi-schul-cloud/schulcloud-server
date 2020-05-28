const checkParentConsent = (parentConsents) => {
	const agrements = parentConsents.filter((consent) => consent.privacyConsent && consent.termsOfUseConsent);
	if (parentConsents.length !== 0 && agrements.length === parentConsents.length) {
		return true;
	}

	return false;
};

const checkUserConsent = (userConsent) => {
	if (userConsent
		&& userConsent.privacyConsent === true
		&& userConsent.termsOfUseConsent === true
	) {
		return true;
	}

	return false;
};

const defineConsentStatus = (birthday, consent) => {
	if (!consent) {
		return 'missing';
	}

	if (!birthday) {
		return 'unknown';
	}

	const currentDate = new Date();
	const secoundConsentSwitchDate = new Date();
	secoundConsentSwitchDate.setFullYear(currentDate.getFullYear() - 16); // TODO: get age from default.conf
	const firstConsentSwitchDate = new Date();
	firstConsentSwitchDate.setFullYear(currentDate.getFullYear() - 14);


	const { parentConsents, userConsent } = consent;
	let amount = 0;

	if (birthday.getTime() > firstConsentSwitchDate.getTime()) {
		// only parents have to agre
		if (checkParentConsent(parentConsents) === true) {
			amount = 2;
		}
	} else if (birthday.getTime() < secoundConsentSwitchDate.getTime()) {
		// only user have to agre
		if (checkUserConsent(userConsent) === true) {
			amount = 2;
		}
	} else {
		// parents and user have to agre
		amount = checkParentConsent(parentConsents) + checkUserConsent(userConsent);
	}

	switch (amount) {
		case 2:
			return 'ok';

		case 1:
			return 'parentsAgreed';
		default:
			return 'missing';
	}
};


const isParentConsentRequired = (birthday) => {
	const currentDate = new Date();
	const secoundConsentSwitchDate = new Date();
	secoundConsentSwitchDate.setFullYear(currentDate.getFullYear() - 16); // TODO: get age from default.conf

	if (birthday.getTime() < secoundConsentSwitchDate.getTime()) {
		return false;
	}

	return true;
};


module.exports = {
	defineConsentStatus,
	isParentConsentRequired,
};
