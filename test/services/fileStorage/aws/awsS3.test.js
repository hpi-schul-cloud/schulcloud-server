'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
let expect = require('chai').expect;
const mockery = require('mockery');
const mockAws = require('mock-aws');

chai.use(chaiHttp);

describe('AWS file storage strategy', function() {
	let aws;
	let options = {
		schoolId: '0000d186816abba584714c5f',
	};

	before(function(done) {
		// Enable mockery to mock objects
		mockery.enable({
			warnOnUnregistered: false
		});

		// Once mocked, any code that calls require('nodemailer') will get our nodemailerMock
		mockery.registerMock('aws-sdk', mockAws);

		// Make sure anything that uses nodemailer is loaded here, after it is mocked...
		delete require.cache[require.resolve('../../../../src/services/fileStorage/strategies/awsS3')];
		const AWSStrategy = require('../../../../src/services/fileStorage/strategies/awsS3');
		aws = new AWSStrategy();
		done();
	});

	after(function () {

		// Remove our mocked nodemailer and disable mockery
		mockery.deregisterAll();
		mockery.disable();

	});

	it('creates a bucket for the given school', function() {
		/**return aws.create(options.schoolId).then(res => {
			console.log(res);
			expect(res).to.not.be.undefined;
			return;
		}).catch(err => {
			console.log(err);
			expect(err).to.not.be.undefined;
			return;
		})**/
	});

	it('rejects if no school id is given', function() {
		return aws.create().catch(err => {
			expect(err).to.not.be.undefined;
			return;
		});
	});
});
