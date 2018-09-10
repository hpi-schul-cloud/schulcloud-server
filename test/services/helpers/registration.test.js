'use strict';
const assert = require('assert');
const app = require('../../../src/app');
const registrationService = app.service('registration');
const registrationPinService = app.service('registrationPins');
const userModel = require('../../../src/services/user/model');
const chai = require('chai');

describe('registration service', function() {
    it('registered the registration service', () => {
        assert.ok(registrationService);
    });

    it('processes registration by student correctly', () => {
        let email = 'max' + Date.now() + '@mustermann.de';
        return registrationPinService.create({"email": email})
        .then(registrationPin => {
            let registrationInput = {
                classOrSchoolId: "0000d186816abba584714c5f",
                pin: registrationPin.pin,
                password_1: "pw123",
                password_2: "pw123",
                gender: "male",
                birthDate: "15.10.1999",
                email: email,
                firstName: "Max",
                secondName: "Mustermann",
                Erhebung: true,
                Forschung: true,
                Nutzungsbedingungen: true,
                Pseudonymisierung: true
            };
            return registrationService.create(registrationInput);
        })
        .then(response => {
            chai.expect(response.user).to.have.property("_id");
            chai.expect(response.account).to.have.property("_id");
            chai.expect(response.consent).to.have.property("_id");
            chai.expect(response.consent).to.have.property("userConsent");
            chai.expect(response.parent).to.equal(null);
        });
    });

    it('processes registration by parent correctly', () => {
        let email = 'moritz' + Date.now() + '@mustermann.de';
        return registrationPinService.create({"email": email})
        .then(registrationPin => {
            let registrationInput = {
                classOrSchoolId: "0000d186816abba584714c5f",
                pin: registrationPin.pin,
                gender: "male",
                password_1: "pw123",
                password_2: "pw123",
                birthDate: "15.10.2014",
                email: 'max' + Date.now() + '@mustermann.de',
                firstName: "Max",
                secondName: "Mustermann",
                Erhebung: true,
                Forschung: true,
                Nutzungsbedingungen: true,
                Pseudonymisierung: true,
                parent_email: email,
                parent_firstName: "Moritz",
                parent_secondName: "Mustermann"
            };
            return registrationService.create(registrationInput);
        })
        .then(response => {
            chai.expect(response.user).to.have.property("_id");
            chai.expect(response.account).to.have.property("_id");
            chai.expect(response.consent).to.have.property("_id");
            chai.expect(response.consent.parentConsents.length).to.be.at.least(1);
            chai.expect(response.parent).to.have.property("_id");
            //chai.expect(response.user.parents).to.include(response.parent._id);
            chai.expect(response.parent.children).to.include(response.user._id);
        });
    });

    it('fails with invalid pin', () => {
        let email = 'max' + Date.now() + '@mustermann.de';
        return registrationPinService.create({"email": email})
        .then(registrationPin => {
            let pin = Number(registrationPin.pin);
            pin = pin == 9999 ? 1000 : pin + 1;
            //make sure we pass a wrong pin
            return registrationService.create({
                classOrSchoolId: "0000d186816abba584714c5f",
                pin: String(pin),
                gender: "male",
                birthDate: "15.10.1999",
                email: email,
                firstName: "Max",
                secondName: "Mustermann",
            });
        }).catch(err => {
            chai.expect(err).to.be.not.undefined;
            chai.expect(err.message).to.equal("Ungültige Pin, bitte überprüfe die Eingabe.");
        });
    });

    it('fails if parent and student email are the same', () => {
        return registrationService.create({
            classOrSchoolId: "0000d186816abba584714c5f",
            email: "max.sameadress@mustermann.de",
            parent_email: "max.sameadress@mustermann.de",
            birthDate: "18.02.2015"
        }).catch(err => {
            chai.expect(err.message).to.equal("Bitte gib eine unterschiedliche E-Mail-Adresse für dein Kind an.");
        });
    });

    it('undoes changes on fail', () => {
        let email = 'max' + Date.now() + '@mustermann.de';
        return registrationPinService.create({"email": email})
        .then(registrationPin => {
            let registrationInput = {
                classOrSchoolId: "0000d186816abba584714c5f",
                pin: registrationPin.pin,
                gender: "male",
                birthDate: "15.10.1999",
                email: email,
                firstName: "Max",
                secondName: "Mustermann",
                Erhebung: true,
                Forschung: true,
                Nutzungsbedingungen: true,
                Pseudonymisierung: true
            };
            return registrationService.create(registrationInput).catch(err => {
                chai.expect(err.message).to.equal("Fehler beim Erstellen des Schüler-Accounts.");
                //a user should have been created before the error. Lets check if he was deleted...
                return userModel.userModel.findOne({email: email});
            }).then(users => {
                chai.expect(users).to.equal(null);
            });
        });
    });
});