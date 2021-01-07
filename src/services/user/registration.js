const { Configuration } = require('@hpi-schul-cloud/commons');
const reqlib = require('app-root-path').require;

const { BadRequest } = reqlib('src/errors');
const { userModel: User } = require('./model');

const accountModel = require('../account/model');
const consentModel = require('../consent/model');
const { getAge } = require('../../utils');
const logger = require('../../logger');

const { CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS } = require('../../../config/globals');

const permissionsAllowedToLogin = ['student', 'expert', 'administrator', 'teacher'];

const appendParent = (user, data) => {
	const parent = {
		firstName: data.parent_firstName,
		lastName: data.parent_lastName,
		email: data.parent_email,
	};
	user.parents.push(parent);
};

const populateUser = (app, data) => {
	let oldUser;
	const user = {
		firstName: data.firstName,
		lastName: data.lastName,
		email: data.email,
		roles: ['student'],
		schoolId: data.schoolId,
		language: data.language,
		parents: [],
	};

	if (data.birthDate) {
		user.birthday = new Date(data.birthDate);
	}

	if (data.parent_email) {
		appendParent(user, data);
	}

	if (data.classId) user.classId = data.classId;

	if (!data.importHash) {
		return Promise.reject(new BadRequest('Ungültiger Link'));
	}

	if (data.userId) {
		data.userId = data.userId.toString();
	}

	return app
		.service('users')
		.find({
			query: {
				importHash: data.importHash.toString(),
				_id: data.userId,
				$populate: ['roles'],
			},
		})
		.then((users) => {
			if (users.data.length <= 0 || users.data.length > 1) {
				throw new BadRequest('Kein Nutzer für die eingegebenen Daten gefunden.');
			}
			oldUser = users.data[0];

			Object.keys(oldUser).forEach((key) => {
				if (oldUser[key] !== null && key !== 'firstName' && key !== 'lastName' && key !== 'parents') {
					user[key] = oldUser[key];
				}
			});

			user.roles = user.roles.map((role) => (typeof role === 'object' ? role.name : role));

			delete user.importHash;
			return { user, oldUser };
		});
};

const insertUserToDB = async (app, data, user) => {
	if (user._id) {
		user.roles = [
			...new Set(
				await app
					.service('roles')
					.find({ query: { name: { $in: user.roles } } })
					.then((roles) => {
						const r = roles.data.map((role) => role._id);
						return r;
					})
			),
		];
		return app
			.service('users')
			.update(user._id, user)
			.catch((err) => {
				logger.warning(err);
				throw new BadRequest('Fehler beim Updaten der Nutzerdaten.');
			});
	}
	return app
		.service('users')
		.create(user, { _additional: { parentEmail: data.parent_email, asTask: 'student' } })
		.catch((err) => {
			logger.error(err);
			// fixme check error message is correct, check err
			let msg =
				'Fehler beim Erstellen des Nutzers. ' +
				'Eventuell ist die E-Mail-Adresse bereits im System registriert. ' +
				'Wende dich an den Support. Damit wir dir schnell helfen können, ' +
				'teile uns bitte alle angegebenen E-Mail-Adressen mit.';
			if (err && err.message) {
				if (err.message.includes('bereits')) {
					// account or user exists
					msg =
						`${err.message} ` +
						'Wahrscheinlich kannst du dich damit bereits einloggen. ' +
						'Nutze dazu den Login. Dort kannst du dir auch ein neues Passwort zusenden lassen.';
				}
			}
			throw new BadRequest(msg);
		});
};

