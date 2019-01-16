const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const { BadRequest } = require('feathers-errors');
const { setupUser, deleteUser } = require('../helper/helper.user');
const app = require('../../../../src/app');
const { ifSuperhero, getSessionUser, updateMissingDataInHookForCreate,
	isAcceptWay, getTeam, arrayRemoveAddDiffs, getTeamUsers,
	populateUsersForEachUserIdinHookData } = require('../../../../src/services/teams/hooks/helpers.js');

describe('hook helpers', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});
	
	describe('ifSuperhero', () => {
		it('should return true if one of the given roles is superhero', () => {
			const roles = [
				{ name: 'user' },
				{ name: 'teacher' },
				{ name: 'superhero' },
			];
			expect(ifSuperhero(roles)).to.equal(true);
			expect(ifSuperhero(['superhero', 'admin'])).to.equal(true);
		});

		it('should return false otherwise', () => {
			expect(ifSuperhero([])).to.equal(false);
			expect(ifSuperhero({})).to.equal(false);
			expect(ifSuperhero(['admin', 'lehrer'])).to.equal(false);
			expect(ifSuperhero([
				{ name: 'admin' },
				{ name: 'schueler' },
			])).to.equal(false);
		});
	});

	describe('arrayRemoveAddDiffs', () => {
		it.skip('should work for empty arrays', () => {
			expect(arrayRemoveAddDiffs([], [])).to.equal({add: [], remove: []});
		});

		it('should work for plain arrays', () => {
			expect(arrayRemoveAddDiffs([1], [2])).to.deep.equal({add: [2], remove: [1]});
			expect(arrayRemoveAddDiffs([1, 2, 3], [2, 4])).to.deep.equal({add: [4], remove: [1, 3]});
			expect(arrayRemoveAddDiffs(['foo', 'bar'], ['foo', 'baz', 'bar'])).to.deep.equal({add: ['baz'], remove: []});
			expect(arrayRemoveAddDiffs(['foo', 'bar'], ['bar'])).to.deep.equal({add: [], remove: ['foo']});
		});

		it('should ignore duplicate values', () => {
			expect(arrayRemoveAddDiffs([1, 1, 2], [1, 2])).to.deep.equal({add: [], remove: []});
			expect(arrayRemoveAddDiffs([1, 1, 2], [1, 1, 1, 1, 3])).to.deep.equal({add: [3], remove: [2]});
		});

		it('should work on huge arrays', () => {
			const arr = new Array(Math.pow(2, 15)).fill(1);
			const arr2 = Array.from(arr);
			arr2.push(2);
			expect(arrayRemoveAddDiffs(arr, arr2)).to.deep.equal({add: [2], remove: []});
		});

		it('should use a provided key to compare elements', () => {
			const original = [
				{ name: 'foo' },
				{ name: 'bar', data: 1 },
			];
			const changed = [
				{ name: 'baz' },
				{ name: 'bar', data: 2 },
			];
			const expected = {
				add: [{ name: 'baz' }],
				remove: [{ name: 'foo' }],
			};
			expect(arrayRemoveAddDiffs(original, changed, 'name')).to.deep.equal(expected);
		});

		it('should work on lists of ObjectIds', () => {
			const id1 = new ObjectId();
			const id2 = new ObjectId();
			const id3 = new ObjectId();

			const original = [
				{ _id: id1 },
				{ _id: id2 },
			];
			const changed = [
				{ _id: id1 },
				{ _id: id3 },
			];
			const expected = {
				add: [{ _id: id3 }],
				remove: [{ _id: id2 }],
			};
			expect(arrayRemoveAddDiffs(original, changed, '_id')).to.deep.equal(expected);
		});
	});

	describe('populateUsersForEachUserIdinHookData', () => {
		it('should not break for request methods != CREATE, PATCH', async () => {
			const hook = { method: 'delete' };
			expect(await populateUsersForEachUserIdinHookData(hook)).to.deep.equal([]);
			expect(() => populateUsersForEachUserIdinHookData(hook)).to.not.throw();
		});

		it('should fail for empty request bodies', async () => {
			const hook = { method: 'patch', data: [] };
			expect(await populateUsersForEachUserIdinHookData(hook)).to.deep.equal([]);
			expect(() => populateUsersForEachUserIdinHookData(hook)).to.not.throw();
		});

		it('should populate userIds in the request data', async () => {
			await Promise.all(['create', 'patch'].map(async (method) => {
				const { userId, user } = await setupUser();
				expect(userId).to.not.equal(undefined);
				const hook = {
					app,
					method: method,
					data: {
						userIds: [
							userId,
						],
					},
				};
				const result = await populateUsersForEachUserIdinHookData(hook);
				expect(result[0]._id.toString()).to.equal(user._id.toString());
				expect(result[0].firstName).to.equal(user.firstName);
				await deleteUser(userId);
			}));
		});

		it('should fail for invalid userIds', async () => {
			const { userId } = await setupUser();
			expect(userId).to.not.equal(undefined);
			const hook = {
				app,
				method: 'create',
				data: {
					userIds: [
						userId,
						'123456',
					],
				},
			};

			await new Promise((resolve, reject) => {
				populateUsersForEachUserIdinHookData(hook)
					.then(() => {
						reject(new Error('This call should fail because of an invalid userId'));
					})
					.catch((err) => {
						expect(err instanceof BadRequest).to.equal(true);
						resolve();
					});
			});

			await deleteUser(userId);
		});

		it('should resolve duplicate IDs only once', async () => {
			await Promise.all(['create', 'patch'].map(async (method) => {
				const { userId, user } = await setupUser();
				expect(userId).to.not.equal(undefined);
				const hook = {
					app,
					method: method,
					data: {
						userIds: [
							userId,
							userId,
							userId,
							userId,
						],
					},
				};
				const result = await populateUsersForEachUserIdinHookData(hook);
				expect(result.length).to.equal(1);
				expect(result[0]._id.toString()).to.equal(user._id.toString());
				expect(result[0].firstName).to.equal(user.firstName);
				await deleteUser(userId);
			}));
		});

		it('should work for multiple userIds', async () => {
			await Promise.all(['create', 'patch'].map(async (method) => {
				const { userId: userId1, user: user1 } = await setupUser();
				const { userId: userId2, user: user2 } = await setupUser();
				const { userId: userId3, user: user3 } = await setupUser();
				const { userId: userId4, user: user4 } = await setupUser();

				const hook = {
					app,
					method: method,
					data: {
						userIds: [
							userId1,
							userId2,
							userId3,
							userId4,
						],
					},
				};
				const result = await populateUsersForEachUserIdinHookData(hook);
				expect(result.length).to.equal(4);

				expect(result[0]._id.toString()).to.equal(user1._id.toString());
				expect(result[0].firstName).to.equal(user1.firstName);

				expect(result[1]._id.toString()).to.equal(user2._id.toString());
				expect(result[1].firstName).to.equal(user2.firstName);

				expect(result[2]._id.toString()).to.equal(user3._id.toString());
				expect(result[2].firstName).to.equal(user3.firstName);

				expect(result[3]._id.toString()).to.equal(user4._id.toString());
				expect(result[3].firstName).to.equal(user4.firstName);

				await deleteUser(userId1);
				await deleteUser(userId2);
				await deleteUser(userId3);
				await deleteUser(userId4);
			}));
		});
	});
});
