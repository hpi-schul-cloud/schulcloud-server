const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('../../../../src/app');
const AWSStrategy = require('../../../../src/services/fileStorage/strategies/awsS3');
const testHelper = require('../../helpers/testObjects');
const mockAwsHelper = require('./s3.mock');

chai.use(chaiHttp);

describe('multple S3 AWS file storage strategy', () => {
	let aws;
	let testObjects;
	let server;

	const ShouldFail = new Error('It succeeded but should have returned an error.');

	let configBefore = {};

	before(async () => {
		configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
		Configuration.set('FEATURE_MULTIPLE_S3_PROVIDERS_ENABLED', true);
		Configuration.set('S3_KEY', '1234567891234567');
		const app = await appPromise();
		testObjects = testHelper(app);
		server = await app.listen(0);
		await testObjects.createTestStorageProvider({ secretAccessKey: '123456789' });

		const config = {
			aws: {
				endpointUrl: 'test.url/',
			},
		};
		aws = new AWSStrategy(mockAwsHelper, config);
	});

	after(async () => {
		await server.close();
		await testObjects.cleanup();
		Configuration.reset(configBefore);
	});

	describe('create', () => {
		it('creates a bucket for the given school', async () => {
			const schoolId = '5f2987e020834114b8efd6f8';

			const res = await aws.create(schoolId);

			expect(res).to.not.be.undefined;
			expect(res.message).to.be.equal('Successfully created s3-bucket!');
		});

		it('rejects if no school id is given', async () => {
			await expect(aws.create()).to.be.rejectedWith('No school id parameter given.');
		});

		it('rejects if school was not found', async () => {
			try {
				await aws.create('0000d186816abba584714bbb');
				throw ShouldFail;
			} catch (err) {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(404);
			}
		});
	});

	describe('delete file', () => {
		it('deletes a file correctly', async () => {
			const res = await aws.deleteFile('0000d213816abba584714c0a', 'users/0000d213816abba584714c0a/example.jpg');
			expect(res).to.not.be.undefined;
			expect(res.Deleted).to.have.lengthOf(1);
			expect(res.Deleted[0].Key).to.equal('users/0000d213816abba584714c0a/example.jpg');
		});

		it('rejects with missing parameters', async () => {
			try {
				await aws.deleteFile();
				throw ShouldFail;
			} catch (err) {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
			}
		});
	});

	describe('generate signed url', () => {
		it('creates valid signed url', async () => {
			const res = await aws.generateSignedUrl({
				userId: '0000d213816abba584714c0a',
				flatFileName: 'users/0000d213816abba584714c0a/example.jpg',
				fileType: 'text/plain',
			});
			expect(res).to.not.be.undefined;
			expect(res).to.be.equal('successfully created signed url');
		});

		it('rejects with missing parameters', async () => {
			try {
				await aws.generateSignedUrl({});
				throw ShouldFail;
			} catch (err) {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
			}
		});
	});
});
