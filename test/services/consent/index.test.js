'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const chai = require('chai');
const consentService = app.service('consents');
const consentVersionService = app.service('consentVersions');

describe('consent service', function() {
  it('registered the consent service', () => {
    assert.ok(consentService);
    assert.ok(consentVersionService);
  });

  it('creates consents correctly', function() {
    return consentService
      .create({
        "userId": "59ae89b71f513506904e1cc9",
        "userConsent": {
          "form": "digital",
          "privacyConsent": true,
          "termsOfUseConsent": true,
          "thirdPartyConsent": true,
          "researchConsent": true
        },
        "parentConsents": [{
          "parentId": "0000d213816abba584714c0b",
          "privacyConsent": true,
          "termsOfUseConsent": true,
          "thirdPartyConsent": true,
          "researchConsent": true
        }]
      }, {"account" : {"_id" :"0000d213816abba584714c0b"}})
        .then(consent => {return consentService.get(consent._id);})
        .then(consent => {
          chai.expect(consent).to.exist;
          chai.expect(consent.parentConsents[0]).to.have.property("dateOfPrivacyConsent");
          chai.expect(consent).to.have.property("userConsent");
        });

  });

  it('patches date of user consent'/*, function () {
    return consentService
      .create({
        "userId": "0000d213816abba584714c0b",
        })
        .then(consent => {
          return consentService.patch(consent._id, {
            "userConsent": {
              "privacyConsent": true,
              "termsOfUseConsent": true,
              "thirdPartyConsent": true,
              "researchConsent": true
            }
          });
        })
        .then(consent => {
          chai.expect(consent).to.have.property("userConsent");
          //chai.expect(consent.userConsent).to.have.property("dateOfPrivacyConsent");
        });
  }*/);
  
  it('doesnt create second consent for same user');

  it('finds consent versions', function() {
    return consentVersionService
      .find({"versionNumber": "testversion"})
      .then(consentVersion => {
        chai.expect(consentVersion).to.exist;
        chai.expect(consentVersion.data[0]).to.have.property("versionNumber", "testversion");
      });
  });

  it('checks access on get', function() {
    return consentService
      .find({query: {userId: "59ae89b71f513506904e1cc9"}})
      .then(consent => {
        chai.expect(consent).to.exist;
      });
  });
});
