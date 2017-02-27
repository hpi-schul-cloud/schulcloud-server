'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = require('chai').expect;
const mockery = require('mockery');
const mockAws = require('./s3.mock');
const user = require('../../../../src/services/user/model');
const winston = require('winston');
const mongoose = require('mongoose');
const app = require('../../../../src/app');

chai.use(chaiHttp);

describe('AWS file storage strategy', function () {
	let aws;
	let options = {
		schoolId: '0000d186816abba584714c5f'
	};

	before(function (done) {
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
		it('creates a bucket for the given school', function () {
			return aws.create(options.schoolId).then(res => {
				expect(res).to.not.be.undefined;
				expect(res.message).to.be.equal("Successfully created s3-bucket!");
				return;
			});
		});

		it('rejects if no school id is given', function () {
			return aws.create().catch(err => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
				return;
			});
		});

		it('rejects if school was not found', function () {
			return aws.create("0000d186816abba584714bbb").catch(err => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(404);
				return;
			});
		});
	});

	describe("GET /fileStorage", function () {
		it("gets all stored files for one user", function () {
			return aws.getFiles("0000d213816abba584714c0a", "users/0000d213816abba584714c0a").then(res => {
				expect(res).to.not.be.undefined;
				expect(res.files.length).to.be.equal(1);
				expect(res.directories.length).to.be.equal(0);
				return;
			});
		});

		it("gets all stored files for one course", function () {
			return aws.getFiles("0000d213816abba584714c0a", "courses/0000dcfbfb5c7a3f00bf21ab").then(res => {
				expect(res).to.not.be.undefined;
				expect(res.files.length).to.be.equal(1);
				expect(res.directories.length).to.be.equal(0);
				return;
			});
		});

		it("gets all stored files for the teacher of a course", function () {
			return aws.getFiles("0000d231816abba584714c9e", "courses/0000dcfbfb5c7a3f00bf21ab").then(res => {
				expect(res).to.not.be.undefined;
				expect(res.files.length).to.be.equal(1);
				expect(res.directories.length).to.be.equal(0);
				return;
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
			return aws.getFiles("0000d213816abba584714c0a", "users/0000d213816abba584714123").then(
				res => chai.fail('it succeeded', 'should have returned an error'),
				err => {
					expect(err).to.not.be.undefined;
					expect(err.code).to.equal(403);
					expect(err.message).to.contain("You don't have permissions");
				});
		});

		it("rejects with no permissions for course", function () {
			return aws.getFiles("0000d213816abba584714c0a", "courses/0000d213816abba584714123").then(
				res => chai.fail('it succeeded', 'should have returned an error'),
				err => {
					expect(err).to.not.be.undefined;
					expect(err.message).to.contain("You don't have permissions");
					expect(err.code).to.equal(403);
					return;
				});
		});

		it("rejects with no permissions for class", function () {
			return aws.getFiles("0000d213816abba584714c0a", "classes/0000d213816abba584714123").then(
				res => chai.fail('it succeeded', 'should have returned an error'),
				err => {
					expect(err).to.not.be.undefined;
					expect(err.message).to.contain("You don't have permissions");
					expect(err.code).to.equal(403);
					return;
				});
		});
	});

	describe("DELETE /fileStorage/", function () {
		it("deletes a file correctly", function () {
			return aws.deleteFile("0000d213816abba584714c0a", "users/0000d213816abba584714c0a", "example.jpg").then(res => {
				expect(res).to.not.be.undefined;
				expect(res).to.be.equal("successfully deleted object");
				return;
			});
		});

		it("rejects with missing parameters", function () {
			return aws.deleteFile().catch(err => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
				return;
			});
		});
	});

	describe("POST /fileStorage/signedUrl", function () {
		it("creates valid signed url", function () {
			return aws.generateSignedUrl("0000d213816abba584714c0a", "users/0000d213816abba584714c0a", "example.jpg", "mime/image", "putObject").then(res => {
				expect(res).to.not.be.undefined;
				expect(res.url).to.be.equal("successfully created signed url");
				return;
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

	describe("POST /fileStorage/directories", function () {
		it("creates a new directory", function () {
			return aws.createDirectory("0000d213816abba584714c0a", "users/0000d213816abba584714c0a", "test").then(res => {
				expect(res).to.not.be.undefined;
				expect(res).to.be.equal("successfully put object");
				return;
			});
		});

		it("rejects with missing parameters", function () {
			return aws.createDirectory().catch(err => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
				return;
			});
		});
	});
});
