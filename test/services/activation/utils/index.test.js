/* eslint-disable no-unused-expressions */
/* eslint-disable max-len */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const { expect } = chai;
chai.use(chaiAsPromised);

const { Configuration } = require('@schul-cloud/commons');
const { HOST } = require('../../../../config/globals');
const app = require('../../../../src/app');
const {
	createTestUser,
	cleanup,
} = require('../../helpers/testObjects')(app);

const util = require('../../../../src/services/activation/utils');
const customUtils = require('../../../../src/services/activation/utils/customUtils');
const { customErrorMessages } = require('../../../../src/services/helpers/utils');

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

describe('activation/utils utils', () => {
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

		await expect(util.setEntryState(app, entry._id, 'something')).to.be.rejected;
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

	it('check if entry is valid', async () => {
		const { entry } = await createEntry();
		await expect(util.validEntry(entry)).to.not.rejected;

		entry.state = util.STATE.PENDING;
		await expect(util.validEntry(entry)).to.be.rejectedWith(customErrorMessages.ACTIVATION_LINK_INVALID);

		entry.state = util.STATE.NOT_STARTED;
		entry.updatedAt = new Date(
			Date.parse(entry.updatedAt) - 1000 * Configuration.get('ACTIVATION_LINK_PERIOD_OF_VALIDITY_SECONDS') - 1000,
		);
		await expect(util.validEntry(entry)).to.be.rejectedWith(customErrorMessages.ACTIVATION_LINK_EXPIRED);
	});

	it('filter entries', async () => {
		const { entry, user } = await createEntry();
		const entry2 = await util.createEntry(app, user._id, mockData.keyword, mockData.email2);

		let validKeys = ['activationCode'];
		const res1 = await util.filterEntryParamNames([entry].slice(0), validKeys);
		expect(Object.keys(res1[0]).length).to.be.equal(validKeys.length);
		expect(res1[0].activationCode).to.exist;
		expect(res1[0].data).to.not.exist;
		expect(res1[0].quarantinedObject).to.not.exist;
		expect(res1[0]._id).to.not.exist;
		expect(res1[0].createdAt).to.not.exist;
		expect(res1[0].userId).to.not.exist;
		expect(res1[0].keyword).to.not.exist;

		validKeys = ['activationCode', 'quarantinedObject'];
		const res2 = await util.filterEntryParamNames([entry2], validKeys);
		expect(Object.keys(res2[0]).length).to.be.equal(validKeys.length);
		expect(res2[0].activationCode).to.exist;
		expect(res2[0].data).to.exist;
		expect(res2[0].quarantinedObject).to.not.exist;
		expect(res1[0]._id).to.not.exist;
		expect(res1[0].createdAt).to.not.exist;
		expect(res1[0].userId).to.not.exist;
		expect(res1[0].keyword).to.not.exist;

		try {
			util.filterEntryParamNames(entry, validKeys);
			throw new Error('This should never happen');
		} catch (error) {
			expect(error).to.be.instanceOf(SyntaxError);
			expect(error.message).to.be.equal('entries must be an array');
		}
	});

	it('get User', async () => {
		const user = await createTestUser({ roles: ['student'] });
		const getUser = await util.getUser(app, user._id);
		expect(user._id.toString()).to.be.equal(getUser._id.toString());
		expect(user.email).to.be.equal(getUser.email);
		expect(new Date(user.createdAt).toISOString).to.be.equal(new Date(getUser.createdAt).toISOString);
	});

	it('create Activation Link', async () => {
		const { entry } = await createEntry();
		const link = util.createActivationLink(entry.activationCode);
		expect(link).to.be.equal(`${HOST}/activation/${entry.activationCode}`);
	});
});
