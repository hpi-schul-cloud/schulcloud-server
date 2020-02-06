const errors = require('@feathersjs/errors');
const userModel = require('../user/model');
const accountModel = require('../account/model');
const consentModel = require('../consent/model');
const globalHooks = require('../../hooks');
const logger = require('../../logger');

const { CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS } = require('../consent/config');

const formatBirthdate1 = (datestamp) => {
	if (datestamp == undefined) return false;

	const d = datestamp.split('.');
	return `${d[1]}.${d[0]}.${d[2]}`;
};

const populateUser = (app, data) => {
	let oldUser;
	const user = {
		firstName: data.firstName,
		lastName: data.lastName,
		email: data.email,
		roles: ['student'],
		schoolId: data.schoolId,
	};

	const formatedBirthday = formatBirthdate1(data.birthDate);
	if (formatedBirthday) {
		user.birthday = new Date(formatedBirthday);
	}

	if (data.classId) user.classId = data.classId;

	if (data.importHash) {
		return app.service('users').find({ query: { importHash: data.importHash, _id: data.userId, $populate: ['roles'] } }).then((users) => {
			if (users.data.length <= 0 || users.data.length > 1) {
				throw new errors.BadRequest('Kein Nutzer für die eingegebenen Daten gefunden.');
			}
			oldUser = users.data[0];

			Object.keys(oldUser).forEach((key) => {
				if (oldUser[key] !== null && key !== 'firstName' && key !== 'lastName') {
					user[key] = oldUser[key];
				}
			});

			user.roles = user.roles.map((role) => (typeof role === 'object' ? role.name : role));

			delete user.importHash;
			return { user, oldUser };
		});
	}
	return Promise.resolve({ user, oldUser });
};

const insertUserToDB = async (app, data, user) => {
	if (user._id) {
		user.roles = [...new Set(await app.service('roles')
			.find({ query: { name: { $in: user.roles } } })
			.then((roles) => {
				const r = roles.data.map((role) => role._id);
				return r;
			}))];
		return app.service('users')
			.update(user._id, user)
			.catch((err) => {
				logger.warning(err);
				throw new errors.BadRequest('Fehler beim Updaten der Nutzerdaten.');
			});
	}
	return app.service('users').create(user, { _additional: { parentEmail: data.parent_email, asTask: 'student' } })
		.catch((err) => {
			logger.warning(err);
			// fixme check error message is correct, check err
			throw new errors.BadRequest('Fehler beim Erstellen des Nutzers. Eventuell ist die E-Mail-Adresse bereits im System registriert.');
		});
};

