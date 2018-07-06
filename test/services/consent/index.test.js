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

  it('creates consents', function() {
    return consentService
      .create({
        "userId": "59ae89b71f513506904e1cc9",
        "parentConsents": [{"parentId": "0000d213816abba584714c0b" }]
      })
        .then(consent => consentService.get(consent._id))
        .then(consent => {
          chai.expect(consent).to.exist;
        });
  });

  it('gets consent versions', function() {
    return consentVersionService
      .find({"versionNumber": "testversion"})
      .then(consentVersion => {
        chai.expect(consentVersion).to.exist;
        chai.expect(consentVersion.data[0]).to.have.property("versionNumber", "testversion");
      });
  });
});