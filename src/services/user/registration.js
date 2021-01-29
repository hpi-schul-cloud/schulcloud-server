const { Configuration } = require('@hpi-schul-cloud/commons');

const { BadRequest } = require('../../errors');
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
                    if (oldUser[key]!==null && key!=='firstName' && key!=='lastName' && key!=='parents') {
                        user[key] = oldUser[key];
                    }
                });

                user.roles = user.roles.map((role) => (typeof role==='object' ? role.name:role));

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

const registerUser = async (data, params, app) => {
    let account = null;
    let consent = null;

    // resolve class or school Id
    const classPromise = app.service('classes').find({ query: { _id: data.classOrSchoolId } });
    const schoolPromise = app.service('schools').find({ query: { _id: data.classOrSchoolId } });

    const [classes, schools] = await Promise.all([classPromise, schoolPromise]);

    if (classes.total!==1 && schools.total!==1) {
        throw new BadRequest('Ungültiger Link');
    }

    if (classes.total===1) {
        data.classId = data.classOrSchoolId;
        data.schoolId = classes.data[0].schoolId;
    }
    if (schools.total===1) {
        data.schoolId = data.classOrSchoolId;
    }

    let { user, oldUser } = await populateUser(app, data);

    const consentSkipCondition = Configuration.get('SKIP_CONDITIONS_CONSENT');
    if (!(user.roles || []).some((role) => permissionsAllowedToLogin.includes(role))) {
        throw new BadRequest('You are not allowed to register!');
    }
    if ((user.roles || []).includes('student')) {
        // wrong birthday object?
        if (user.birthday instanceof Date && Number.isNaN(user.birthday)) {
            throw new BadRequest('Fehler bei der Erkennung des ausgewählten Geburtstages. Bitte lade die Seite neu und starte erneut.');
        }
        // wrong age?
        const age = getAge(user.birthday);
        if (data.parent_email && age >= CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS) {
            throw new BadRequest(`Schüleralter: ${age} Im Elternregistrierungs-Prozess darf der Schüler nicht ${CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS} Jahre oder älter sein.`);
        }
        if (!data.parent_email && age < CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS && !consentSkipCondition.includes('student')) {
            throw new BadRequest(`Schüleralter: ${age} Im Schülerregistrierungs-Prozess darf der Schüler nicht jünger als ${CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS} Jahre sein.`);
        }
    }

    // identical emails?
    if (data.parent_email && data.parent_email.toLowerCase()===data.email.toLowerCase()) {
        throw new BadRequest('Bitte gib eine unterschiedliche E-Mail-Adresse für dein Kind an.');
    }

    if (data.password_1 && data.passwort_1!==data.passwort_2) {
        throw new BadRequest('Die Passwörter stimmen nicht überein');
    }

    try {
        // check pin
        const email = data.parent_email || data.student_email || data.email;
        const { pin } = data;
        const result = await app.service('registrationPins').find({ query: { pin, email } });
        if (result.data.length!==1 || result.data[0].verified!==true) {
            throw new Error('Der eingegebene Code konnte leider nicht verfiziert werden. Versuch es doch noch einmal.');
        }
    } catch (e) {
        const msg = e.message || 'Fehler wärend der Pin Überprüfung.';
        logger.error(msg, e);
        throw new Error(msg);
    }

    try {
        try {
            // create user
            user = await insertUserToDB(app, data, user);
        } catch (e) {
            const msg = 'Fehler beim Erstellen des Users.';
            logger.warning(msg, e);
            throw new Error(msg);
        }

        try {
            // create account
            account = {
                username: user.email,
                password: data.password_1,
                userId: user._id,
                activated: true,
            };
            account = await app.service('accounts').create(account);
        } catch (e) {
            const msg = 'Fehler beim Erstellen des Accounts.';
            logger.warning(msg, e);
            throw new Error(msg);
        }

        try {
            // store consent
            let consentPromise;
            if (data.parent_email) {
                consent = {
                    form: 'digital',
                    privacyConsent: data.parent_privacyConsent==='true',
                    termsOfUseConsent: data.parent_termsOfUseConsent==='true',
                };
                consentPromise = app.service('consents').create({ userId: user._id, parentConsents: [consent] });
            } else {
                consent = {
                    form: 'digital',
                    privacyConsent: data.privacyConsent==='true',
                    termsOfUseConsent: data.termsOfUseConsent==='true',
                };
                consentPromise = app.service('consents').create({ userId: user._id, userConsent: consent });
            }
            consent = await consentPromise;
        } catch (e) {
            const msg = 'Fehler beim Speichern der Einverständniserklärung.';
            logger.warning(msg, e);
            throw new Error(msg);
        }

        return { user, account, consent };
    } catch (e) {
        try {
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

            await Promise.all(rollbackPromises);
            throw e;
        } catch (e) {
            logger.error('error while rolling back registration', e);
            const msg = (e.error || {}).message || e.message || e || 'Kritischer Fehler bei der Registrierung. Bitte wenden sie sich an den Administrator.';
            throw new BadRequest(msg);
        }
    }
};

module.exports = (app) => {
    class RegistrationService {
        create(data, params) {
            return registerUser(data, params, app);
        }
    }

    return RegistrationService;
};
