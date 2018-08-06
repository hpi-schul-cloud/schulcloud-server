'use strict';

const assert = require('assert');
const chai = require('chai');
//const chaiHttp = require('chai-http');
const expect = chai.expect;
//let app = require('../../../src/app');
//const server = `http://${app.get('host')}:${app.get('port')}`;

//chai.use(chaiHttp);

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
	
		/*
	it('GET/ with valid schoolId and userId', (done) => {
		chai.request(server)
		.get('/resolve/groups/'+schoolId.valid)
		.query({userId: userId.valid})
		.end((err,res)=>{
			expect(err).to.be.null;
			expect(res).to.have.status(200); 
			expect(res.body).to.be.an('object');
			expect(res.body).to.have.all.keys('data','userId','schoolId');
			done();
		});
	});  */
	
	it('GET/ with valid schoolId and userId', () => {
		params.query.userId=userId.valid;
		return service.get(schoolId.valid,params).then(result => {
			expect(result).to.be.an('object');
			expect(result).to.have.all.keys('data','userId','schoolId');
		});
	});
	
	/*
	it('GET/ with valid schoolId and userId_wrong_school', (done) => {
		chai.request(server)
		.get('/resolve/groups/'+schoolId.valid)
		.query({userId: userId.wrong_school})
		.end((err,res)=>{
			expect(res.body).to.have.string("Can not find user.");
			expect(err).to.be.null;
			expect(res).to.have.status(200); 
			done();
		});
	}); 
	*/
	
	it('GET/ with valid schoolId and userId_wrong_school', () => {
		params.query.userId=userId.wrong_school;
		return service.get(schoolId.valid,params).then(result => {
			expect(result).to.have.string("Can not find user.");
		});
	});
	
	/*
	it('GET/ with valid schoolId and userId_not_exist', (done) => {
		chai.request(server)
		.get('/resolve/groups/'+schoolId.valid)
		.query({userId: userId.not_exist})
		.end((err,res)=>{
			expect(res.body).to.have.string("Can not find user.");
			expect(err).to.be.null;
			expect(res).to.have.status(200); 
			done();
		});
	}); 
	*/
	it('GET/ with valid schoolId and userId_not_exist', () => {
		params.query.userId=userId.not_exist;
		return service.get(schoolId.valid,params).then(result => {
			expect(result).to.have.string("Can not find user.");
		});
	});
	
	/*
	
	it('GET/ with valid schoolId and userId_not_valid', (done) => {
		chai.request(server)
		.get('/resolve/groups/'+schoolId.valid)
		.query({userId: userId.not_valid})
		.end((err,res)=>{
			expect(res.body).to.have.string("Not valid user or school id.");
			expect(err).to.be.null;
			expect(res).to.have.status(200); 
			done();
		});
	}); 
	
	*/
	
	it('GET/ with valid schoolId and userId_not_valid', () => {
		params.query.userId=userId.not_valid;
		return service.get(schoolId.valid,params).then(result => {
			expect(result).to.have.string("Not valid user or school id.");
		});
	});
	
	/*
	it('GET/ with schoolId_other_school and valid userId', (done) => {
		chai.request(server)
		.get('/resolve/groups/'+schoolId.other_school)
		.query({userId: userId.valid})
		.end((err,res)=>{
			expect(res.body).to.have.string("Can not find user.");
			expect(err).to.be.null;
			expect(res).to.have.status(200); 
			done();
		});
	}); 
	*/
	
	it('GET/ with schoolId_other_school and valid userId', () => {
		params.query.userId=userId.valid;
		return service.get(schoolId.other_school,params).then(result => {
			expect(result).to.have.string("Can not find user.");
		});
	});
	/*
	it('GET/ with schoolId_not_valid and valid userId', (done) => {
		chai.request(server)
		.get('/resolve/groups/'+schoolId.not_valid)
		.query({userId: userId.valid})
		.end((err,res)=>{
			expect(res.body).to.have.string("Not valid user or school id.");
			expect(err).to.be.null;
			expect(res).to.have.status(200); 
			done();
		});
	}); 
	*/
	
	it('GET/ with schoolId_not_valid and valid userId', () => {
		params.query.userId=userId.valid;
		return service.get(schoolId.not_valid,params).then(result => {
			expect(result).to.have.string("Not valid user or school id.");
		});
	});
	
});
