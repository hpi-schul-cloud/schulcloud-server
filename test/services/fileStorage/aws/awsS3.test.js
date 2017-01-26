'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
let expect = require('chai').expect;
const mockery = require('mockery');
const mockAws = require('./s3.mock');
const user = require('../../../../src/services/user/model');
const winston = require('winston');

chai.use(chaiHttp);

describe('AWS file storage strategy', function() {
	let aws;
	let options = {
		schoolId: '0000d186816abba584714c5f'
	};

	before(function(done) {
		// Enable mockery to mock objects
		mockery.enable({
			warnOnUnregistered: false
		});

		// mock aws functions
		mockery.registerMock('aws-sdk', mockAws);

		delete require.cache[require.resolve('../../../../src/services/fileStorage/strategies/awsS3')];
		const AWSStrategy = require('../../../../src/services/fileStorage/strategies/awsS3');
		aws = new AWSStrategy();
		done();
	});

	after(function () {
		mockery.deregisterAll();
		mockery.disable();
	});

	describe("POST /fileStorage", function () {
		it('creates a bucket for the given school', function() {
			return new Promise((resolve, reject) => {
				aws.create(options.schoolId).then(res => {
					expect(res).to.not.be.undefined;
					resolve();
				});
			});
		});

		it('rejects if no school id is given', function() {
			return aws.create().catch(err => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
				return;
			});
		});

		it('rejects if school was not found', function() {
			return aws.create("0000d186816abba584714bbb").catch(err => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(404);
				return;
			});
		});
	});

	describe("GET /fileStorage", function () {
		it("gets all stored files for one user", function () {
			return new Promise((resolve, reject) => {
				aws.getFiles("0000d213816abba584714c0a", "users/0000d213816abba584714c0a").then(res => {
					expect(res).to.not.be.undefined;
					resolve();
				});
			});
		});

		it("gets all stored files for one course", function () {
			return new Promise((resolve, reject) => {
				aws.getFiles("0000d213816abba584714c0a", "courses/0000dcfbfb5c7a3f00bf21ab").then(res => {
					expect(res).to.not.be.undefined;
					resolve();
				});
			});
		});

		it("rejects with missing parameters", function () {
			return aws.getFiles().catch(err => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
				return;
			});
		});

		it("rejects with no permissions for user", function () {
			return aws.getFiles("0000d213816abba584714c0a", "users/0000d213816abba584714123").then(err => {
				expect(err).to.not.be.undefined;
				expect(err.message).to.contain("You don't have permissions");
				expect(err.code).to.equal(403);
				return;
			});
		});

		it("rejects with no permissions for course", function () {
			return aws.getFiles("0000d213816abba584714c0a", "courses/0000d213816abba584714123").then(err => {
				expect(err).to.not.be.undefined;
				expect(err.message).to.contain("You don't have permissions");
				expect(err.code).to.equal(403);
				return;
			});
		});

		it("rejects with no permissions for class", function () {
			return aws.getFiles("0000d213816abba584714c0a", "classes/0000d213816abba584714123").then(err => {
				expect(err).to.not.be.undefined;
				expect(err.message).to.contain("You don't have permissions");
				expect(err.code).to.equal(403);
				return;
			});
		});
	});

	describe("POST /fileStorage/signedUrl", function () {
		it("creates valid signed url", function () {
			return new Promise((resolve, reject) => {
				aws.generateSignedUrl("0000d213816abba584714c0a", "users/0000d213816abba584714c0a", "example.jpg", "mime/image", "putObject").then(res => {
					expect(res).to.not.be.undefined;
					resolve();
				});
			});
		});

		it("rejects with missing parameters", function () {
			return aws.generateSignedUrl().catch(err => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
				return;
			});
		});
	});
});
