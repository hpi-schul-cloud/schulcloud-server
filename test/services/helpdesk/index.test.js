'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const helpdeskService = app.service('helpdesk');
const chai = require('chai');
const expect = require('chai').expect;
const logger = app.logger;

describe('helpdesk service', function() {

	const testProblem =
		{
			type: 'contactAdmin',
			_id: '5836bb5664582c35df3bc214',
			subject: 'Dies ist ein Titel',
			currentState: 'Dies ist der CurrentState',
			targetState: 'Dies ist der TargetState',
			category: 'dashboard',
			schoolId: '5836bb5664582c35df3bc000'
		};


	before(function (done) {
		this.timeout(10000);
		helpdeskService.create(testProblem)
			.then(result => {
				done();
			});
	});

	after(function(done) {
		helpdeskService.remove(testProblem)
			.then(result => {
				done();
			}).catch((error) => {
				logger.info('Could not remove: ' + error);
				done();
			});
	});

	it('registered the helpdesk service', () => {
		assert.ok(helpdeskService);
	});

	it('POST /helpdesk to admin with valid data', () => {

		let postBody = {
			type: 'contactAdmin',
			subject: 'Dies ist ein Titel 2',
			currentState: 'Dies ist der CurrentState',
			targetState: 'Dies ist der TargetState',
			category: 'dashboard',
			schoolId: '5836bb5664582c35df3bc000'
		};

		return helpdeskService.create(postBody, { payload: {userId: '0000d213816abba584714c0a'}})
			.then(result => {
				expect(result.subject).to.equal('Dies ist ein Titel 2');
				expect(result.currentState).to.equal('Dies ist der CurrentState');
				expect(result.targetState).to.equal('Dies ist der TargetState');
				expect(result.category).to.equal('dashboard');
			}
		);
	});

	it('POST /helpdesk to admin without schoolId', () => {

		let postBody = {
			type: 'contactAdmin',
			subject: 'Dies ist ein Titel 3',
			currentState: 'Dies ist der CurrentState 2',
			targetState: 'Dies ist der TargetState 2',
			category: 'dashboard'
		};

		helpdeskService.create(postBody, { payload: {userId: '0000d213816abba584714c0a'}})
			.catch(err => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
			}
		);
	});

	it('POST /helpdesk to admin without data', () => {

		let postBody = {
			type: 'contactAdmin',
			subject: 'Dies ist ein Titel 3',
			category: 'dashboard',
			schoolId: '5836bb5664582c35df3bc000'
		};

		helpdeskService.create(postBody, { payload: {userId: '0000d213816abba584714c0a'}})
			.catch(err => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
			}
		);
	});

	it('POST /helpdesk to schoolcloud with problem, valid data', () => {

		let postBody = {
			type: 'contactHPI',
			subject: 'Dies ist ein Titel 4',
			currentState: 'Dies ist der CurrentState 2',
			targetState: 'Dies ist der TargetState 2',
			category: 'dashboard'
		};

		helpdeskService.create(postBody, { payload: {userId: '0000d213816abba584714c0a'}})
			.then (result => {
				expect(result).to.equal({});
			}
		);
	});

	it('POST /helpdesk to schoolcloud with feedback, valid data', () => {

		let postBody = {
			type: 'contactHPI',
			subject: 'Dies ist ein Titel 4',
			role: 'Meine Rolle',
			desire: 'Dies ist Desire 1',
			benefit: 'Dies ist Benefit 1',
			acceptanceCriteria:'Dies sind acceptanceCriteria',
			category: 'dashboard'
		};

		helpdeskService.create(postBody, { payload: {userId: '0000d213816abba584714c0a'}})
			.then (result => {
				expect(result).to.equal({});
			}
		);
	});

	it('POST /helpdesk to schoolcloud without data', () => {

		let postBody = {
			type: 'contactHPI',
			subject: 'Dies ist ein Titel 4',
			category: 'dashboard'
		};

		helpdeskService.create(postBody, { payload: {userId: '0000d213816abba584714c0a'}})
			.catch(err => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
			}
		);
	});
});