const registerUser = function register(data, params, app) {
	let user = null;
	let oldUser = null;
	let account = null;
	let consent = null;
	let consentPromise = null;

	return Promise.resolve()
		.then(() => {
			let classPromise = null;
			let schoolPromise = null;
			// resolve class or school Id
			classPromise = app.service('classes').find({ query: { _id: data.classOrSchoolId } });
			schoolPromise = app.service('schools').find({ query: { _id: data.classOrSchoolId } });
			return Promise.all([classPromise, schoolPromise]).then(([classes, schools]) => {
				if (classes.total === 1) {
					data.classId = data.classOrSchoolId;
					data.schoolId = classes.data[0].schoolId;
					return Promise.resolve();
				}
				if (schools.total === 1) {
					data.schoolId = data.classOrSchoolId;
					return Promise.resolve();
				}
				return Promise.reject(new BadRequest('Ungültiger Link'));
			});
		})
		.then(() =>
			populateUser(app, data).then((response) => {
				({ user, oldUser } = response);
			})
		)
		.then(() => {
			const consentSkipCondition = Configuration.get('SKIP_CONDITIONS_CONSENT');
			if (!(user.roles || []).some((role) => permissionsAllowedToLogin.includes(role))) {
				return Promise.reject(new BadRequest('You are not allowed to register!'));
			}
			if ((user.roles || []).includes('student')) {
				// wrong birthday object?
				if (user.birthday instanceof Date && Number.isNaN(user.birthday)) {
					return Promise.reject(
						new BadRequest(
							'Fehler bei der Erkennung des ausgewählten Geburtstages. Bitte lade die Seite neu und starte erneut.'
						)
					);
				}
				// wrong age?
				const age = getAge(user.birthday);
				if (data.parent_email && age >= CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS) {
					return Promise.reject(
						new BadRequest(
							`Schüleralter: ${age} Im Elternregistrierungs-Prozess darf der Schüler` +
								`nicht ${CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS} Jahre oder älter sein.`
						)
					);
				}
				if (
					!data.parent_email &&
					age < CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS &&
					!consentSkipCondition.includes('student')
				) {
					return Promise.reject(
						new BadRequest(
							`Schüleralter: ${age} Im Schülerregistrierungs-Prozess darf der Schüler` +
								` nicht jünger als ${CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS} Jahre sein.`
						)
					);
				}
			}

			// identical emails?
			if (data.parent_email && data.parent_email.toLowerCase() === data.email.toLowerCase()) {
				return Promise.reject(new BadRequest('Bitte gib eine unterschiedliche E-Mail-Adresse für dein Kind an.'));
			}

			if (data.password_1 && data.passwort_1 !== data.passwort_2) {
				return new BadRequest('Die Passwörter stimmen nicht überein');
			}
			return Promise.resolve();
		})
		.then(() => {
			const email = data.parent_email || data.student_email || data.email;
			const { pin } = data;
			return app
				.service('registrationPins')
				.find({
					query: { pin, email },
				})
				.then((result) => {
					// check pin
					if (result.data.length !== 1 || result.data[0].verified !== true) {
						return Promise.reject(
							new Error('Der eingegebene Code konnte leider nicht verfiziert werden. Versuch es doch noch einmal.')
						);
					}
					return Promise.resolve();
				})
				.catch((err) => {
					const msg = err.message || 'Fehler wärend der Pin Überprüfung.';
					logger.error(msg, err);
					return Promise.reject(new Error(msg));
				});
		})
		.then(() =>
			// create user
			insertUserToDB(app, data, user).then((newUser) => {
				user = newUser;
			})
		)
		.then(() => {
			account = {
				username: user.email,
				password: data.password_1,
				userId: user._id,
				activated: true,
			};
			return app
				.service('accounts')
				.create(account)
				.then((newAccount) => {
					account = newAccount;
				})
				.catch((err) => {
					const msg = 'Fehler beim Erstellen des Accounts.';
					logger.warning(msg, err);
					return Promise.reject(new Error(msg));
				});
		})
		.then(() => {
			// store consent
			if (data.parent_email) {
				consent = {
					form: 'digital',
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
				})
				.catch((err) => {
					const msg = 'Fehler beim Speichern der Einverständniserklärung.';
					logger.warning(msg, err);
					return Promise.reject(new Error(msg));
				});
		})
		.then(() =>
			Promise.resolve({
				user,
				account,
				consent,
			})
		)
		.catch((err) => {
			const rollbackPromises = [];
			if (user && user._id) {
				if (oldUser) {
					rollbackPromises.push(User.replaceOne({ _id: user._id }, oldUser).exec());
				} else {
					rollbackPromises.push(User.findOneAndRemove({ _id: user._id }).exec());
				}
			}
			if (account && account._id) {
				rollbackPromises.push(accountModel.findOneAndRemove({ _id: account._id }).exec());
			}
			if (consent && consent._id) {
				rollbackPromises.push(consentModel.consentModel.findOneAndRemove({ _id: consent._id }).exec());
			}
			return Promise.all(rollbackPromises)
				.catch((err) => {
					logger.error('error while roling back registration', err);
					const msg =
						(err.error || {}).message ||
						err.message ||
						err ||
						'Kritischer Fehler bei der Registrierung. Bitte wenden sie sich an den Administrator.';
					return Promise.reject(new BadRequest(msg));
				})
				.then(() => {
					const msg = (err.error || {}).message || err.message || err || 'Fehler bei der Registrierung.';
					return Promise.reject(new BadRequest(msg));
				});
		});
};

module.exports = (app) => {
	class RegistrationService {
		create(data, params) {
			return registerUser(data, params, app);
		}
	}

	return RegistrationService;
};
