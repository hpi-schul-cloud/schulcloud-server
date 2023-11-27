const AdminUsers = require('./AdminUsers');
const UserLinkImportService = require('./UserLinkImportService');
const SkipRegistrationService = require('./SkipRegistration');
const RegistrationSchoolService = require('./registrationSchool');
const UsersModelService = require('./UsersModelService');
const UserService = require('./userService');
const MailRegistrationLink = require('./MailRegistrationLink');
const QrRegistrationLinks = require('./QrRegistrationLinks');
const QrRegistrationLinksLegacyClient = require('./QrRegistrationLinksLegacyClient');
const { RegistrationConsentService, registrationConsentServiceHooks } = require('./registrationConsent');
const ForcePasswordChange = require('./ForcePasswordChange');

module.exports = {
	AdminUsers,
	UserLinkImportService,
	SkipRegistrationService,
	RegistrationSchoolService,
	UsersModelService,
	UserService,
	MailRegistrationLink,
	RegistrationConsentService,
	registrationConsentServiceHooks,
	QrRegistrationLinks,
	QrRegistrationLinksLegacyClient,
	ForcePasswordChange,
};
