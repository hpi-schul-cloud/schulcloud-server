const { expect } = require('chai');
const express = require('express');
const sinon = require('sinon');
const request = require('supertest');

const logger = require('../../src/logger');
const errorHandler = require('../../src/middleware/errorHandler');

describe('errorHandler', () => {
	let app;
	let loggerErrorStub;

	before(() => {
		app = express();
		app.use((req, res, next) => next(new Error('test error')));
		errorHandler(app);
	});

	beforeEach(() => {
		loggerErrorStub = sinon.stub(logger, 'error');
	});

	afterEach(() => {
		sinon.restore();
	});

	const getLoggedUrl = () => {
		expect(loggerErrorStub.calledOnce).to.equal(true);

		return loggerErrorStub.firstCall.args[0].url;
	};

	it('should not log the token of /sharetoken/:token', async () => {
		await request(app).get('/api/v3/sharetoken/secretShareToken/import');

		expect(getLoggedUrl()).to.equal('/api/v3/sharetoken/***/import');
		expect(JSON.stringify(loggerErrorStub.firstCall.args)).to.not.include('secretShareToken');
	});

	it('should not log the secret of /registrations/by-secret/:registrationSecret', async () => {
		await request(app).get('/api/v3/registrations/by-secret/secretRegistration');

		expect(getLoggedUrl()).to.equal('/api/v3/registrations/by-secret/***');
		expect(JSON.stringify(loggerErrorStub.firstCall.args)).to.not.include('secretRegistration');
	});

	it('should not log the token of /passwordRecovery/:token', async () => {
		await request(app).get('/passwordRecovery/secretRecoveryToken');

		expect(getLoggedUrl()).to.equal('/passwordRecovery/***');
	});

	it('should log other urls unchanged', async () => {
		await request(app).get('/courses/123?foo=bar');

		expect(getLoggedUrl()).to.equal('/courses/123?foo=bar');
	});

	it('should redact query params with a sensitive name and keep the others', async () => {
		await request(app).get('/rooms?shareToken=secretShareToken&page=2');

		expect(getLoggedUrl()).to.equal('/rooms?shareToken=***&page=2');
	});

	it('should redact secrets after doubled slashes', async () => {
		await request(app).get('/api/v3//sharetoken/secretShareToken');

		expect(getLoggedUrl()).to.equal('/api/v3//sharetoken/***');
	});

	it('should still remove a secret query', async () => {
		await request(app).get('/sharetoken/secretShareToken?accessToken=secretQueryToken');

		expect(getLoggedUrl()).to.equal('/sharetoken/***?<secretQuery>');
	});
});
