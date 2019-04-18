const assert = require('assert');
const chai = require('chai');

const { expect } = chai;
const promisify = require('es6-promisify');
const fs = require('fs');
const path = require('path');

describe('Sanitization Service', function () {
	let newsService; let helpdeskService; let courseService; let lessonService; let app; let currentUsedId; let
		currentLessonId = null;

	before((done) => {
		this.timeout(10000); // for slow require(app) call
		app = require('../src/app');
		app.setup();
		newsService = app.service('news');
		helpdeskService = app.service('helpdesk');
		courseService = app.service('courses');
		lessonService = app.service('lessons');
		done();
	});

	after((done) => {
		done();
	});

	// ###################################

	it('registered the news service (Sanitization)', (done) => {
		assert.ok(newsService);
		done();
	});

	it('POST /news (Sanitization)', () => {
		const postBody = {
			schoolId: '0000d186816abba584714c5f',
			// "schoolId": "5836bb5664582c35df3bc000",
			title: '<script>alert("test");</script>SanitizationTest äöüß§$%/()=',
			content: '<p>SanitizationTest<script>alert("test);</script><a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
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
			// "schoolId": "5836bb5664582c35df3bc000",
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

	it('DELETE /news (Sanitization)', () => newsService.remove(currentUsedId, { payload: { userId: '0000d213816abba584714c0a' } }).then((result) => {
		expect(result).to.not.be.undefined;
		expect(result.title).to.equal('SanitizationTest äöüß§$%/()=');
	}));

	// ###################################

	it('registered the helpdesk service (Sanitization)', (done) => {
		assert.ok(helpdeskService);
		done();
	});

	it('POST /helpdesk (Sanitization)', () => {
		const postBody = {
			subject: '<script>alert("test");</script>SanitizationTest äöüß§$%/()=',
			type: 'problem',
			currentState: '<p>SanitizationTest<script>alert("test);</script><a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			targetState: '<p>SanitizationTest<script>alert("test);</script><a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			category: 'dashboard',
			schoolId: '0000d186816abba584714c5f',
			// schoolId: '5836bb5664582c35df3bc000'
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
			currentState: '<p>SanitizationTest<script>alert("test);</script><a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			targetState: '<p>SanitizationTest<script>alert("test);</script><a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			category: 'dashboard',
			schoolId: '0000d186816abba584714c5f',
			// schoolId: '5836bb5664582c35df3bc000'
		};

		return helpdeskService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } })
			.catch((exception) => {
				expect(exception).to.not.be.undefined;
				expect(exception.code).to.equal(400);
				expect(exception.message).to.equal('problem validation failed: subject: Path `subject` is required.');
			});
	});

	it('DELETE /helpdesk (Sanitization)', () => helpdeskService.remove(currentUsedId, { payload: { userId: '0000d213816abba584714c0a' } })
		.then((result) => {
			expect(result).to.not.be.undefined;
			expect(result.subject).to.equal('SanitizationTest äöüß§$%/()=');
		}));

	// ###################################

	it('registered the courses service (Sanitization)', (done) => {
		assert.ok(courseService);
		assert.ok(lessonService);
		done();
	});

	it('POST /courses and /lessons (Sanitization)', () => {
		const postBody = {
			name: '<script>alert("test");</script>SanitizationTest äöüß§$%/()=',
			description: '<p>SanitizationTest<script>alert("test);</script><a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			color: '#d32f22',
			teacherIds: ['0000d213816abba584714c0a'],
			schoolId: '0000d186816abba584714c5f',
			// schoolId: '5836bb5664582c35df3bc000'
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
			description: '<p>SanitizationTest<script>alert("test);</script><a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			color: '#d32f22',
			teacherIds: ['0000d213816abba584714c0a'],
			schoolId: '0000d186816abba584714c5f',
			// schoolId: '5836bb5664582c35df3bc000'
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
						text: '<p>SanitizationTest<script>alert("test);</script><a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
					},
				},
			],
			schoolId: '0000d186816abba584714c5f',
			// schoolId: '5836bb5664582c35df3bc000'
			position: 0,
			materialIds: [],
		};

		return lessonService.create(postBody, { account: { userId: '0000d213816abba584714c0a' } })
			.then((lresult) => {
				currentLessonId = lresult._id;
				expect(lresult.name).to.equal('SanitizationTest äöüß§$%/()=');
				expect(lresult.contents[0].content.text).to.equal('<p>SanitizationTest<a>SanitizationTest</a></p>äöüß§$%/()=');
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
						text: '<p>SanitizationTest<script>alert("test);</script><a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
					},
				},
			],
			schoolId: '0000d186816abba584714c5f',
			// schoolId: '5836bb5664582c35df3bc000'
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

	it('DELETE /lessons (Sanitization)', () => lessonService.remove(currentLessonId, { payload: { userId: '0000d213816abba584714c0a' } })
		.then((result) => {
			expect(result).to.not.be.undefined;
			expect(result.name).to.equal('SanitizationTest äöüß§$%/()=');
		}));

	it('DELETE /courses (Sanitization)', () => courseService.remove(currentUsedId, { payload: { userId: '0000d213816abba584714c0a' } })
		.then((result) => {
			expect(result).to.not.be.undefined;
			expect(result.name).to.equal('SanitizationTest äöüß§$%/()=');
		}));
});