const registerUser = function register(data, params, app) {
	let parent = null; let user = null; let oldUser = null; let account = null; let consent = null; let
		consentPromise = null;

	return new Promise(((resolve, reject) => {
		resolve();
	})).then(() => {
		let classPromise = null; let
			schoolPromise = null;
		// resolve class or school Id
		classPromise = app.service('classes').find({ query: { _id: data.classOrSchoolId } });
		schoolPromise = app.service('schools').find({ query: { _id: data.classOrSchoolId } });
		return Promise.all([classPromise, schoolPromise])
			.then(([classes, schools]) => {
				if (classes.total === 1) {
					data.classId = data.classOrSchoolId;
					data.schoolId = classes.data[0].schoolId;
					return Promise.resolve();
				}
				if (schools.total === 1) {
					data.schoolId = data.classOrSchoolId;
					return Promise.resolve();
				}
				return Promise.reject('Ungültiger Link');
			});
	}).then(() => populateUser(app, data)
		.then((response) => {
			user = response.user;
			oldUser = response.oldUser;
		})).then(() => {
		if ((user.roles || []).includes('student')) {
			// wrong birthday object?
			if (user.birthday instanceof Date && isNaN(user.birthday)) {
				return Promise.reject(new errors.BadRequest(
					'Fehler bei der Erkennung des ausgewählten Geburtstages.'
					+ ' Bitte lade die Seite neu und starte erneut.',
				));
			}
			// wrong age?
			const age = globalHooks.getAge(user.birthday);
			if (data.parent_email && age >= CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS) {
				return Promise.reject(new errors.BadRequest(
					`Schüleralter: ${age} Im Elternregistrierungs-Prozess darf der Schüler`
					+ `nicht ${CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS} Jahre oder älter sein.`,
				));
			} if (!data.parent_email && age < CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS) {
				return Promise.reject(new errors.BadRequest(
					`Schüleralter: ${age} Im Schülerregistrierungs-Prozess darf der Schüler`
					+ ` nicht jünger als ${CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS} Jahre sein.`,
				));
			}
		}

		// identical emails?
		if (data.parent_email && data.parent_email === data.email) {
			return Promise.reject(new errors.BadRequest(
				'Bitte gib eine unterschiedliche E-Mail-Adresse für dein Kind an.',
			));
		}

		if (data.password_1 && data.passwort_1 !== data.passwort_2) {
			return new errors.BadRequest('Die Passwörter stimmen nicht überein');
		}
		return Promise.resolve();
	})
		.then(() => {
			const userMail = data.parent_email || data.student_email || data.email;
			const pinInput = data.pin;
			return app.service('registrationPins').find({
				query: { pin: pinInput, email: userMail, verified: false },
			}).then((check) => {
				// check pin
				if (!(check.data && check.data.length > 0 && check.data[0].pin === pinInput)) {
					return Promise.reject('Ungültige Pin, bitte überprüfe die Eingabe.');
				}
				return Promise.resolve();
			});
		})
		.then(() =>
			// create user
			insertUserToDB(app, data, user)
				.then((newUser) => {
					user = newUser;
				}))
		.then(() => {
			account = {
				username: user.email,
				password: data.password_1,
				userId: user._id,
				activated: true,
			};
			if (data.sso === 'true' && data.account) {
				const accountId = data.account;
				return app.service('accounts').update({ _id: accountId }, { $set: { activated: true, userId: user._id } })
					.then((accountResponse) => {
						account = accountResponse;
					})
					.catch((err) => Promise.reject(new Error('Fehler der Account existiert nicht.', err)));
			}
			return app.service('accounts').create(account)
				.then((newAccount) => { account = newAccount; })
				.catch((err) => Promise.reject(new Error('Fehler beim Erstellen des Accounts.', err)));
		})
		.then((res) => {
			// add parent if necessary
			if (data.parent_email) {
				parent = {
					firstName: data.parent_firstName,
					lastName: data.parent_lastName,
					email: data.parent_email,
					children: [user._id],
					schoolId: data.schoolId,
					roles: ['parent'],
				};
				return app.service('users').create(parent, { _additional: { asTask: 'parent' } })
					.catch((err) => {
						if (err.message.startsWith('parentCreatePatch')) {
							return Promise.resolve(err.data);
						}
						return Promise.reject(new Error(`Fehler beim Erstellen des Elternaccounts. ${err}`));
					}).then((newParent) => {
						parent = newParent;
						return userModel.userModel.findByIdAndUpdate(user._id, { parents: [parent._id] }, { new: true }).exec()
							.then((updatedUser) => user = updatedUser);
					})
					.catch((err) => {
						logger.log('warn', `Fehler beim Verknüpfen der Eltern. ${err}`);
						return Promise.reject(new Error('Fehler beim Verknüpfen der Eltern.', err));
					});
			}
			return Promise.resolve();
		})
		.then(() => {
			// store consent
			if (parent) {
				consent = {
					form: 'digital',
					parentId: parent._id,
					privacyConsent: data.parent_privacyConsent === 'true',
					termsOfUseConsent: data.parent_termsOfUseConsent === 'true',
				};
				consentPromise = app.service('consents').create({ userId: user._id, parentConsents: [consent] });
			} else {
				consent = {
					form: 'digital',
					privacyConsent: data.privacyConsent === 'true',
					termsOfUseConsent: data.termsOfUseConsent === 'true',
				};
				consentPromise = app.service('consents').create({ userId: user._id, userConsent: consent });
			}
			return consentPromise
				.then((newConsent) => {
					consent = newConsent;
					return Promise.resolve();
				}).catch((err) => Promise.reject(new Error('Fehler beim Speichern der Einverständniserklärung.', err)));
		})
		.then(() => Promise.resolve({
			user, parent, account, consent,
		}))
		.catch((err) => {
			const rollbackPromises = [];
			if (user && user._id) {
				rollbackPromises.push(userModel.userModel.findOneAndRemove({ _id: user._id }).exec()
					.then((_) => {
						if (oldUser) {
							return userModel.userModel.create(oldUser);
						}
					}));
			}
			if (parent && parent._id) {
				rollbackPromises.push(userModel.userModel.findOneAndRemove({ _id: parent._id }).exec());
			}
			if (account && account._id) {
				rollbackPromises.push(accountModel.findOneAndRemove({ _id: account._id }).exec());
			}
			if (consent && consent._id) {
				rollbackPromises.push(consentModel.consentModel.findOneAndRemove({ _id: consent._id }).exec());
			}
			return Promise.all(rollbackPromises)
				.catch((err) => Promise.reject(new errors.BadRequest((err.error || {}).message || err.message || err || 'Kritischer Fehler bei der Registrierung. Bitte wenden sie sich an den Administrator.')))
				.then(() => Promise.reject(new errors.BadRequest((err.error || {}).message || err.message || err || 'Fehler bei der Registrierung.')));
		});
};

module.exports = function (app) {
	class RegistrationService {
		constructor() {

		}

		create(data, params) {
			return registerUser(data, params, app);
		}
	}

	return RegistrationService;
};
