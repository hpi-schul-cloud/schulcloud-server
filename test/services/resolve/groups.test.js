'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const app = require('../../../src/app');
const server = `http://${app.get('host')}:${app.get('port')}`;

chai.use(chaiHttp);

describe(server+'/resolve/groups service', function() {
	const service = app.service('resolve/groups');

	const userId = '0000d224816abba584714c9c';
	const userId_wrong_school = '599ec1688e4e364ec18ff46e';//valid key but do not exist
	const userId_not_exist = '111111111111111111111111';
	const userId_not_valid = '123';
	const schoolId = '0000d186816abba584714c5f';
	const schoolId_other_school = '599ec0bb8e4e364ec18ff46c'; // only user from school xy can pass
	const schoolId_not_valid = '123';
		
	it('registered the resolve/scopes service', () => {
			expect(service).to.be.an('object');//null or undefined can not pass this test
	});
	
	it('GET/ with valid schoolId and userId', (done) => {
		chai.request(server)
		.get('/resolve/groups/'+schoolId)
		.query({userId: userId})
		.end((err,res)=>{
			expect(err).to.be.null;
			expect(res).to.have.status(200); 
			expect(res.body).to.be.an('object');
			expect(res.body).to.have.all.keys('data','userId','schoolId');
			done();
		});
	}); 
	
	it('GET/ with valid schoolId and userId_wrong_school', (done) => {
		chai.request(server)
		.get('/resolve/groups/'+schoolId)
		.query({userId: userId_wrong_school})
		.end((err,res)=>{
			expect(res.body).to.have.string("Can not find user.");
			expect(err).to.be.null;
			expect(res).to.have.status(200); 
			done();
		});
	}); 
	
	it('GET/ with valid schoolId and userId_not_exist', (done) => {
		chai.request(server)
		.get('/resolve/groups/'+schoolId)
		.query({userId: userId_not_exist})
		.end((err,res)=>{
			expect(res.body).to.have.string("Can not find user.");
			expect(err).to.be.null;
			expect(res).to.have.status(200); 
			done();
		});
	}); 
	
	it('GET/ with valid schoolId and userId_not_valid', (done) => {
		chai.request(server)
		.get('/resolve/groups/'+schoolId)
		.query({userId: userId_not_valid})
		.end((err,res)=>{
			expect(res.body).to.have.string("Not valid user or school id.");
			expect(err).to.be.null;
			expect(res).to.have.status(200); 
			done();
		});
	}); 
	
	it('GET/ with schoolId_other_school and valid userId', (done) => {
		chai.request(server)
		.get('/resolve/groups/'+schoolId_other_school)
		.query({userId: userId})
		.end((err,res)=>{
			expect(res.body).to.have.string("Can not find user.");
			expect(err).to.be.null;
			expect(res).to.have.status(200); 
			done();
		});
	}); 
	
	it('GET/ with schoolId_not_valid and valid userId', (done) => {
		chai.request(server)
		.get('/resolve/groups/'+schoolId_not_valid)
		.query({userId: userId})
		.end((err,res)=>{
			expect(res.body).to.have.string("Not valid user or school id.");
			expect(err).to.be.null;
			expect(res).to.have.status(200); 
			done();
		});
	}); 

});
