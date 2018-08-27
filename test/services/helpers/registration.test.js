'use strict';
const assert = require('assert');
const app = require('../../../src/app');
const registrationService = app.service('registration');
const registrationPinService = app.service('registrationPins');
const chai = require('chai');

describe('registration service', function() {
    it('registered the registration service', () => {
        assert.ok(registrationService);
    });

    it('processes 18+ correctly', () => {
        let email = 'max' + Date.now() + '@mustermann.de';
        return registrationPinService.create({"email": email})
        .then(registrationPin => {
            let registrationInput = {
                classOrSchoolId: "0000d186816abba584714c5f",
                "email-pin": registrationPin.pin,
                "pin-sent": "yes",
                "initial-password": "pw123",
                //stage: "on",
                gender: "male",
                "student-birthdate": "15.10.1999",
                "student-email": email,
                "student-firstname": "Max",
                "student-secondname": "Mustermann",
                Erhebung: "true",
                Forschung: "true",
                Nutzungsbedingungen: "Nutzungsbedingungen", //try "true"
                Pseudonymisierung: "true"
            };
            return registrationService.create(registrationInput);
        })
        .then(response => {
            chai.expect(response.user).to.have.property("_id");
            chai.expect(response.account).to.have.property("_id");
            chai.expect(response.consent).to.have.property("_id");
            chai.expect(response.parent).to.equal(null);
        });
    });
});