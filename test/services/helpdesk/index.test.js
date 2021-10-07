// eslint-disable no-process-env
const assert = require('assert');
const { expect } = require('chai');
const sinon = require('sinon');
const appPromise = require('../../../src/app');
const { Configuration } = require('@hpi-schul-cloud/commons');

describe('helpdesk service', function test() {
	this.timeout(10000);
	let app;
	let helpdeskService;
	let logger;
	let originalMailService;

	const testProblem = {
		type: 'contactAdmin',
		_id: '5836bb5664582c35df3bc214',
		subject: 'Dies ist ein Titel',
		currentState: 'Dies ist der CurrentState',
		targetState: 'Dies ist der TargetState',
		schoolId: '5836bb5664582c35df3bc000',
	};

	function MockMailService() {
		return {
			create: sinon.fake.returns(Promise.resolve()),
		};
	}

	before(async () => {
		app = await appPromise;
		originalMailService = app.service('mails');
		helpdeskService = app.service('helpdesk');
		({ logger } = app);
		await helpdeskService.create(testProblem);
	});

	after((done) => {
		app.use('/mails', originalMailService);
		helpdeskService
			.remove(testProblem)
			.then((result) => {
				done();
			})
			.catch((error) => {
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

		return helpdeskService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } }).then((result) => {
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

		helpdeskService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } }).catch((err) => {
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
		helpdeskService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } }).catch((err) => {
			expect(err).to.not.be.undefined;
			expect(err.code).to.equal(400);
		});
	});

	it('POST /helpdesk to schoolcloud with problem, valid data', () => {
		const postBody = {
			type: 'contactHPI',
			subject: 'Dies ist ein Titel 4',
			problemDescription: 'Dies ist die Problembeschreibung 1',
			replyEmail: 'test@mail.de',
		};
		helpdeskService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } }).then((result) => {
			expect(result).to.equal({});
			expect(result.replyTo).to.equal('test@mail.de');
		});
	});

	it('POST /helpdesk to schoolcloud with problem and without theme should pass proper email in argument', async () => {
		const postBody = {
			type: 'contactHPI',
			supportType: 'problem',
			subject: 'Dies ist ein Titel 4',
			problemDescription: 'Dies ist die Problembeschreibung 1',
			replyEmail: 'test@mail.de',
		};
		const mailService = new MockMailService();
		app.use('/mails', mailService);
		await helpdeskService.create(postBody, { account: { userId: '0000d213816abba584714c0a' } });
		expect(mailService.create.firstArg.email).to.equal('ticketsystem@schul-cloud.org');
	});

	it('POST /helpdesk to schoolcloud with problem should be send to specified in configuration email address if supportType is specified', async () => {
		const postBody = {
			type: 'contactHPI',
			supportType: 'problem',
			subject: 'Dies ist ein Titel 4',
			problemDescription: 'Dies ist die Problembeschreibung 1',
			replyEmail: 'test@mail.de',
		};
		const mailService = new MockMailService();
		app.use('/mails', mailService);
		const tempScTheme = Configuration.get('SUPPORT_PROBLEM_EMAIL_ADDRESS');
		Configuration.set('SUPPORT_PROBLEM_EMAIL_ADDRESS', 'nbc-support@netz-21.de');
		await helpdeskService.create(postBody, { account: { userId: '0000d213816abba584714c0a' } });
		expect(mailService.create.firstArg.email).to.equal('nbc-support@netz-21.de');
		Configuration.set('SUPPORT_PROBLEM_EMAIL_ADDRESS', tempScTheme);
	});

	it('POST /helpdesk to schoolcloud with wish should be send to specified in configuration email address if supportType is specified', async () => {
		const postBody = {
			type: 'contactHPI',
			supportType: 'wish',
			subject: 'Dies ist ein Titel 4',
			problemDescription: 'Dies ist die Problembeschreibung 1',
			replyEmail: 'test@mail.de',
		};
		const mailService = new MockMailService();
		app.use('/mails', mailService);
		const tempScTheme = Configuration.get('SUPPORT_WISH_EMAIL_ADDRESS');
		Configuration.set('SUPPORT_WISH_EMAIL_ADDRESS', 'nbc-wunsch@netz-21.de');
		await helpdeskService.create(postBody, { account: { userId: '0000d213816abba584714c0a' } });
		expect(mailService.create.firstArg.email).to.equal('nbc-wunsch@netz-21.de');
		Configuration.set('SUPPORT_WISH_EMAIL_ADDRESS', tempScTheme);
	});

	it.only('POST /helpdesk to schoolcloud with wish should be send additionally to default email if federal state email is provided and supportType is specified', async () => {
		const postBody = {
			type: 'contactHPI',
			supportType: 'wish',
			subject: 'Dies ist ein Titel 5',
			problemDescription: 'Dies ist die Problembeschreibung 2',
			replyEmail: 'test@mail.de',
		};
		const mailService = new MockMailService();
		app.use('/mails', mailService);
		const tempScTheme = Configuration.get('SUPPORT_WISH_EMAIL_ADDRESS');
		Configuration.set('SUPPORT_WISH_EMAIL_ADDRESS', 'nbc-wunsch@netz-21.de');
		await helpdeskService.create(postBody, { account: { userId: '0000d213816abba584714c0a' } });
		expect(mailService.create.firstArg.email).to.equal('nbc-wunsch@netz-21.de');
		expect(mailService.create.emails).to.contain('ticketsystem@schul-cloud.org');
		Configuration.set('SUPPORT_WISH_EMAIL_ADDRESS', tempScTheme);
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
		helpdeskService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } }).then((result) => {
			expect(result).to.equal({});
			expect(result.replyTo).to.equal('test@mail.de');
		});
	});

	it('POST /helpdesk to schoolcloud without data', () => {
		const postBody = {
			type: 'contactHPI',
			subject: 'Dies ist ein Titel 4',
		};
		helpdeskService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } }).catch((err) => {
			expect(err).to.not.be.undefined;
			expect(err.code).to.equal(400);
		});
	});
});
