const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiAsPromised = require('chai-as-promised');
const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('../../../../src/app');
const { schoolModel } = require('../../../../src/services/school/model');
const AWSStrategy = require('../../../../src/services/fileStorage/strategies/awsS3');
const testHelper = require('../../helpers/testObjects');
const mockAwsHelper = require('./s3.mock');

chai.use(chaiHttp);
chai.use(chaiAsPromised);

describe('AWS file storage strategy', () => {
	let aws;
	let server;
	let testObjects;

	const ShouldFail = new Error('It succeeded but should have returned an error.');

	let configBefore = {};
	before(async () => {
		configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
		Configuration.set('FEATURE_MULTIPLE_S3_PROVIDERS_ENABLED', true);
		Configuration.set('S3_KEY', '1234567891234567');
		const app = await appPromise();
		server = await app.listen(0);
		testObjects = testHelper(app);
		await testObjects.createTestStorageProvider({ secretAccessKey: '123456789' });

		const config = {
			aws: {
				endpointUrl: 'test.url/',
			},
		};
		aws = new AWSStrategy(mockAwsHelper, config);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
		Configuration.reset(configBefore);
	});

	describe('create', () => {
		it('creates a bucket for the given school', async () => {
			const testSchool = await testObjects.createTestSchool();
			const res = await aws.create(testSchool._id);
			expect(res).to.not.be.undefined;
			expect(res.message).to.be.equal('Successfully created s3-bucket!');
		});

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

		it('wrong provider assigned', async () => {
			const testStorageProvider = await testObjects.createTestStorageProvider({ secretAccessKey: '1' });

			let testSchool = await testObjects.createTestSchool({ storageProvider: testStorageProvider });
			// 1. call: create bucket for school should be successfull
			const res = await aws.create(testSchool._id);
			expect(res.message).to.be.equal('Successfully created s3-bucket!');
			expect(testSchool.storageProvider._id.toString()).to.equal(testStorageProvider._id.toString());
			// 2. call: create bucket for school should lead to 409 unique bucket name error and
			// the school should be reassigned to provider with the corresponding bucket
			let expectedProviderId;
			try {
				await aws.create(testSchool._id);
				throw ShouldFail;
			} catch (err) {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(500);
				expectedProviderId = err.provider;
			}
			testSchool = (await schoolModel.findById(testSchool._id)).toObject();
			expect(testSchool.storageProvider._id.toString()).to.equal(expectedProviderId);
		});

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
