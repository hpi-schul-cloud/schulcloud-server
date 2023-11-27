const TERMS = 'termsOfUseConsent';
const PRIVACY = 'privacyConsent';
const TERMS_DATE = 'dateOfTermsOfUseConsent';
const PRIVACY_DATE = 'dateOfPrivacyConsent';

const createDateFromAge = (age) => {
	const currentDate = new Date();
	const birthday = new Date();

	birthday.setFullYear(currentDate.getFullYear() - age);
	return birthday;
};

const createUserConsent = (privacy, terms, pDate = new Date(), tDate = new Date()) => ({
	[PRIVACY]: privacy,
	[TERMS]: terms,
	[PRIVACY_DATE]: pDate,
	[TERMS_DATE]: tDate,
});

const createParentConsent = (privacy, terms, pDate = new Date(), tDate = new Date()) => ({
	[PRIVACY]: privacy,
	[TERMS]: terms,
	[PRIVACY_DATE]: pDate,
	[TERMS_DATE]: tDate,
});

module.exports = {
	createDateFromAge,
	createUserConsent,
	createParentConsent,
};
