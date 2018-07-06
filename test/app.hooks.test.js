'use strict';

const assert = require('assert');
const chai = require('chai');
const expect = chai.expect;
const promisify = require("es6-promisify");
const fs = require("fs");
const path = require("path");

describe('JS Sanitization Service', function () {
	
	let newsService, helpdeskService, courseService, app, currentUsedId = null;
	
	before(done => {
		this.timeout(10000); // for slow require(app) call
		app = require('../src/app');
		app.setup();
		newsService = app.service('news');
		helpdeskService = app.service('helpdesk');
		courseService = app.service('courses');
		done();
	});
	
	after(done => {
		done();
	});
	
	// ###################################
	
	it('registered the news service (JS sanitization)', done => {
		assert.ok(newsService);
		done();
	});

	it('POST /news (JS sanitization)', () => {
		let postBody = {
			"schoolId": "0000d186816abba584714c5f",
			//"schoolId": "5836bb5664582c35df3bc000",
			"title": '<script>alert("test");</script>SanitizationTest äöüß§$%/()=',
			"content": '<p>SanitizationTest<script>alert("test);</script><a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
		};
		
		return newsService.create(postBody, {payload: {userId: '0000d213816abba584714c0a'}})
			.then(news => {
				currentUsedId = news._id;
				expect(news.title).to.equal('SanitizationTest äöüß§$%/()=');
				expect(news.content).to.equal("<p>SanitizationTest<a>SanitizationTest</a></p>äöüß§$%/()=");
			});
	});
	
	it('DELETE /news (JS sanitization)', () => {
		return newsService.remove(currentUsedId, {payload: {userId: '0000d213816abba584714c0a'}}).then(result => {
			expect(result).to.not.be.undefined;
		});
	});
	
	it('POST FAIL /news (JS sanitization)', () => {
		let postBody = {
			"schoolId": "0000d186816abba584714c5f",
			//"schoolId": "5836bb5664582c35df3bc000",
			"title": '<script>alert("test");</script>',
			"content": 'a',
		};
		
		return newsService.create(postBody, {payload: {userId: '0000d213816abba584714c0a'}})
			.catch(exception => {
				expect(exception).to.not.be.undefined;
				assert.equal(exception.code, 400);
				assert.equal(exception.message, "news validation failed: title: Path `title` is required.");
			});
	});
	
	// ###################################
	
	it('registered the helpdesk service (JS sanitization)', done => {
		assert.ok(helpdeskService);
		done();
	});
	
	it('POST /helpdesk (JS sanitization)', () => {
		let postBody = {
			subject: '<script>alert("test");</script>SanitizationTest äöüß§$%/()=',
			currentState: '<p>SanitizationTest<script>alert("test);</script><a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			targetState: '<p>SanitizationTest<script>alert("test);</script><a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			category: 'dashboard',
			schoolId: '0000d186816abba584714c5f'
			//schoolId: '5836bb5664582c35df3bc000'
		};
		
		return helpdeskService.create(postBody, { payload: {userId: '0000d213816abba584714c0a'}})
			.then(result => {
				currentUsedId = result._id;
				expect(result.subject).to.equal('SanitizationTest äöüß§$%/()=');
				expect(result.currentState).to.equal('<p>SanitizationTest<a>SanitizationTest</a></p>äöüß§$%/()=');
				expect(result.targetState).to.equal('<p>SanitizationTest<a>SanitizationTest</a></p>äöüß§$%/()=');
			});
	});
	
	it('DELETE /helpdesk (JS sanitization)', () => {
		return helpdeskService.remove(currentUsedId, {payload: {userId: '0000d213816abba584714c0a'}})
			.then(result => {
				expect(result).to.not.be.undefined;
			});
	});
	
	it('POST FAIL /helpdesk (JS sanitization)', () => {
		let postBody = {
			subject: '<script>alert("test");</script>',
			currentState: '<p>SanitizationTest<script>alert("test);</script><a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			targetState: '<p>SanitizationTest<script>alert("test);</script><a href="javascript:test();">SanitizationTest</a></p>äöüß§$%/()=',
			category: 'dashboard',
			schoolId: '0000d186816abba584714c5f'
			//schoolId: '5836bb5664582c35df3bc000'
		};
		
		return helpdeskService.create(postBody, { payload: {userId: '0000d213816abba584714c0a'}})
			.catch(exception => {
				expect(exception).to.not.be.undefined;
				assert.equal(exception.code, 400);
				assert.equal(exception.message, "problem validation failed: subject: Path `subject` is required.");
			});
	});
	
	// ###################################
	
	it('registered the courses service (JS sanitization)', done => {
		assert.ok(courseService);
		done();
	});
	
	it('POST /courses (JS sanitization)', () => {
		let postBody = {
			name: '<script>alert("test");</script>SanitizationTest',
			description: '<p>SanitizationTest<script>alert("test);</script><a href="javascript:test();">SanitizationTest</a></p>',
			color: '#d32f22',
			teacherIds: [],
			schoolId: '0000d186816abba584714c5f'
			//schoolId: '5836bb5664582c35df3bc000'
		};
		
		return courseService.create(postBody, { payload: {userId: '0000d213816abba584714c0a'}})
			.then(result => {
				currentUsedId = result._id;
				expect(result.name).to.equal('SanitizationTest');
				expect(result.description).to.equal('<p>SanitizationTest<a>SanitizationTest</a></p>');
			});
	});
	
	it('DELETE /courses (JS sanitization)', () => {
		return courseService.remove(currentUsedId, {payload: {userId: '0000d213816abba584714c0a'}})
			.then(result => {
				expect(result).to.not.be.undefined;
			});
	});
	
	it('POST FAIL /courses (JS sanitization)', () => {
		let postBody = {
			name: '<script>alert("test");</script>',
			description: '<p>SanitizationTest<script>alert("test);</script><a href="javascript:test();">SanitizationTest</a></p>',
			color: '#d32f22',
			teacherIds: [],
			schoolId: '0000d186816abba584714c5f'
			//schoolId: '5836bb5664582c35df3bc000'
		};
		
		return courseService.create(postBody, { payload: {userId: '0000d213816abba584714c0a'}})
			.catch(exception => {
				expect(exception).to.not.be.undefined;
				assert.equal(exception.code, 400);
				assert.equal(exception.message, "course validation failed: name: Path `name` is required.");
			});
	});
});
