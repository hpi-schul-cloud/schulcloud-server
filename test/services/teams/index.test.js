const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;

const app = require('../../../src/app');
const {
	createTestUser,
	createTestAccount,
	generateRequestParams,
	cleanup,
} = require('../helpers/testObjects.js')(app);

const teamService = app.service('/teams');

describe('Team Service', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	describe.skip('/teams/extern/add', () => {
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
			//remove school
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

	describe('CREATE method', () => {
		it('is allowed for superheroes', async () => {
			const hero = await createTestUser({ roles: ['superhero'] });
			const username = hero.email;
			const password = 'Schulcloud1!';
			await createTestAccount({ username, password }, 'local', hero);
			const params = await generateRequestParams({ username, password });

			try {
				const record = {
					name: 'test',
					schoolId: hero.schoolId,
					schoolIds: [hero.schoolId],
					userIds: [hero._id],
				};
				const slimteam = await teamService.create(record, { ...params, query: {} });
				expect(slimteam).to.be.ok;

				const team = await teamService.get(slimteam._id);
				expect(team.userIds.some(item => item.userId.toString() === hero._id.toString())).to.equal(true);
			} finally {
				cleanup();
			}
		});
	});
});
