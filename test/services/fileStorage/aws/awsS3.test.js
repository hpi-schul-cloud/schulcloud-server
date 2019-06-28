const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = require('chai');
const mockery = require('mockery');
const mockAws = require('./s3.mock');

chai.use(chaiHttp);

describe('AWS file storage strategy', () => {
	let aws;

	const options = {
		schoolId: '0000d186816abba584714c5f',
	};

	before((done) => {
		// Enable mockery to mock objects
		mockery.enable({
			warnOnUnregistered: false,
		});

		// mock aws functions
		mockery.registerMock('aws-sdk', mockAws);
		mockery.registerMock('../../../../config/secrets.js', {
			aws: {
				endpointUrl: 'test.url/',
			},
		});

		delete require.cache[require.resolve('../../../../src/services/fileStorage/strategies/awsS3')];
		const AWSStrategy = require('../../../../src/services/fileStorage/strategies/awsS3');
		aws = new AWSStrategy();

		done();
	});

	after(() => {
		mockery.deregisterAll();
		mockery.disable();
	});

	describe('create', () => {
		it('creates a bucket for the given school', () => aws.create(options.schoolId).then((res) => {
			expect(res).to.not.be.undefined;
			expect(res.message).to.be.equal('Successfully created s3-bucket!');
		}));

		it('rejects if no school id is given', () => aws.create()
			.then(res => chai.fail('it succeeded', 'should have returned an error'))
			.catch((err) => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
			}));

		it('rejects if school was not found', () => aws.create('0000d186816abba584714bbb')
			.then(res => chai.fail('it succeeded', 'should have returned an error'))
			.catch((err) => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(404);
			}));
	});

	describe('delete file', () => {
		it('deletes a file correctly', () => aws.deleteFile(
			'0000d213816abba584714c0a',
			'users/0000d213816abba584714c0a/example.jpg',
		).then((res) => {
			expect(res).to.not.be.undefined;
			expect(res.Deleted).to.have.lengthOf(1);
			expect(res.Deleted[0].Key).to.equal('users/0000d213816abba584714c0a/example.jpg');
		}));

		it('rejects with missing parameters', () => aws.deleteFile()
			.then(res => chai.fail('it succeeded', 'should have returned an error'))
			.catch((err) => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
			}));
	});

	describe('generate signed url', () => {
		it('creates valid signed url', () => aws.generateSignedUrl({
			userId: '0000d213816abba584714c0a',
			flatFileName: 'users/0000d213816abba584714c0a/example.jpg',
			fileType: 'text/plain',
		}).then((res) => {
			expect(res).to.not.be.undefined;
			expect(res).to.be.equal('successfully created signed url');
		}));

		it('rejects with missing parameters', () => aws.generateSignedUrl({})
			.then(() => chai.fail('it succeeded', 'should have returned an error'))
			.catch((err) => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
			}));
	});
});
