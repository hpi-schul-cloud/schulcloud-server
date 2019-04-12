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
		mockery.registerMock('../../../../config/secrets.json', {
			aws: {
				endpointUrl: 'test.url/'
			}
		});

		delete require.cache[require.resolve('../../../../src/services/fileStorage/strategies/awsS3')];
		delete require.cache[require.resolve('../../../../config/secrets.json')];
		const AWSStrategy = require('../../../../src/services/fileStorage/strategies/awsS3');
		aws = new AWSStrategy();

		done();
	});

	after(function () {
		mockery.deregisterAll();
		mockery.disable();
	});

	describe("create", function () {
		it('creates a bucket for the given school', function () {
			return aws.create(options.schoolId).then(res => {
				expect(res).to.not.be.undefined;
				expect(res.message).to.be.equal("Successfully created s3-bucket!");
				return;
			});
		});

		it('rejects if no school id is given', function () {
			return aws.create()
				.then(res => chai.fail('it succeeded', 'should have returned an error'))
				.catch(err => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
				return;
			});
		});

		it('rejects if school was not found', function () {
			return aws.create("0000d186816abba584714bbb")
				.then(res => chai.fail('it succeeded', 'should have returned an error'))
				.catch(err => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(404);
				return;
			});
		});
	});

	describe.skip("getFiles", function () {
		it("gets all stored files for one user", function () {
			return aws.getFiles("0000d213816abba584714c0a", "users/0000d213816abba584714c0a").then(res => {
				expect(res).to.not.be.undefined;
				expect(res.files.length).to.be.equal(1);
				expect(res.directories.length).to.be.equal(0);
				return;
			});
		});

		it("rejects with missing parameters", function () {
			return aws.getFiles()
				.then(res => chai.fail('it succeeded', 'should have returned an error'))
				.catch(err => {
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
				});
		});

		it("rejects with no permissions for class", function () {
			return aws.getFiles("0000d213816abba584714c0a", "classes/0000d213816abba584714123").then(
				res => chai.fail('it succeeded', 'should have returned an error'),
				err => {
					expect(err).to.not.be.undefined;
					expect(err.message).to.contain("You don't have permissions");
					expect(err.code).to.equal(403);
				});
		});
	});

	describe("delete file", function () {
		it("deletes a file correctly", function () {
			return aws.deleteFile("0000d213816abba584714c0a", "users/0000d213816abba584714c0a/example.jpg").then(res => {
				expect(res).to.not.be.undefined;
				expect(res.Deleted).to.have.lengthOf(1);
				expect(res.Deleted[0].Key).to.equal("users/0000d213816abba584714c0a/example.jpg");
				return;
			});
		});

		xit("deletes a folder correctly", function () {
			return aws.deleteDirectory("0000d213816abba584714c0a", "users/0000d213816abba584714c0a/folderToBeDeleted/")
				.then(res => {
				expect(res).to.not.be.undefined;
				expect(res.Deleted).to.have.lengthOf(2);
				expect(res.Deleted[0].Key).to.equal("testFile");
				expect(res.Deleted[1].Key).to.equal(".scfake");
			});
		});

		it("rejects with missing parameters", function () {
			return aws.deleteFile()
				.then(res => chai.fail('it succeeded', 'should have returned an error'))
				.catch(err => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
				return;
			});
		});
	});

	describe("generate signed url", function () {
		it("creates valid signed url", function () {
			return aws.generateSignedUrl({
					userId: "0000d213816abba584714c0a",
					flatFileName: "users/0000d213816abba584714c0a/example.jpg",
					fileType: "text/plain",
				}).then(res => {
					expect(res).to.not.be.undefined;
					expect(res).to.be.equal("successfully created signed url");
				return;
			});
		});

		it("rejects with missing parameters", function () {
			return aws.generateSignedUrl({})
				.then(() => chai.fail('it succeeded', 'should have returned an error'))
				.catch(err => {
					expect(err).to.not.be.undefined;
					expect(err.code).to.equal(400);
					return;
				});
		});
	});

	describe.skip("create directory", function () {
		it("creates a new directory", function () {
			return aws.createDirectory("0000d213816abba584714c0a", "users/0000d213816abba584714c0a/test/").then(res => {
				expect(res).to.not.be.undefined;
				expect(res).to.be.equal("successfully put object");
				return;
			});
		});

		it("rejects with missing parameters", function () {
			return aws.createDirectory()
				.then(res => chai.fail('it succeeded', 'should have returned an error'))
				.catch(err => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
				return;
			});
		});
	});
});
