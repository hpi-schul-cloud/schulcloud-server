const assert = require('assert');
const chai = require('chai');
const logger = require('../src/logger/index');
const { ObjectId } = require('mongoose').Types;

const { expect } = chai;

const app = require('../src/app');
const { cleanup, createTestUser } = require('./services/helpers/testObjects')(app);

describe('Sanitization Hook', () => {
	let newsService;
	let helpdeskService;
	let courseService;
	let lessonService;

	let currentUsedId;
	let currentLessonId = null;

	before((done) => {
		newsService = app.service('newsModel');
		helpdeskService = app.service('helpdesk');
		courseService = app.service('courses');
		lessonService = app.service('lessons');
		done();
	});

	after((done) => {
		done();
	});

	it('registered the news service (Sanitization)', (done) => {
		assert.ok(newsService);
		done();
	});

	it('POST /news (Sanitization)', () => {
		const postBody = {
			schoolId: '0000d186816abba584714c5f',
			title: '<script>alert("test");</script>SanitizationTest äöüß§$%/()=',
			content: '<p>SanitizationTest<script>alert("test);</script>'
					+ '<a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
		};

		return newsService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } })
			.then((result) => {
				currentUsedId = result._id;
				expect(result.title).to.equal('SanitizationTest äöüß§$%/()=');
				expect(result.content).to.equal('<p>SanitizationTest<a>SanitizationTest</a></p>äöüß§$%/()=');
			});
	});

	it('POST FAIL /news (Sanitization)', () => {
		const postBody = {
			schoolId: '0000d186816abba584714c5f',
			title: '<script>alert("test");</script><b></b><i></i><img src="bla" />',
			content: 'a',
		};

		return newsService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } })
			.catch((exception) => {
				expect(exception).to.not.be.undefined;
				expect(exception.code).to.equal(400);
				expect(exception.message).to.equal('news validation failed: title: Path `title` is required.');
			});
	});

	it('DELETE /news (Sanitization)',
		() => newsService.remove(currentUsedId, { payload: { userId: '0000d213816abba584714c0a' } }).then((result) => {
			expect(result).to.not.be.undefined;
			expect(result.title).to.equal('SanitizationTest äöüß§$%/()=');
		}));

	it('registered the helpdesk service (Sanitization)', (done) => {
		assert.ok(helpdeskService);
		done();
	});

	it('POST /helpdesk (Sanitization)', () => {
		const postBody = {
			subject: '<script>alert("test");</script>SanitizationTest äöüß§$%/()=',
			type: 'problem',
			currentState: '<p>SanitizationTest<script>alert("test);</script>'
						+ '<a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			targetState: '<p>SanitizationTest<script>alert("test);</script>'
						+ '<a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			category: 'dashboard',
			schoolId: '0000d186816abba584714c5f',
		};

		return helpdeskService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } })
			.then((result) => {
				currentUsedId = result._id;
				expect(result.subject).to.equal('SanitizationTest äöüß§$%/()=');
				expect(result.currentState).to.equal('SanitizationTestSanitizationTestäöüß§$%/()=');
				expect(result.targetState).to.equal('SanitizationTestSanitizationTestäöüß§$%/()=');
			});
	});

	it('POST FAIL /helpdesk (Sanitization)', () => {
		const postBody = {
			subject: '<script>alert("test");</script><b></b><i></i><img src="bla" />',
			type: 'problem',
			currentState: '<p>SanitizationTest<script>alert("test);</script>'
						+ '<a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			targetState: '<p>SanitizationTest<script>alert("test);</script>'
						+ '<a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			category: 'dashboard',
			schoolId: '0000d186816abba584714c5f',
		};

		return helpdeskService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } })
			.catch((exception) => {
				expect(exception).to.not.be.undefined;
				expect(exception.code).to.equal(400);
				expect(exception.message).to.equal('problem validation failed: subject: Path `subject` is required.');
			});
	});

	it('DELETE /helpdesk (Sanitization)',
		() => helpdeskService.remove(currentUsedId, { payload: { userId: '0000d213816abba584714c0a' } })
			.then((result) => {
				expect(result).to.not.be.undefined;
				expect(result.subject).to.equal('SanitizationTest äöüß§$%/()=');
			}));

	it('registered the courses service (Sanitization)', (done) => {
		assert.ok(courseService);
		assert.ok(lessonService);
		done();
	});

	it('POST /courses and /lessons (Sanitization)', () => {
		const postBody = {
			name: '<script>alert("test");</script>SanitizationTest äöüß§$%/()=',
			description: '<p>SanitizationTest<script>alert("test);</script>'
						+ '<a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			color: '#d32f22',
			teacherIds: ['0000d213816abba584714c0a'],
			schoolId: '0000d186816abba584714c5f',
		};

		return courseService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } })
			.then((result) => {
				currentUsedId = result._id;
				expect(result.name).to.equal('SanitizationTest äöüß§$%/()=');
				expect(result.description).to.equal('SanitizationTestSanitizationTestäöüß§$%/()=');
			});
	});

	it('POST FAIL /courses (Sanitization)', () => {
		const postBody = {
			name: '<script>alert("test");</script><b></b><i></i><img src="bla" />',
			description: '<p>SanitizationTest<script>alert("test);</script>'
						+ '<a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			color: '#d32f22',
			teacherIds: ['0000d213816abba584714c0a'],
			schoolId: '0000d186816abba584714c5f',
		};

		return courseService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } })
			.catch((exception) => {
				expect(exception).to.not.be.undefined;
				expect(exception.code).to.equal(400);
				expect(exception.message).to.equal('course validation failed: name: Path `name` is required.');
			});
	});

	it('POST /lessons (Sanitization)', () => {
		const postBody = {
			courseId: currentUsedId,
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

		return lessonService.create(postBody, { account: { userId: '0000d213816abba584714c0a' } })
			.then((lresult) => {
				currentLessonId = lresult._id;
				expect(lresult.name).to.equal('SanitizationTest äöüß§$%/()=');
				expect(lresult.contents[0].content.text)
					.to.equal('<p>SanitizationTest<a>SanitizationTest</a></p>äöüß§$%/()=');
			});
	});

	it('POST FAIL /lessons (Sanitization)', () => {
		const postBody = {
			courseId: currentUsedId,
			name: '<script>alert("test");</script><b></b><i></i><img src="bla" />',
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

		return lessonService.create(postBody, { account: { userId: '0000d213816abba584714c0a' } })
			.catch((exception) => {
				expect(exception).to.not.be.undefined;
				expect(exception.code).to.equal(400);
				expect(exception.message).to.equal('lesson validation failed: name: Path `name` is required.');
			});
	});

	it('DELETE /lessons (Sanitization)',
		() => lessonService.remove(currentLessonId, { payload: { userId: '0000d213816abba584714c0a' } })
			.then((result) => {
				expect(result).to.not.be.undefined;
				expect(result.name).to.equal('SanitizationTest äöüß§$%/()=');
			}));

	it('DELETE /courses (Sanitization)',
		() => courseService.remove(currentUsedId, { payload: { userId: '0000d213816abba584714c0a' } })
			.then((result) => {
				expect(result).to.not.be.undefined;
				expect(result.name).to.equal('SanitizationTest äöüß§$%/()=');
			}));
});

describe('removeObjectIdInData hook', () => {
	let userId;
	let userServices;
	let userObject;
	let _id;

	before((done) => {
		userServices = app.service('users');
		_id = ObjectId();
		userObject = {
			_id,
			firstName: 'Max',
			lastName: 'Mustermann',
			email: `max${Date.now()}@mustermann.de`,
			schoolId: '584ad186816abba584714c94',
			roles: [],
		};
		done();
	});

	after(async () => {
		await cleanup();
	});

	it('Should work by create', async () => {
		const user = await createTestUser(userObject)
			.then((res) => {
				userId = res._id;
				return res;
			})
			.catch((err) => {
				logger.warning('Can not create test User.', err);
			});

		expect(_id).to.not.equal(user._id.toString());
	});

	it('Should work by patch', async () => {
		const user = await userServices.patch(userId, { _id });
		expect(_id).to.not.equal(user._id.toString());
	});

	it('Should work by update', async () => {
		const user = await userServices.update(userId, userObject);
		expect(_id).to.not.equal(user._id.toString());
	});
});
