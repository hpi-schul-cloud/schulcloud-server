'use strict';

const assert = require('assert');
const express = require('express');
const promisify = require("es6-promisify");
const itsLearningService = require('../../../src/services/authentication/strategies/itslearning.js');
const chai = require('chai');
var itsLearningLoginService = new itsLearningService();

describe('ITSLearning System', () => {
	const newTestAccount = {
		username: "Lars.Lange",
		password: "zJ9L5pVg"
	};
	const faultyTestAccount = {
		username: "LarsL.Lange",
		password: "zJ9L5pVgL"
	};


	it('should be able to retrieve username/hash/etc.', function() {
		this.timeout(10000);
		return itsLearningLoginService.login(newTestAccount, 'https://developer.itslbeta.com').then((response) => {
			chai.expect(response).to.not.be.nil;
			chai.expect(response.username).to.equal(newTestAccount.username);
			chai.expect(response.success).to.be.true;
		});
	});

	it('should not be able to retrieve anything useful', function() {
		this.timeout(10000);
		return itsLearningLoginService.login(faultyTestAccount, 'https://developer.itslbeta.com').then((response) => {
			chai.expect(response).to.not.be.nil;
			chai.expect(response.username).to.be.null;
			chai.expect(response.success).to.be.false;
		});
	});
});
