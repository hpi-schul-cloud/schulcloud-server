const assert = require('assert');
const { expect } = require('chai');
const app = require('../../../src/app');

const helpdeskService = app.service('helpdesk');

const { logger } = app;

describe('helpdesk service', () => {
	const testProblem = {
		type: 'contactAdmin',
		_id: '5836bb5664582c35df3bc214',
		subject: 'Dies ist ein Titel',
		currentState: 'Dies ist der CurrentState',
		targetState: 'Dies ist der TargetState',
		schoolId: '5836bb5664582c35df3bc000',
	};


	before(function (done) {
		this.timeout(10000);
		helpdeskService.create(testProblem)
			.then((result) => {
				done();
			});
	});

	after((done) => {
		helpdeskService.remove(testProblem)
			.then((result) => {
				done();
			}).catch((error) => {
				logger.info(`Could not remove: ${error}`);
				done();
			});
	});

	it('registered the helpdesk service', () => {
		assert.ok(helpdeskService);
	});

	it('POST /helpdesk to admin with valid data', () => {
		const postBody = {
			type: 'contactAdmin',
			subject: 'Dies ist ein Titel 2',
			currentState: 'Dies ist der CurrentState',
			targetState: 'Dies ist der TargetState',
			schoolId: '5836bb5664582c35df3bc000',
		};

		return helpdeskService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } })
			.then((result) => {
				expect(result.subject).to.equal('Dies ist ein Titel 2');
				expect(result.currentState).to.equal('Dies ist der CurrentState');
				expect(result.targetState).to.equal('Dies ist der TargetState');
			});
	});

	it('POST /helpdesk to admin without schoolId', () => {
		const postBody = {
			type: 'contactAdmin',
			subject: 'Dies ist ein Titel 3',
			currentState: 'Dies ist der CurrentState 2',
			targetState: 'Dies ist der TargetState 2',
		};

		helpdeskService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } })
			.catch((err) => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
			});
	});

	it('POST /helpdesk to admin without data', () => {
		const postBody = {
			type: 'contactAdmin',
			subject: 'Dies ist ein Titel 3',
			schoolId: '5836bb5664582c35df3bc000',
		};
		helpdeskService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } })
			.catch((err) => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
			});
	});

	it('POST /helpdesk to schoolcloud with problem, valid data', () => {
		const postBody = {
			type: 'contactHPI',
			subject: 'Dies ist ein Titel 4',
			currentState: 'Dies ist der CurrentState 2',
			targetState: 'Dies ist der TargetState 2',
			replyEmail: 'test@mail.de',
		};
		helpdeskService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } })
			.then((result) => {
				expect(result).to.equal({});
				expect(result.replyTo).to.equal('test@mail.de');
			});
	});

	it('POST /helpdesk to schoolcloud with feedback, valid data', () => {
		const postBody = {
			type: 'contactHPI',
			subject: 'Dies ist ein Titel 4',
			role: 'Meine Rolle',
			desire: 'Dies ist Desire 1',
			benefit: 'Dies ist Benefit 1',
			acceptanceCriteria: 'Dies sind acceptanceCriteria',
			replyEmail: 'test@mail.de',
		};
		helpdeskService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } })
			.then((result) => {
				expect(result).to.equal({});
				expect(result.replyTo).to.equal('test@mail.de');
			});
	});

	it('POST /helpdesk to schoolcloud without data', () => {
		const postBody = {
			type: 'contactHPI',
			subject: 'Dies ist ein Titel 4',
		};
		helpdeskService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } })
			.catch((err) => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
			});
	});
});
