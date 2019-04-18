const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = require('chai');
const mockery = require('mockery');
const winston = require('winston');
const mongoose = require('mongoose');
const mockAws = require('./s3.mock');
const user = require('../../../../src/services/user/model');
const app = require('../../../../src/app');

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
        mockery.registerMock('../../../../config/secrets.json', {
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

    describe.skip('getFiles', () => {
        it('gets all stored files for one user', () => aws.getFiles('0000d213816abba584714c0a', 'users/0000d213816abba584714c0a').then((res) => {
            expect(res).to.not.be.undefined;
            expect(res.files.length).to.be.equal(1);
            expect(res.directories.length).to.be.equal(0);
        }));

        it('rejects with missing parameters', () => aws.getFiles()
            .then(res => chai.fail('it succeeded', 'should have returned an error'))
            .catch((err) => {
                expect(err).to.not.be.undefined;
                expect(err.code).to.equal(400);
            }));

        it('rejects with no permissions for user', () => aws.getFiles('0000d213816abba584714c0a', 'users/0000d213816abba584714123').then(
            res => chai.fail('it succeeded', 'should have returned an error'),
            (err) => {
                expect(err).to.not.be.undefined;
                expect(err.code).to.equal(403);
                expect(err.message).to.contain("You don't have permissions");
            },
        ));

        it('rejects with no permissions for course', () => aws.getFiles('0000d213816abba584714c0a', 'courses/0000d213816abba584714123').then(
            res => chai.fail('it succeeded', 'should have returned an error'),
            (err) => {
                expect(err).to.not.be.undefined;
                expect(err.message).to.contain("You don't have permissions");
                expect(err.code).to.equal(403);
            },
        ));

        it('rejects with no permissions for class', () => aws.getFiles('0000d213816abba584714c0a', 'classes/0000d213816abba584714123').then(
            res => chai.fail('it succeeded', 'should have returned an error'),
            (err) => {
                expect(err).to.not.be.undefined;
                expect(err.message).to.contain("You don't have permissions");
                expect(err.code).to.equal(403);
            },
        ));
    });

    describe('delete file', () => {
        it('deletes a file correctly', () => aws.deleteFile('0000d213816abba584714c0a', 'users/0000d213816abba584714c0a/example.jpg').then((res) => {
            expect(res).to.not.be.undefined;
            expect(res.Deleted).to.have.lengthOf(1);
            expect(res.Deleted[0].Key).to.equal('users/0000d213816abba584714c0a/example.jpg');
        }));

        xit('deletes a folder correctly', () => aws.deleteDirectory('0000d213816abba584714c0a', 'users/0000d213816abba584714c0a/folderToBeDeleted/')
            .then((res) => {
                expect(res).to.not.be.undefined;
                expect(res.Deleted).to.have.lengthOf(2);
                expect(res.Deleted[0].Key).to.equal('testFile');
                expect(res.Deleted[1].Key).to.equal('.scfake');
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

    describe.skip('create directory', () => {
        it('creates a new directory', () => aws.createDirectory('0000d213816abba584714c0a', 'users/0000d213816abba584714c0a/test/').then((res) => {
            expect(res).to.not.be.undefined;
            expect(res).to.be.equal('successfully put object');
        }));

        it('rejects with missing parameters', () => aws.createDirectory()
            .then(res => chai.fail('it succeeded', 'should have returned an error'))
            .catch((err) => {
                expect(err).to.not.be.undefined;
                expect(err.code).to.equal(400);
            }));
    });
});
