const chai = require('chai');
const { ObjectId } = require('mongoose').Types;
const mockery = require('mockery');
const commons = require('@schul-cloud/commons');

const { Configuration } = commons; // separated from require, mocked in tests

const { expect } = chai;

const app = require('../src/app');
const { sanitizeDataHook } = require('../src/app.hooks');
const { sanitizeHtml: { sanitizeDeep } } = require('../src/utils');
const { cleanup, createTestUser, generateRequestParamsFromUser } = require('./services/helpers/testObjects')(app);
const redisMock = require('./utils/redis/redisMock');

describe('Sanitization Hook', () => {
	// TODO: Test if it work for create, post and update
	it('hook ignor authentication route', () => {
		const testString = '<h1> test </h1>';
		const context = {
			path: 'authentication',
			data: { testString },
		};
		const result = sanitizeDataHook(context);
		expect(result.data).to.not.be.an('undefined');
		expect(result.data.testString).to.equal(testString);
	});
	// TODO: Map test to generic output for sanitizeConst keys, paths, saveKeys
	it('sanitize in news, example', () => {
		const data = {
			schoolId: '0000d186816abba584714c5f',
			title: '<script>alert("test");</script>SanitizationTest äöüß§$%/()=',
			content: '<p>SanitizationTest<script>alert("test);</script>'
					+ '<a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
		};

		const path = 'news';
		const result = sanitizeDeep(data, path);
		expect(result.schoolId).to.equal('0000d186816abba584714c5f');
		expect(result.title).to.equal('SanitizationTest äöüß§$%/()=');
		expect(result.content).to.equal('<p>SanitizationTest<a>SanitizationTest</a></p>äöüß§$%/()=');
	});

	it('sanitize in news, example 2', () => {
		const data = {
			schoolId: '0000d186816abba584714c5f',
			title: '<script>alert("test");</script><b></b><i></i><img src="bla" />',
			content: 'a',
		};

		const path = 'news';
		const result = sanitizeDeep(data, path);

		expect(result.schoolId).to.equal('0000d186816abba584714c5f');
		expect(result.title).to.equal(''); // filter all
		expect(result.content).to.equal('a');
	});

	it('sanitize in helpdesk, example 1', () => {
		const data = {
			subject: '<script>alert("test");</script>SanitizationTest äöüß§$%/()=',
			type: 'problem',
			currentState: '<p>SanitizationTest<script>alert("test);</script>'
						+ '<a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			targetState: '<p>SanitizationTest<script>alert("test);</script>'
						+ '<a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			category: 'dashboard',
			schoolId: '0000d186816abba584714c5f',
		};

		const path = 'helpdesk';
		const result = sanitizeDeep(data, path);

		expect(result.subject).to.equal('SanitizationTest äöüß§$%/()=');
		expect(result.type).to.equal('problem');
		expect(result.currentState).to.equal('SanitizationTestSanitizationTestäöüß§$%/()=');
		expect(result.targetState).to.equal('SanitizationTestSanitizationTestäöüß§$%/()=');
		expect(result.category).to.equal('dashboard');
		expect(result.schoolId).to.equal('0000d186816abba584714c5f');
	});

	it('sanitize in helpdesk, example 2', () => {
		const data = {
			subject: '<script>alert("test");</script><b></b><i></i><img src="bla" />',
		};

		const path = 'helpdesk';
		const result = sanitizeDeep(data, path);

		expect(result.subject).to.equal(''); // filter all
	});

	it('sanitize in course, example 1', () => {
		const data = {
			name: '<script>alert("test");</script>SanitizationTest äöüß§$%/()=',
			description: '<p>SanitizationTest<script>alert("test);</script>'
						+ '<a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			color: '#d32f22',
			teacherIds: ['0000d213816abba584714c0a'],
			schoolId: '0000d186816abba584714c5f',
		};

		const path = 'course';
		const result = sanitizeDeep(data, path);

		expect(result.name).to.equal('SanitizationTest äöüß§$%/()=');
		expect(result.description).to.equal('SanitizationTestSanitizationTestäöüß§$%/()=');
		expect(result.color).to.equal('#d32f22');
		expect(result.teacherIds[0]).to.equal('0000d213816abba584714c0a');
		expect(result.schoolId).to.equal('0000d186816abba584714c5f');
	});

	it('sanitize in course, example 2', () => {
		const data = {
			name: '<script>alert("test");</script><b></b><i></i><img src="bla" />',
		};

		const path = 'course';
		const result = sanitizeDeep(data, path);

		expect(result.name).to.equal(''); // filter all
	});

	it('sanitize in lessons, example 1', () => {
		const data = {
			courseId: '0000d186816abba584714c5d',
			name: '<script>alert("test");</script>SanitizationTest äöüß§$%/()=',
			contents: [
				{
					title: '<script>alert("test");</script>SanitizationTest äöüß§$%/()=',
					hidden: false,
					component: 'text',
					user: '0000d213816abba584714c0a',
					content: {
						text: '<p>SanitizationTest<script>alert("test);</script>'
							+ '<a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
					},
				},
			],
			schoolId: '0000d186816abba584714c5f',
			position: 0,
			materialIds: [],
		};

		const path = 'lessons';
		const result = sanitizeDeep(data, path);

		expect(result.courseId).to.equal('0000d186816abba584714c5d');
		expect(result.name).to.equal('SanitizationTest äöüß§$%/()=');
		expect(result.contents[0].content.text).to.equal('<p>SanitizationTest<a>SanitizationTest</a></p>äöüß§$%/()=');
		expect(result.schoolId).to.equal('0000d186816abba584714c5f');
		expect(result.position).to.equal(0);
		expect(result.materialIds.length).to.equal(0);
	});

	it('sanitize in lessons, example 2', () => {
		const data = {
			name: '<script>alert("test");</script><b></b><i></i><img src="bla" />',
		};

		const path = 'lessons';
		const result = sanitizeDeep(data, path);

		expect(result.name).to.equal('');
	});
});

describe('removeObjectIdInData hook', () => {
	let user;

	before(async () => {
		user = await createTestUser();
	});

	after(async () => {
		await cleanup();
	});

	it('Should work for create', async () => {
		const _id = new ObjectId();
		const newUser = await createTestUser({ _id });
		expect(_id.toString()).to.not.equal(newUser._id.toString());
	});

	it('Should work for patch', async () => {
		const _id = new ObjectId();
		const response = await app.service('users').patch(user._id, { _id });
		expect(_id.toString()).to.not.equal(response._id.toString());
	});

	it('Should work for update', async () => {
		const _id = new ObjectId();
		const response = await app.service('users').update(user._id, {
			_id,
			firstName: 'Max',
			lastName: 'Mustermann',
			email: `max${Date.now()}@mustermann.de`,
			schoolId: '584ad186816abba584714c94',
			roles: [],
		});
		expect(_id.toString()).to.not.equal(response._id.toString());
	});
});

describe('handleAutoLogout hook', () => {
	let fut;
	let redisHelper;
	let configBefore;


	before(async () => {
		configBefore = Configuration.toObject(); // deep copy current config
		Configuration.set('REDIS_URI', '//validHost:6379');
		Configuration.set('JWT_TIMEOUT_SECONDS', 7200);

		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true,
		});
		mockery.registerMock('redis', redisMock);
		mockery.registerMock('@schul-cloud/commons', commons);

		// delete require.cache[require.resolve('../src/utils/redis')];
		/* eslint-disable global-require */
		redisHelper = require('../src/utils/redis');
		fut = require('../src/app.hooks').handleAutoLogout;
		/* eslint-enable global-require */
		redisHelper.initializeRedisClient();
	});

	after(async () => {
		Configuration.parse(configBefore); // reset config to before state
		mockery.deregisterAll();
		mockery.disable();
		await cleanup();
	});

	it.only('whitelisted JWT is accepted and extended', async () => {
		const user = await createTestUser();
		const params = await generateRequestParamsFromUser(user);
		const redisIdentifier = redisHelper.getRedisIdentifier(params.authentication.accessToken);
		await redisHelper.redisSetAsync(redisIdentifier, 'value', 'EX', 1000);
		const result = await fut({ params });
		expect(result).to.not.equal(undefined);
		const ttl = await redisHelper.redisTtlAsync(redisIdentifier);
		expect(ttl).to.be.greaterThan(7000);
	});

	it('not whitelisted JWT is rejected', async () => {
		const user = await createTestUser();
		const params = await generateRequestParamsFromUser(user);
		const redisIdentifier = redisHelper.getRedisIdentifier(params.authentication.accessToken);
		await redisHelper.redisDelAsync(redisIdentifier);
		try {
			await fut({
				params, app: { Config: { data: { REDIS_URI: '//validHost:6379', JWT_TIMEOUT_SECONDS: 7200 } } },
			});
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(401);
			expect(err.message).to.equal('Session was expired due to inactivity - autologout.');
		}
	});

	it('JWT_WHITELIST_ACCEPT_ALL can be set to not auto-logout users', async () => {
		const user = await createTestUser();
		const params = await generateRequestParamsFromUser(user);
		const redisIdentifier = redisHelper.getRedisIdentifier(params.authentication.accessToken);
		await redisHelper.redisDelAsync(redisIdentifier);
		const result = await fut({ params });
		expect(result).to.have.property('params');
		expect(result).to.have.property('app');
	});

	it('passes through requests without authorisation', async () => {
		const response = await fut({ params: {} });
		expect(response).to.not.eq(undefined);
	});
});
