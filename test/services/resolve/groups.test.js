'use strict';

const assert = require('assert');
const chai = require('chai');
const expect = chai.expect;

describe('/resolve/groups service', function() {
	let service = null, app = null;// app.service('resolve/groups');

	const userId = {
		valid:'0000d224816abba584714c9c',
		wrong_school:'599ec1688e4e364ec18ff46e',	//valid key but wrong school
		not_exist:'111111111111111111111111',		//valid key but do not exist
		not_valid:'123'
	}
	
	const schoolId = {
		valid:'0000d186816abba584714c5f',
		other_school:'599ec0bb8e4e364ec18ff46c',
		not_valid:'123'
	}
	
	const err_message={
		additional:'Error by query class-Service, or course-Service, or role-Service.',
		schoolService:'Not expect error by use school services.',
		not_valid_id:'Not valid user or school id.',
		can_not_find_user:'Can not find user.'
	}
	
	const err_code={
		additional:500,
		schoolService:500,
		not_valid_id:400,
		can_not_find_user:404
	}
	
	
	let params =  {query:{userId:null}};
	
	/******************** runs before and after all tests in this block *******************************/
	
	before(done => {		
		this.timeout(10000); // for slow require(app) call
		app = require('../../../src/app');
		app.setup();
		service = app.service('resolve/groups');
		done();
	}); 
	
	after(done => {
		done();
	});
		
	/*************************************************************************************************/
	
	it('registered the resolve/scopes service', done => {
			//expect(service).to.be.an('object');//null or undefined can not pass this test
			assert.ok(service);//null or undefined can not pass this test
			done();
	});
	
	it('GET/ with valid schoolId and valid userId', () => {
		params.query.userId=userId.valid;
		return service.get(schoolId.valid,params).then(result => {
			expect(result).to.be.an('object');
			expect(result).to.have.all.keys('data','userId','schoolId');
			expect(result.data).to.be.an('array');
			
			//data is array and length>0
		});
	});
	
	it('GET/ with valid schoolId and userId_wrong_school', () => {
		params.query.userId=userId.wrong_school;
		return service.get(schoolId.valid,params).catch(err=>{
			expect(err).to.be.an('object');
			expect(err).to.have.all.keys('message','code','name','type','data','errors','className');
			expect(err.message).to.have.string(err_message.not_valid_id);
			expect(err.code).to.equal(err_code.not_valid_id); 
		});
	});

	 
	it('GET/ with valid schoolId and userId_not_exist', () => {
		params.query.userId=userId.not_exist;
		return service.get(schoolId.valid,params).catch(err => {
			expect(err).to.be.an('object');
			expect(err).to.have.all.keys('message','code','name','type','data','errors','className');
			expect(err.message).to.have.string(err_message.not_valid_id);
			expect(err.code).to.equal(err_code.not_valid_id); 
		});
	});
	 

	
	it('GET/ with valid schoolId and userId_not_valid', () => {
		params.query.userId=userId.not_valid;
		return service.get(schoolId.valid,params).catch(err => {
			expect(err).to.be.an('object');
			expect(err).to.have.all.keys('message','code','name','type','data','errors','className');
			expect(err.message).to.have.string(err_message.not_valid_id);
			expect(err.code).to.equal(err_code.not_valid_id); 
		});
	});
	
	it('GET/ with schoolId_other_school and valid userId', () => {
		params.query.userId=userId.valid;
		return service.get(schoolId.other_school,params).catch(err => {
			expect(err).to.be.an('object');
			expect(err).to.have.all.keys('message','code','name','type','data','errors','className');
			expect(err.message).to.have.string(err_message.not_valid_id);
			expect(err.code).to.equal(err_code.not_valid_id); 
		});
	}); 

	
	it('GET/ with schoolId_not_valid and valid userId', () => {
		params.query.userId=userId.valid;
		return service.get(schoolId.not_valid,params).catch(err => {
			expect(err).to.be.an('object');
			expect(err).to.have.all.keys('message','code','name','type','data','errors','className');	
			expect(err.message).to.have.string(err_message.not_valid_id);
			expect(err.code).to.equal(err_code.not_valid_id); 
		});
	});
	/*
	it('GET/ with wrong query', () => {
		return service.get(schoolId.valid,null).catch(err => {
			console.log(err);
			expect(err).to.be.an('object');
			expect(err).to.have.all.keys('message','code','name','type','data','errors','className');
			expect(err.message).to.have.string("Not valid user or school id.");
			expect(err.code).to.equal(400); 
		});
	}); */
	
	//other methodes post etc..
	
	//to many 
	
});
