const { expect } = require('chai');
const sinon = require('sinon');
const { Configuration } = require('@hpi-schul-cloud/commons');

const logger = require('../src/logger');
const { leadTimeDetection } = require('../src/app.hooks');

describe('leadTimeDetection', () => {
	let loggerErrorStub;

	beforeEach(() => {
		loggerErrorStub = sinon.stub(logger, 'error');
		sinon.stub(Configuration, 'get').withArgs('LEAD_TIME').returns(0);
	});

	afterEach(() => {
		sinon.restore();
	});

	const createContext = (path, id, originalUrl) => ({
		path,
		id,
		method: 'get',
		params: { leadTime: Date.now() - 1000, query: {}, originalUrl },
	});

	const getLoggedInfo = () => {
		expect(loggerErrorStub.calledOnce).to.equal(true);

		return loggerErrorStub.firstCall.args[0].errors;
	};

	it('should log neither the url secret nor the id of passwordRecovery', () => {
		leadTimeDetection(
			createContext('passwordRecovery', 'secretRecoveryToken', '/passwordRecovery/secretRecoveryToken')
		);

		const info = getLoggedInfo();
		expect(info.originalUrl).to.equal('/passwordRecovery/***');
		expect(info.id).to.equal('***');
		expect(JSON.stringify(loggerErrorStub.firstCall.args[0])).to.not.include('secretRecoveryToken');
	});

	it('should log neither the url secret nor the id of link', () => {
		leadTimeDetection(createContext('link', 'secretLinkId', '/api/v1/link/secretLinkId'));

		const info = getLoggedInfo();
		expect(info.originalUrl).to.equal('/api/v1/link/***');
		expect(info.id).to.equal('***');
	});

	it('should log other urls and ids unchanged', () => {
		leadTimeDetection(createContext('courses', '123', '/courses/123'));

		const info = getLoggedInfo();
		expect(info.originalUrl).to.equal('/courses/123');
		expect(info.id).to.equal('123');
	});
});
