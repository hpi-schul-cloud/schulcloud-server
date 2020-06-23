/* eslint-disable no-unused-expressions */

const { Forbidden } = require('@feathersjs/errors');
const { expect } = require('chai');
const app = require('../../../../src/app');
const {
	createTestUser,
	cleanup,
} = require('../../helpers/testObjects')(app);

const util = require('../../../../src/services/activation/utils');
const customUtils = require('../../../../src/services/activation/utils/customUtils');

const mockData = {
	keyword: customUtils.KEYWORDS.E_MAIL_ADDRESS,
	email: 'testmail@schul-cloud.org',
	email2: 'testmail2@schul-cloud.org',
};

const createEntry = async () => {
	const user = await createTestUser({ roles: ['student'] });
	const entry = await util.createEntry(app, user._id, mockData.keyword, mockData.email);
	return { entry, user };
};

describe('activationd utils', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after(async () => {
		await cleanup();
		await server.close();
	});

	it('create entry', async () => {
		const { keyword } = mockData;
		const { entry, user } = await createEntry();

		expect(entry).to.not.be.undefined;
		expect(entry.userId.toString()).to.be.equal(user._id.toString());
		expect(entry.keyword).to.be.equal(keyword);
		expect(entry.state).to.be.equal(util.STATE.NOT_STARTED);
		expect(entry.activationCode).to.have.lengthOf(128);
		expect(entry.quarantinedObject).to.be.equal(mockData.email);
		expect(entry.mailSend).to.be.instanceof(Array);
		expect(entry.mailSend).to.have.lengthOf(0);
		expect(entry.createdAt).to.exist;
		expect(entry.updatedAt).to.exist;
	});

	it('create entry with same email twice', async () => {
		const { entry, user } = await createEntry();
		const entry2 = await util.createEntry(app, user._id, mockData.keyword, mockData.email);
		expect(entry).to.be.deep.include(entry2);
	});

	it('create entry with new email', async () => {
		const { entry, user } = await createEntry();
		const entry2 = await util.createEntry(app, user._id, mockData.keyword, mockData.email2);
		expect(entry).to.be.not.deep.include(entry2);
		expect(entry._id.toString()).to.be.not.equal(entry2._id.toString());
		expect(entry.activationCode).to.be.not.equal(entry2.activationCode);
	});

	it('delete entry', async () => {
		const { entry } = await createEntry();
		const res = await util.deleteEntry(app, entry._id);
		expect(entry).to.deep.include(res);
	});

	it('set entry state', async () => {
		const newState = util.STATE.SUCCESS;
		const { entry } = await createEntry();
		expect(entry.state).to.be.not.equal(newState);

		const changedEntry = await util.setEntryState(app, entry._id, newState);
		expect(changedEntry.state).to.be.equal(newState);
	});

	it('lookup entry by ActivationCode', async () => {
		const { entry, user } = await createEntry();

		const { activationCode } = entry;
		const lookup = await util.lookupByActivationCode(app, user._id, activationCode, mockData.keyword);

		expect(lookup).to.not.be.undefined;
		expect(lookup._id.toString()).to.equal(entry._id.toString());
		expect(lookup.userId.toString()).to.be.equal(user._id.toString());
		expect(lookup.userId.toString()).to.be.equal(entry.userId.toString());
		expect(lookup.activationCode).to.be.equal(entry.activationCode);
	});

	it('deny other users entry by ActivationCode', async () => {
		const { keyword } = mockData;
		const testUser1 = await createTestUser();
		const testUser2 = await createTestUser();
		const entry = await util.createEntry(app, testUser1._id, keyword, mockData.email);

		const { activationCode } = entry;
		const entryUser2 = await util.lookupByActivationCode(app, testUser2._id, activationCode, keyword);
		expect(entryUser2, 'this is bad!!').to.be.null;
	});

	it('lookup entry by userId', async () => {
		const keyword = util.KEYWORDS.E_MAIL_ADDRESS;
		const testUser1 = await createTestUser();
		const testUser2 = await createTestUser();
		const entry = await util.createEntry(app, testUser1._id, keyword, mockData.email);

		const userIdOfUser1 = testUser1._id;
		const lookup = await util.lookupByUserId(app, userIdOfUser1, keyword);

		expect(lookup).to.not.be.undefined;
		expect(lookup._id.toString()).to.equal(entry._id.toString());
		expect(lookup.userId.toString()).to.be.equal(testUser1._id.toString());
		expect(lookup.userId.toString()).to.be.equal(entry.userId.toString());
		expect(lookup.activationCode).to.be.equal(entry.activationCode);

		const userIdOfUser2 = testUser2._id;
		const lookupUser2 = await util.lookupByUserId(app, userIdOfUser2, keyword);

		expect(lookupUser2).to.be.null;
	});

	it('check if entry is valid');
});
