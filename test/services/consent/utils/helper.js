const TERMS = 'termsOfUseConsent';
const PRIVACY = 'privacyConsent';
const TERMS_DATE = 'dateOfTermsOfUseConsent';
const PRIVACY_DATE = 'dateOfPrivacyConsent';


const createDateFromAge = (age) => {
	const currentDate = new Date();
	const birthday = new Date();

	const randomMonth = Number.parseInt(Math.random() * 11, 10);
	let offset = 0;
	if (currentDate.getMonth() < randomMonth) {
		offset = 1;
	}

	birthday.setFullYear(currentDate.getFullYear() - age + offset);
	birthday.setMonth(randomMonth);
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
