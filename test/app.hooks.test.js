'use strict';

const assert = require('assert');
const chai = require('chai');
const expect = chai.expect;
const promisify = require("es6-promisify");
const fs = require("fs");
const path = require("path");

describe('sanitization service', function () {
	
	let newsService, helpdeskService, app, currentUsedId = null;
	
	before(done => {
		this.timeout(10000); // for slow require(app) call
		app = require('../src/app');
		app.setup();
		newsService = app.service('news');
		helpdeskService = app.service('helpdesk');
		done();
	});
	
	after(done => {
		done();
	});
	
	// ###################################
	
	it('registered the news service (sanitization)', () => {
		assert.ok(newsService);
	});

	it('POST /news (sanitization)', () => {
		let postBody = {
			"schoolId": "5836bb5664582c35df3bc000",
			"title": '<script>alert("test");</script>SanitizationTest',
			"content": '<p>SanitizationTest<script>alert("test);</script><a href="javascript:test();">SanitizationTest</a></p>',
		};
		
		return newsService.create(postBody, {payload: {userId: '0000d213816abba584714c0a'}})
			.then(news => {
				currentUsedId = news._id;
				expect(news.title).to.equal("SanitizationTest");
				expect(news.content).to.equal("<p>SanitizationTest<a>SanitizationTest</a></p>");
			});
	});
	
	it('DELETE /news (sanitization)', () => {
		return newsService.remove(currentUsedId, {payload: {userId: '0000d213816abba584714c0a'}}).then(result => {
			expect(result).to.not.be.undefined;
		});
	});
	
	// ###################################
	
	it('registered the helpdesk service', () => {
		assert.ok(helpdeskService);
	});
	
	it('POST /helpdesk (sanitization)', () => {
		let postBody = {
			subject: '<script>alert("test");</script>SanitizationTest',
			currentState: '<p>SanitizationTest<script>alert("test);</script><a href="javascript:test();">SanitizationTest</a></p>',
			targetState: '<p>SanitizationTest<script>alert("test);</script><a href="javascript:test();">SanitizationTest</a></p>',
			category: 'dashboard',
			schoolId: '5836bb5664582c35df3bc000'
		};
		
		return helpdeskService.create(postBody, { payload: {userId: '0000d213816abba584714c0a'}})
			.then(result => {
				currentUsedId = result._id;
				expect(result.subject).to.equal('SanitizationTest');
				expect(result.currentState).to.equal('<p>SanitizationTest<a>SanitizationTest</a></p>');
				expect(result.targetState).to.equal('<p>SanitizationTest<a>SanitizationTest</a></p>');
			});
	});
	
	it('DELETE /helpdesk (sanitization)', () => {
		return helpdeskService.remove(currentUsedId, {payload: {userId: '0000d213816abba584714c0a'}})
			.then(result => {
				expect(result).to.not.be.undefined;
			});
	});
	
});
