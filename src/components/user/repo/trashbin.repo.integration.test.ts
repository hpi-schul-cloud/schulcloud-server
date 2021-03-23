import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import appPromise from '../../../app';
import * as trashbinRepo from './trashbin.repo';
import testObjectHelpers from '../../../../test/services/helpers/testObjects';
import * as compareHelper from '../../../helper/compare';

const testObjects = testObjectHelpers(appPromise);
const { equal: equalIds } = compareHelper.ObjectId;

chai.use(chaiAsPromised);
const { expect } = chai;

describe.only('user repository', () => {
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
			const data: trashbinRepo.TrashbinData = [
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
			const data: trashbinRepo.TrashbinData = [
				{
					scope: 'user',
					data: {
						name: 'mark mustermann',
						someproperty: 'I dont care how this object is composed',
					},
				},
			];
			await trashbinRepo.createUserTrashbin(user._id, data);
			const updateData: trashbinRepo.TrashbinScopeData = {
				scope: 'account',
				data: {
					username: 'mark@mustermann',
					someotherproperty: 'stuff goes here',
				},
			}; // TODO [] removed
			const result = await trashbinRepo.updateTrashbinByUserId(user._id, updateData);
			expect(result.data.length).to.equal(2);
		});

		it('when multiple trashbins exists, then it updates the newest one', async () => {
			const user = await testObjects.createTestUser();
			const data: trashbinRepo.TrashbinData = [
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
			const updateData: trashbinRepo.TrashbinScopeData = {
				scope: 'mathknowledge',
				data: { knownnumbers: 42 },
			}; // TODO [] removed
			const result = await trashbinRepo.updateTrashbinByUserId(user._id, updateData);
			expect(equalIds(result._id, secondId)).to.be.true;
			expect(result.data.length).to.equal(2);
		});
	});
});
