const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = require('chai');
const mockery = require('mockery');
const mockAws = require('./s3.mock');
const logger = require('../../../../src/logger');
const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('../../../../src/app');

const testObjects = require('../../helpers/testObjects')(appPromise);

chai.use(chaiHttp);

describe('AWS file storage strategy', () => {
	let aws;

	const options = {
		schoolId: '5f2987e020834114b8efd6f8',
	};

	const ShouldFail = new Error('It succeeded but should have returned an error.');

	let configBefore = {};

	before(async () => {
		// Enable mockery to mock objects
		mockery.enable({
			warnOnUnregistered: false,
		});

		// mock aws functions
		mockery.registerMock('aws-sdk', mockAws);
		mockery.registerMock('../../../../config/secrets.json', {
			aws: {
				endpointUrl: 'test.url/',
			},
		});

		configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
		Configuration.set('FEATURE_MULTIPLE_S3_PROVIDERS_ENABLED', true);
		Configuration.set('S3_KEY', '1234567891234567');

		await testObjects.createTestStorageProvider({ secretAccessKey: '123456789' });

		delete require.cache[require.resolve('../../../../src/services/fileStorage/strategies/awsS3')];
		const AWSStrategy = require('../../../../src/services/fileStorage/strategies/awsS3');
		aws = new AWSStrategy();
	});

	after(async () => {
		mockery.deregisterAll();
		mockery.disable();
		await testObjects.cleanup();
		Configuration.reset(configBefore);
	});

	describe('create', () => {
		it('creates a bucket for the given school', () =>
			aws
				.create(options.schoolId)
				.then((res) => {
					expect(res).to.not.be.undefined;
					expect(res.message).to.be.equal('Successfully created s3-bucket!');
				})
				.catch((err) => {
					logger.warning('aws.create error', err);
				}));

		it('rejects if no school id is given', () =>
			aws
				.create()
				.then(() => {
					throw ShouldFail;
				})
				.catch((err) => {
					expect(err).to.not.be.undefined;
					expect(err.code).to.equal(400);
				}));

		it('rejects if school was not found', () =>
			aws
				.create('0000d186816abba584714bbb')
				.then(() => {
					throw ShouldFail;
				})
				.catch((err) => {
					expect(err).to.not.be.undefined;
					expect(err.code).to.equal(404);
				}));
	});

	describe('delete file', () => {
		it('deletes a file correctly', () =>
			aws.deleteFile('0000d213816abba584714c0a', 'users/0000d213816abba584714c0a/example.jpg').then((res) => {
				expect(res).to.not.be.undefined;
				expect(res.Deleted).to.have.lengthOf(1);
				expect(res.Deleted[0].Key).to.equal('users/0000d213816abba584714c0a/example.jpg');
			}));

		it('rejects with missing parameters', () =>
			aws
				.deleteFile()
				.then(() => {
					throw ShouldFail;
				})
				.catch((err) => {
					expect(err).to.not.be.undefined;
					expect(err.code).to.equal(400);
				}));
	});

	describe('generate signed url', () => {
		it('creates valid signed url', () =>
			aws
				.generateSignedUrl({
					userId: '0000d213816abba584714c0a',
					flatFileName: 'users/0000d213816abba584714c0a/example.jpg',
					fileType: 'text/plain',
				})
				.then((res) => {
					expect(res).to.not.be.undefined;
					expect(res).to.be.equal('successfully created signed url');
				}));

		it('rejects with missing parameters', () =>
			aws
				.generateSignedUrl({})
				.then(() => {
					throw ShouldFail;
				})
				.catch((err) => {
					expect(err).to.not.be.undefined;
					expect(err.code).to.equal(400);
				}));
	});
});
