import { expect } from 'chai';
import mongooseImport from 'mongoose';
import appPromise from '../src/app';
import { sanitizeDataHook } from '../src/app.hooks';
import utils from '../src/utils';
import testObjectsImport from './services/helpers/testObjects';

const { ObjectId } = mongooseImport.Types;
const {
	sanitizeHtml: { sanitizeDeep },
} = utils;
const { cleanup, createTestUser, generateRequestParamsFromUser, createTestSchool } = testObjectsImport(appPromise);

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

	it('hook sanitizes when "before" type is triggered by checking the existence of "data" property', () => {
		const testString = '<script>alert("test");</script><h1>test</h1>';
		const sanitizedTestString = 'test';
		const context = {
			path: 'not_authentication',
			data: { testString },
			type: 'before',
		};
		const result = sanitizeDataHook(context);
		expect(result.data).to.not.be.an('undefined');
		expect(result.data.testString).to.equal(sanitizedTestString);
		expect(result.result).to.be.an('undefined');
	});

	it('hook sanitizes when it is triggered in "after" type by checking the existence of "result" property', () => {
		const testString = '<script>alert("test");</script><h1>test</h1>';
		const sanitizedTestString = 'test';
		const context = {
			path: 'not_authentication',
			result: { testString },
			type: 'after',
		};
		const result = sanitizeDataHook(context);
		expect(result.result).to.not.be.an('undefined');
		expect(result.result.testString).to.equal(sanitizedTestString);
		expect(result.data).to.be.an('undefined');
	});

	it('hook does not sanitizes when both properties `data` and `results` are empty', () => {
		const testString = '<script>alert("test");</script><h1>test</h1>';
		const context = {
			path: 'not_authentication',
			data: { testString },
		};
		const result = sanitizeDataHook(context);
		expect(result.data.testString).to.equal(testString);
	});

	it('hook does not sanitizes specified safe attributes', () => {
		const testString = '<script>alert("test");</script><h1>test</h1>';
		const sanitizedTestString = 'test';
		const safeAttributes = ['url'];
		const context = {
			path: 'not_authentication',
			safeAttributes,
			result: {
				url: testString,
				dangerousUrl: testString,
			},
		};
		const result = sanitizeDataHook(context);
		expect(result.result.url).to.equal(testString);
		expect(result.result.dangerousUrl).to.equal(sanitizedTestString);
	});

	it('hook does not sanitizes specified attributes', () => {
		const content =
			'<blockquote class="test-class">Cite Block</blockquote>' +
			'<span class="test-class" style="color:#9c27b0">Text color</span>' +
			'<span class="test-class" style="background-color:#cddc39">Text Background</span>' +
			'Tables: <table class="test-class"><th>1</th><th>2</th><tr><td>A</td><td>B</td></tr></table>' +
			// eslint-disable-next-line max-len
			'Video: <video class="test-class" controlslist="nodownload" src="https://www.youtube.com/watch?v=zYo7gLzH8Uk"></video>' +
			// eslint-disable-next-line max-len
			'Audio: <audio class="test-class" controlslist="nodownload" controls="controls" src="https://www.youtube.com/watch?v=zYo7gLzH8Uk"></audio>';
		const data = {
			schoolId: '5f2987e020834114b8efd6f8',
			title: '<script>alert("test");</script>SanitizationTest äöüß§$%/()=',
			content,
		};

		const path = 'news';
		const result = sanitizeDeep(data, path);
		expect(result.schoolId).to.equal('5f2987e020834114b8efd6f8');
		expect(result.title).to.equal('SanitizationTest äöüß§$%/()=');
		expect(result.content).to.equal(content);
	});

	// TODO: Map test to generic output for sanitizeConst keys, paths, saveKeys
	it('sanitize in news, example', () => {
		const data = {
			schoolId: '5f2987e020834114b8efd6f8',
			title: '<script>alert("test");</script>SanitizationTest äöüß§$%/()=',
			content:
				'<p>SanitizationTest<script>alert("test);</script>' +
				'<a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
		};

		const path = 'news';
		const result = sanitizeDeep(data, path);
		expect(result.schoolId).to.equal('5f2987e020834114b8efd6f8');
		expect(result.title).to.equal('SanitizationTest äöüß§$%/()=');
		expect(result.content).to.equal('<p>SanitizationTest<a>SanitizationTest</a></p>äöüß§$%/()=');
	});

	it('sanitize in news, example 2', () => {
		const data = {
			schoolId: '5f2987e020834114b8efd6f8',
			title: '<script>alert("test");</script><b></b><i></i><img src="bla" />',
			content: 'a',
		};

		const path = 'news';
		const result = sanitizeDeep(data, path);

		expect(result.schoolId).to.equal('5f2987e020834114b8efd6f8');
		expect(result.title).to.equal(''); // filter all
		expect(result.content).to.equal('a');
	});

	it('sanitize in helpdesk, example 1', () => {
		const data = {
			subject: '<script>alert("test");</script>SanitizationTest äöüß§$%/()=',
			type: 'problem',
			currentState:
				'<p>SanitizationTest<script>alert("test);</script>' +
				'<a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			targetState:
				'<p>SanitizationTest<script>alert("test);</script>' +
				'<a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			category: 'dashboard',
			schoolId: '5f2987e020834114b8efd6f8',
		};

		const path = 'helpdesk';
		const result = sanitizeDeep(data, path);

		expect(result.subject).to.equal('SanitizationTest äöüß§$%/()=');
		expect(result.type).to.equal('problem');
		expect(result.currentState).to.equal('SanitizationTestSanitizationTestäöüß§$%/()=');
		expect(result.targetState).to.equal('SanitizationTestSanitizationTestäöüß§$%/()=');
		expect(result.category).to.equal('dashboard');
		expect(result.schoolId).to.equal('5f2987e020834114b8efd6f8');
	});

	it('sanitize in helpdesk, example 2', () => {
		const data = {
			subject: '<script>alert("test");</script><b></b><i></i><img src="bla" />',
		};

		const path = 'helpdesk';
		const result = sanitizeDeep(data, path);

		expect(result.subject).to.equal(''); // filter all
	});

	it('sanitize in submissions, avoid img onerror attribute', () => {
		const data = {
			comment: '<img onerror="window.location = \'google.com\'" src="x" />',
		};

		const path = 'submissions';
		const result = sanitizeDeep(data, path);

		expect(result.comment, 'onerror attribute removed from img tag').to.equal('<img src="x" />');
	});

	it('sanitize with encoded entities - html true route', () => {
		const data = {
			comment: '&lt;img onerror="window.location = \'google.com\'" src="x" /&gt;',
		};

		const path = 'submissions';
		const result = sanitizeDeep(data, path);

		expect(result.comment, 'onerror attribute removed from img tag').to.equal('<img src="x" />');
	});

	it('sanitize with encoded entities - html false route', () => {
		const data = {
			comment: '&lt;img onerror="window.location = \'google.com\'" src="x" /&gt;',
		};

		const result = sanitizeDeep(data, '');

		expect(result.comment, 'should removed html').to.equal('');
	});

	it('sanitize with encoded entities  - html true route', () => {
		const data = {
			comment: '&#60;img onerror="window.location = \'google.com\'" src="x" /&#62;',
		};

		const path = 'submissions';
		const result = sanitizeDeep(data, path);

		expect(result.comment, 'onerror attribute removed from img tag').to.equal('<img src="x" />');
	});

	it('sanitize with encoded entities  - html false route', () => {
		const data = {
			comment: '&#60;img onerror="window.location = \'google.com\'" src="x" /&#62;',
		};

		const result = sanitizeDeep(data, '');

		expect(result.comment, 'should removed html').to.equal('');
	});

	it('sanitize with multi encoded entities  - html true route', () => {
		const data = {
			comment: '&#60;<&#60;&lt;img onerror="window.location = \'google.com\'" src="x" /&gt;&#62;>&#62;',
		};

		const path = 'submissions';
		const result = sanitizeDeep(data, path);

		expect(result.comment, 'onerror attribute removed from img tag').to.equal(
			'&lt;&lt;&lt;<img src="x" />&gt;&gt;&gt;'
		);
	});

	it('sanitize with multi encoded entities  - html false route', () => {
		const data = {
			comment: '&#60;<&#60;&#60;img onerror="window.location = \'google.com\'" src="x" /&#62;&#62;>&#62;',
		};

		const result = sanitizeDeep(data, '');

		expect(result.comment, 'should removed html').to.equal('&lt;&lt;&lt;&gt;&gt;&gt;');
	});

	it('sanitize with multi encoded entities and mixed html - html true route', () => {
		const data = {
			// eslint-disable-next-line max-len
			comment:
				'&#60;img onerror="window.location = \'google.com\'" src="x" <&#60;&#60;img onerror="window.location = \'google.com\'" src="x" /&#62;&#62;>/&#62;',
		};

		const path = 'submissions';
		const result = sanitizeDeep(data, path);

		expect(result.comment, 'onerror attribute removed from img tag').to.equal('<img src="x" />&gt;&gt;/&gt;');
	});

	it('sanitize with multi encoded entities and mixed html - html false route', () => {
		const data = {
			// eslint-disable-next-line max-len
			comment:
				'&#60;img onerror="window.location = \'google.com\'" src="x" <&#60;&#60;img onerror="window.location = \'google.com\'" src="x" /&#62;&#62;>/&#62;',
		};

		const result = sanitizeDeep(data, '');

		expect(result.comment, 'onerror attribute removed from img tag').to.equal('&gt;&gt;/&gt;');
	});

	it('sanitize in submissions, avoid js in href', () => {
		const data = {
			comment: '<a href="javascript:alert(1);">Link</a>',
		};

		const path = 'submissions';
		const result = sanitizeDeep(data, path);

		expect(result.comment, 'js removed from a href').to.equal('<a>Link</a>');
	});

	it('sanitize in course, example 1', () => {
		const data = {
			name: '<script>alert("test");</script>SanitizationTest äöüß§$%/()=',
			description:
				'<p>SanitizationTest<script>alert("test);</script>' +
				'<a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			color: '#d32f22',
			teacherIds: ['0000d213816abba584714c0a'],
			schoolId: '5f2987e020834114b8efd6f8',
		};

		const path = 'course';
		const result = sanitizeDeep(data, path);

		expect(result.name).to.equal('SanitizationTest äöüß§$%/()=');
		expect(result.description).to.equal('SanitizationTestSanitizationTestäöüß§$%/()=');
		expect(result.color).to.equal('#d32f22');
		expect(result.teacherIds[0]).to.equal('0000d213816abba584714c0a');
		expect(result.schoolId).to.equal('5f2987e020834114b8efd6f8');
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
						text:
							'<p>SanitizationTest<script>alert("test);</script>' +
							'<a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
					},
				},
			],
			schoolId: '5f2987e020834114b8efd6f8',
			position: 0,
			materialIds: [],
		};

		const path = 'lessons';
		const result = sanitizeDeep(data, path);

		expect(result.courseId).to.equal('0000d186816abba584714c5d');
		expect(result.name).to.equal('SanitizationTest äöüß§$%/()=');
		expect(result.contents[0].content.text).to.equal('<p>SanitizationTest<a>SanitizationTest</a></p>äöüß§$%/()=');
		expect(result.schoolId).to.equal('5f2987e020834114b8efd6f8');
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
	let server;
	let user;
	let app;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
		user = await createTestUser();
	});

	after(async () => {
		await cleanup();
		await server.close();
	});

	it('Should work for create', async () => {
		const { _id: schoolId } = await createTestSchool();
		const admin = await createTestUser({ roles: ['administrator'], schoolId });
		const params = await generateRequestParamsFromUser(admin);
		const _id = new ObjectId();
		const newUser = await app.service('users').create(
			{
				_id,
				firstName: 'Max',
				lastName: 'Mustermann',
				email: `max${Date.now()}@mustermann.de`,
				schoolId,
				roles: [],
			},
			params
		);
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
