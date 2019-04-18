const assert = require('assert');
const chai = require('chai');

const app = require('../../../src/app');
const userModel = require('../../../src/services/user/model');

const registrationService = app.service('registration');
const registrationPinService = app.service('registrationPins');

describe('registration service', () => {
    it('registered the registration service', () => {
        assert.ok(registrationService);
    });

    it('processes registration by student correctly', () => {
        const email = `max${Date.now()}@mustermann.de`;
        return registrationPinService.create({ email })
            .then((registrationPin) => {
                const registrationInput = {
                    classOrSchoolId: '0000d186816abba584714c5f',
                    pin: registrationPin.pin,
                    password_1: 'Test123!',
                    password_2: 'Test123!',
                    birthDate: '15.10.1999',
                    email,
                    firstName: 'Max',
                    lastName: 'Mustermann',
                    privacyConsent: true,
                    thirdPartyConsent: true,
                    termsOfUseConsent: true,
                };
                return registrationService.create(registrationInput);
            })
            .then((response) => {
                chai.expect(response.user).to.have.property('_id');
                chai.expect(response.account).to.have.property('_id');
                chai.expect(response.consent).to.have.property('_id');
                chai.expect(response.consent).to.have.property('userConsent');
                chai.expect(response.parent).to.equal(null);
            });
    });

    it('processes registration by parent correctly', () => {
        const email = `moritz${Date.now()}@mustermann.de`;
        return registrationPinService.create({ email })
            .then((registrationPin) => {
                const registrationInput = {
                    classOrSchoolId: '0000d186816abba584714c5f',
                    pin: registrationPin.pin,
                    password_1: 'Test123!',
                    password_2: 'Test123!',
                    birthDate: '15.10.2014',
                    email: `max${Date.now()}@mustermann.de`,
                    firstName: 'Max',
                    lastName: 'Mustermann',
                    privacyConsent: true,
                    thirdPartyConsent: true,
                    termsOfUseConsent: true,
                    parent_email: email,
                    parent_firstName: 'Moritz',
                    parent_lastName: 'Mustermann',
                };
                return registrationService.create(registrationInput);
            })
            .then((response) => {
                chai.expect(response.user).to.have.property('_id');
                chai.expect(response.account).to.have.property('_id');
                chai.expect(response.consent).to.have.property('_id');
                chai.expect(response.consent.parentConsents.length).to.be.at.least(1);
                chai.expect(response.parent).to.have.property('_id');
                chai.expect(response.user.parents).to.include(response.parent._id);
                chai.expect(response.parent.children).to.include(response.user._id);
            });
    });

    it('fails with invalid pin', () => {
        const email = `max${Date.now()}@mustermann.de`;
        return registrationPinService.create({ email })
            .then((registrationPin) => {
                let pin = Number(registrationPin.pin);
                pin = pin === 9999 ? 1000 : pin + 1;
                // make sure we pass a wrong pin
                return registrationService.create({
                    classOrSchoolId: '0000d186816abba584714c5f',
                    pin: String(pin),
                    birthDate: '15.10.1999',
                    email,
                    firstName: 'Max',
                    lastName: 'Mustermann',
                });
            }).catch((err) => {
                chai.expect(err).to.not.equal(undefined);
                chai.expect(err.message).to.equal('Ungültige Pin, bitte überprüfe die Eingabe.');
            });
    });

    it('fails if parent and student email are the same', () => registrationService.create({
        classOrSchoolId: '0000d186816abba584714c5f',
        email: 'max.sameadress@mustermann.de',
        parent_email: 'max.sameadress@mustermann.de',
        birthDate: '18.02.2015',
    }).catch((err) => {
        chai.expect(err.message).to.equal('Bitte gib eine unterschiedliche E-Mail-Adresse für dein Kind an.');
    }));

    it('undoes changes on fail', () => {
        const email = `max${Date.now()}@mustermann.de`;
        return registrationPinService.create({ email })
            .then((registrationPin) => {
                const registrationInput = {
                    classOrSchoolId: '0000d186816abba584714c5f',
                    pin: registrationPin.pin,
                    birthDate: '15.10.1999',
                    email,
                    firstName: 'Max',
                    lastName: 'Mustermann',
                    privacyConsent: true,
                    thirdPartyConsent: true,
                    termsOfUseConsent: true,
                };
                return registrationService.create(registrationInput).catch((err) => {
                    // no password given, should result in an error.
                    chai.expect(err.message).to.equal('Fehler beim Erstellen des Accounts.');
                    // a user has been created before the error. Lets check if he was deleted...
                    return userModel.userModel.findOne({ email });
                }).then((users) => {
                    chai.expect(users).to.equal(null);
                });
            });
    });

    it('processes teachers correctly', () => {
        const email = `max${Date.now()}@mustermann.de`;
        let hash;
        let user;
        const hashData = {
            toHash: email,
            save: true,
        };
        return app.service('hash').create(hashData)
            .then((newHash) => {
                hash = newHash;
                return userModel.userModel.create({
                    email,
                    firstName: 'Max',
                    lastName: 'Mustermann',
                    schoolId: '0000d186816abba584714c5f',
                    roles: ['0000d186816abba584714c98'], // teacher
                    importHash: hash,
                });
            })
            .then((newUser) => {
                user = newUser;
                return registrationPinService.create({ email });
            })
            .then((registrationPin) => {
                const registrationInput = {
                    classOrSchoolId: '0000d186816abba584714c5f',
                    pin: registrationPin.pin,
                    password_1: 'Test123!',
                    password_2: 'Test123!',
                    email,
                    firstName: 'Max',
                    lastName: 'Mustermann',
                    importHash: hash,
                    userId: user._id,
                    privacyConsent: true,
                    thirdPartyConsent: true,
                    termsOfUseConsent: true,
                };
                return registrationService.create(registrationInput).then((response) => {
                    chai.expect(response.user).to.have.property('_id');
                    chai.expect(response.account).to.have.property('_id');
                    chai.expect(response.consent).to.have.property('_id');
                    chai.expect(response.consent).to.have.property('userConsent');
                    chai.expect(response.parent).to.equal(null);
                });
            });
    });
});
