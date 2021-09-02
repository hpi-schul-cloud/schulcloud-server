const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);
const trashbinModel = require('./db/trashbin.schema');
const trashbinRepo = require('./trashbin.repo');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;

chai.use(chaiAsPromised);
const { expect } = chai;

describe('trashbin repository', () => {
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

	afterEach(async () => {
		await testObjects.cleanup();
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

	describe('deleteExpiredData', () => {
		it('should delete data older than the backupPeriodThreshold', async () => {
			const oldData = await testObjects.createTestTrashbinData();
			const backupPeriodThreshold = new Date();

			await trashbinRepo.deleteExpiredData(backupPeriodThreshold);

			const result = await trashbinModel.findById(oldData._id).lean().exec();
			expect(result).to.be.null;
		});

		it('should not delete data newer than the backupPeriodThreshold', async () => {
			const backupPeriodThreshold = new Date();
			const newData = await testObjects.createTestTrashbinData();

			await trashbinRepo.deleteExpiredData(backupPeriodThreshold);

			const result = await trashbinModel.findById(newData._id).lean().exec();
			expect(result).to.not.be.null;
		});
	});

	describe('getTrashbinObjectsByUserId', () => {
		it('should return trashbin objects for the given userId', async () => {
			const userId = testObjects.generateObjectId();
			const otherUserId = testObjects.generateObjectId();
			const trashbinObjects = await Promise.all(
				Array(3)
					.fill()
					.map(() => testObjects.createTestTrashbinData({ userId }))
			);
			const otherTrashbinObjects = await Promise.all(
				Array(3)
					.fill()
					.map(() => testObjects.createTestTrashbinData({ userId: otherUserId }))
			);

			const result = await trashbinRepo.getTrashbinObjectsByUserId(userId);

			expect(result.map((t) => t._id.toString())).to.eql(trashbinObjects.map((t) => t._id.toString()));
		});
	});

	describe('getExpiredTrashbinDataByScope', () => {
		const scope = 'testScope';

		afterEach(async () => {
			await testObjects.cleanup();
		});

		it('should return data older than the backupPeriodThreshold and with the given scope', async () => {
			const data1 = [
				{
					scope,
					data: 'data1',
				},
			];
			await testObjects.createTestTrashbinData({ data: data1 });

			const data2 = [
				{
					scope,
					data: 'data2',
				},
				{
					scope: 'otherScope',
					data: 'otherData',
				},
			];
			await testObjects.createTestTrashbinData({ data: data2 });

			const backupPeriodThreshold = new Date();

			const result = await trashbinRepo.getExpiredTrashbinDataByScope(scope, backupPeriodThreshold);

			expect(result).to.have.lengthOf(2);
			expect(result).to.include('data1');
			expect(result).to.include('data2');
		});

		it('should not return data newer than the backupPeriodThreshold', async () => {
			const data = [
				{
					scope,
					data: 'data',
				},
			];
			const backupPeriodThreshold = new Date();
			await testObjects.createTestTrashbinData({ data });

			const result = await trashbinRepo.getExpiredTrashbinDataByScope(scope, backupPeriodThreshold);

			expect(result).to.have.lengthOf(0);
		});

		it('should not return data with other scope', async () => {
			const data = [
				{
					scope: 'otherScope',
					data: 'data',
				},
			];
			await testObjects.createTestTrashbinData({ data });
			const backupPeriodThreshold = new Date();

			const result = await trashbinRepo.getExpiredTrashbinDataByScope(scope, backupPeriodThreshold);

			expect(result).to.have.lengthOf(0);
		});

		it('should not return data with skip deletion marker', async () => {
			await testObjects.createTestTrashbinData({ skipDeletion: true });
			const backupPeriodThreshold = new Date();

			const result = await trashbinRepo.getExpiredTrashbinDataByScope(scope, backupPeriodThreshold);

			expect(result).to.have.lengthOf(0);
		});
	});

	describe('setDeletionSkipFlag', () => {
		it('should set deletion skip flag', async () => {
			const trashbinObject = await testObjects.createTestTrashbinData();
			expect(trashbinObject.skipDeletion).to.eql(false);

			await trashbinRepo.setDeletionSkipFlag(trashbinObject._id);

			const result = await trashbinModel.findById(trashbinObject._id);
			expect(result.skipDeletion).to.eql(true);
		});
	});

	describe('removeTrashbinDeletionFlags', () => {
		it('should remove all trashbin deletion flags', async () => {
			await Promise.all([
				testObjects.createTestTrashbinData({ skipDeletion: false }),
				testObjects.createTestTrashbinData({ skipDeletion: false }),
				testObjects.createTestTrashbinData({ skipDeletion: true }),
			]);

			await trashbinRepo.removeTrashbinDeletionFlags();

			const trashbinData = await trashbinModel.find({}).lean().exec();

			trashbinData.forEach((data) => {
				expect(data.skipDeletion).to.be.false;
			});
		});
	});
});
