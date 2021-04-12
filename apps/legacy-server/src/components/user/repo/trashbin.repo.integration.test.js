const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);
const trashbinRepo = require('./trashbin.repo');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;

chai.use(chaiAsPromised);
const { expect } = chai;

describe('user repository', () => {
	let app;
	let server;

	before(async () => {
		delete require.cache[require.resolve('../../../../src/app')];
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
	});

	describe('createUserTrashbin', () => {
		it('when creating a new trashbin with any data, then it returns the new trashbin object', async () => {
			const user = await testObjects.createTestUser();
			const data = [
				{
					scope: 'user',
					data: {
						name: 'mark mustermann',
						someproperty: 'I dont care how this object is composed',
					},
				},
			];

			const result = await trashbinRepo.createUserTrashbin(user._id, data);

			expect(equalIds(result.userId, user._id)).to.be.true;
			expect(result.data.length).to.equal(1);
		});
	});

	describe('updateUserTrashbin', () => {
		it('when updating an existing trashbin with new data, then the new data is merged with the old', async () => {
			const user = await testObjects.createTestUser();
			const data = [
				{
					scope: 'user',
					data: {
						name: 'mark mustermann',
						someproperty: 'I dont care how this object is composed',
					},
				},
			];
			await trashbinRepo.createUserTrashbin(user._id, data);
			const updateData = [
				{
					scope: 'account',
					data: {
						username: 'mark@mustermann',
						someotherproperty: 'stuff goes here',
					},
				},
			];

			const result = await trashbinRepo.updateTrashbinByUserId(user._id, updateData);
			expect(result.data.length).to.equal(2);
		});

		it('when multiple trashbins exists, then it updates the newest one', async () => {
			const user = await testObjects.createTestUser();
			const data = [
				{
					scope: 'ogre',
					data: {
						name: 'shrek',
						color: 'green',
					},
				},
			];
			await trashbinRepo.createUserTrashbin(user._id, data);
			const { _id: secondId } = await trashbinRepo.createUserTrashbin(user._id, data);
			const updateData = [
				{
					scope: 'mathknowledge',
					data: { knownnumbers: 42 },
				},
			];

			const result = await trashbinRepo.updateTrashbinByUserId(user._id, updateData);
			expect(equalIds(result._id, secondId)).to.be.true;
			expect(result.data.length).to.equal(2);
		});
	});
});
