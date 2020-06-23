// const { Forbidden } = require('@feathersjs/errors');
// const { expect } = require('chai');
// const app = require('../../../src/app');
// const {
// 	// createTestSchoolGroup,
// 	// createTestSchool,
// 	createTestUser,
// 	cleanup,
// } = require('../helpers/testObjects')(app);

// const util = require('../../../src/services/activation/utils');

// const services = {
// 	email: {
// 		email: 'testmail@schul-cloud.org',
// 		quarantinedObject: {
// 			email: 'testmail@schul-cloud.org',
// 		},
// 	},
// };

// describe('activationd utils', () => {
// 	let server;

// 	before((done) => {
// 		server = app.listen(0, done);
// 	});

// 	after(async () => {
// 		await cleanup();
// 		await server.close();
// 	});

// 	it('get QuarantinedObject value', () => {
// 		const keyword = util.KEYWORDS.E_MAIL_ADDRESS;
// 		const quarantinedObjectValue = util.getQuarantinedObject(keyword, services.email.quarantinedObject);

// 		expect(quarantinedObjectValue).to.be.equal(services.email.email);
// 	});

// 	it('create entry', async () => {
// 		const keyword = util.KEYWORDS.E_MAIL_ADDRESS;
// 		const user = await createTestUser({ roles: ['student'] });
// 		const entry = await util.createEntry(app, user._id, keyword, services.email.email);

// 		expect(entry).to.not.be.undefined;
// 		expect(entry.account.toString()).to.be.equal(user._id.toString());
// 		expect(entry.keyword).to.be.equal(keyword);
// 		expect(entry.activated).to.be.false;
// 		expect(entry.activationCode).to.have.lengthOf(128);
// 		expect(entry.quarantinedObject).to.include(services.email.quarantinedObject);
// 		expect(entry.mailSend).to.be.false;
// 		expect(entry.createdAt).to.exist;
// 		expect(entry.updatedAt).to.exist;
// 	});

// 	it('lookup entry by ActivationCode', async () => {
// 		const keyword = util.KEYWORDS.E_MAIL_ADDRESS;
// 		const user = await createTestUser({ roles: ['student'] });
// 		const entry = await util.createEntry(app, user._id, keyword, services.email.email);

// 		const { activationCode } = entry;
// 		const lookup = await util.lookupByActivationCode(app, user._id, activationCode, keyword);

// 		expect(lookup).to.not.be.undefined;
// 		expect(lookup._id.toString()).to.equal(entry._id.toString());
// 		expect(lookup.account.toString()).to.be.equal(user._id.toString());
// 		expect(lookup.account.toString()).to.be.equal(entry.account.toString());
// 		expect(lookup.activationCode).to.be.equal(entry.activationCode);
// 	});

// 	it('deny other users entry by ActivationCode', async () => {
// 		const keyword = util.KEYWORDS.E_MAIL_ADDRESS;
// 		const testUser1 = await createTestUser();
// 		const testUser2 = await createTestUser();
// 		const entry = await util.createEntry(app, testUser1._id, keyword, services.email.email);

// 		const { activationCode } = entry;
// 		try {
// 			await util.lookupByActivationCode(app, testUser2._id, activationCode, keyword);
// 			expect.fail();
// 		} catch (error) {
// 			if (error.message === 'expect.fail()') {
// 				throw new Error('could get information by using activation code of another user');
// 			}
// 			expect(error.code).to.be.equal(403);
// 		}
// 	});

// 	it('lookup entry by userId', async () => {
// 		const keyword = util.KEYWORDS.E_MAIL_ADDRESS;
// 		const testUser1 = await createTestUser();
// 		const testUser2 = await createTestUser();
// 		const entry = await util.createEntry(app, testUser1._id, keyword, services.email.email);

// 		const userIdOfUser1 = testUser1._id;
// 		const lookup = await util.lookupByUserId(app, userIdOfUser1, keyword);

// 		expect(lookup).to.not.be.undefined;
// 		expect(lookup._id.toString()).to.equal(entry._id.toString());
// 		expect(lookup.account.toString()).to.be.equal(testUser1._id.toString());
// 		expect(lookup.account.toString()).to.be.equal(entry.account.toString());
// 		expect(lookup.activationCode).to.be.equal(entry.activationCode);

// 		const userIdOfUser2 = testUser2._id;
// 		const lookupUser2 = await util.lookupByUserId(app, userIdOfUser2, keyword);

// 		expect(lookupUser2).to.be.null;
// 	});
// });
