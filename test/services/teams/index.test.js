const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../../src/app');
const { setupUser, deleteUser } = require('./helper/helper.user');
const { ObjectId } = require('mongoose').Types;

const { expect } = chai;
const host=process.env.HOST||'http://localhost:3030';
chai.use(chaiHttp);

describe('Test top level team services endpoints.', () => {
	let server, agent;

	before((done) => {
		const agent = chai.request.agent(host);
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	describe('/teams/extern/add', () => {
		let service={}, team={};
		before( ()=>{
			service = app.service('/teams/extern/add');
			team._id = ObjectId();
			//todo create user
			//todo create team
			//todo expert school
		});

		after(()=>{
			//remove user
			//remove team
		});

		it.skip('should accept emails & role', async ()=>{
			const result = await service.patch(team._id,{email:'tester@test.de', role:'teamexpert'});
		/*	agent.post('/authentication')
			.send({})	Authorization:<token>, strategy:'local'
			.end((err, response) => {
                if(err){ 
					throw err	
				};
				if(response===undefined){
					throw new Error('');
				}
                //do resolve
            });
		*/
		});

	});
});
