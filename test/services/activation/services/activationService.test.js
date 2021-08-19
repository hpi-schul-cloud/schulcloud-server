/* eslint-disable no-unused-expressions */
/* eslint-disable max-len */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');

const { expect } = chai;
chai.use(chaiAsPromised);

const appPromise = require('../../../../src/app');
const { createTestUser, createTestAccount, createTestActivation, cleanup } =
	require('../../helpers/testObjects')(appPromise);

const util = require('../../../../src/services/activation/utils/generalUtils');
const customUtils = require('../../../../src/services/activation/utils/customStrategyUtils');

const { customErrorMessages } = util;

const mockData = {
	keyword: customUtils.KEYWORDS.E_MAIL_ADDRESS,
	email: 'testmail@schul-cloud.org',
};

const createEntry = async () => {
	const user = await createTestUser({ roles: ['student'] });
	const entry = await createTestActivation(user, mockData.keyword, mockData.email);
	return { entry, user };
};

describe('activation/services activationService', () => {
	let app;
	let server;
	let activationService;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
		activationService = app.service('activation');
	});

	after(async () => {
		await cleanup();
		await server.close();
	});

	it('registered the activation service', () => {
		expect(activationService).to.not.be.undefined;
	});

	it('find entry', async () => {
		const user1 = await createTestUser({ roles: ['student'] });
		let entries1 = await activationService.find({ account: { userId: user1._id } });
		expect(entries1.entry).to.have.lengthOf(0);

		const { entry, user } = await createEntry();
		const entries2 = await activationService.find({ account: { userId: user._id } });
		expect(entries2).to.not.be.null;
		expect(entries2.entry).to.have.lengthOf(1);
		expect(entries2.entry[0].quarantinedObject).to.be.equal(entry.quarantinedObject);
		expect(entries2.entry[0].keyword).to.be.equal(entry.keyword);
		expect(entries2.entry[0]._id).to.be.undefined;
		expect(entries2.entry[0].userId).to.be.undefined;

		entries1 = await activationService.find({ account: { userId: user1._id } });
		expect(entries1.entry).to.have.lengthOf(0);
	});

	it('initiate entry with valid activationCode', async () => {
		const { entry, user } = await createEntry();
		const credentials = { username: user.email, password: user.email };
		const account = await createTestAccount(credentials, 'local', user);

		const nestMailService = { send: sinon.spy() };
		app.services['nest-mail'] = nestMailService;

		const res = await activationService.update(entry.activationCode, {}, { account: { userId: user._id } });
		expect(nestMailService.send.calledOnce).to.equal(true);
		expect(res.success).to.be.true;

		const changedUser = await util.getUser(app, user._id);
		const changedAccounts = await app.service('/accounts').find({
			query: {
				userId: user._id,
			},
		});
		expect(changedAccounts).to.have.lengthOf(1);
		const changedAccount = changedAccounts[0];

		expect(user.email).to.not.be.equal(changedUser.email);
		expect(changedUser.email).to.be.equal(entry.quarantinedObject);
		expect(account.username).to.not.be.equal(changedAccount.username);
		expect(changedAccount.username).to.be.equal(entry.quarantinedObject);
	});

	it('initiate entry with invalid activationCode', async () => {
		const { entry, user } = await createEntry();
		const credentials = { username: user.email, password: user.email };
		const account = await createTestAccount(credentials, 'local', user);

		await expect(
			activationService.update('thisisaninvalidactivationcode', {}, { account: { userId: user._id } })
		).to.be.rejectedWith(customErrorMessages.ACTIVATION_LINK_INVALID);

		const changedUser = await util.getUser(app, user._id);
		const changedAccounts = await app.service('/accounts').find({
			query: {
				userId: user._id,
			},
		});
		expect(changedAccounts).to.have.lengthOf(1);
		const changedAccount = changedAccounts[0];

		expect(user.email).to.be.equal(changedUser.email);
		expect(changedUser.email).to.not.equal(entry.quarantinedObject);
		expect(account.username).to.be.equal(changedAccount.username);
		expect(changedAccount.username).to.not.equal(entry.quarantinedObject);
	});

	it('initiate entry with valid activationCode from differnt user', async () => {
		const { entry, user } = await createEntry();
		const credentials = { username: user.email, password: user.email };
		const account = await createTestAccount(credentials, 'local', user);

		const userHacker = await createTestUser({ roles: ['student'] });

		await expect(
			activationService.update(entry.activationCode, {}, { account: { userId: userHacker._id } })
		).to.be.rejectedWith(customErrorMessages.ACTIVATION_LINK_INVALID);

		const changedUser = await util.getUser(app, user._id);
		const changedAccounts = await app.service('/accounts').find({
			query: {
				userId: user._id,
			},
		});
		expect(changedAccounts).to.have.lengthOf(1);
		const changedAccount = changedAccounts[0];

		expect(user.email).to.be.equal(changedUser.email);
		expect(changedUser.email).to.not.equal(entry.quarantinedObject);
		expect(account.username).to.be.equal(changedAccount.username);
		expect(changedAccount.username).to.not.equal(entry.quarantinedObject);
	});

	it('delete entry', async () => {
		const { entry, user } = await createEntry();
		expect(entry).to.not.be.null;

		const res = await activationService.remove(entry.keyword, { account: { userId: user._id } });
		expect(res.success).to.be.true;
		expect(res.removed).to.be.equal(1);

		const entries = await activationService.find({ account: { userId: user._id } });
		expect(entries.entry).to.have.lengthOf(0);
	});
});
