const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const reqlib = require('app-root-path').require;

const { BadRequest, NotFound } = reqlib('src/errors');
const { setupUser, deleteUser } = require('../helper/helper.user');
const appPromise = require('../../../../src/app');
const {
	ifSuperhero,
	getSessionUser,
	arrayRemoveAddDiffs,
	populateUsersForEachUserIdinHookData,
	removeDuplicatedTeamUsers,
} = require('../../../../src/services/teams/hooks/helpers.js');

const { teamUserModel } = require('../../../../src/services/teams/model');

describe('hook helpers', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after((done) => {
		server.close(done);
	});

	describe('ifSuperhero', () => {
		it('should return true if one of the given roles is superhero', () => {
			const roles = [{ name: 'user' }, { name: 'teacher' }, { name: 'superhero' }];
			expect(ifSuperhero(roles)).to.equal(true);
			expect(ifSuperhero(['superhero', 'admin'])).to.equal(true);
		});

		it('should return false otherwise', () => {
			expect(ifSuperhero([])).to.equal(false);
			expect(ifSuperhero({})).to.equal(false);
			expect(ifSuperhero(['admin', 'lehrer'])).to.equal(false);
			expect(ifSuperhero([{ name: 'admin' }, { name: 'schueler' }])).to.equal(false);
		});
	});

	describe('removeDuplicatedTeamUsers', () => {
		const userList = [];
		let populatedUserList;
		before(() => {
			const schoolId = ObjectId();
			const role = ObjectId();
			const data = [
				{ schoolId, role, userId: ObjectId() },
				{ schoolId, role, userId: ObjectId() },
				{ schoolId, role, userId: ObjectId() },
			];
			userList.push(new teamUserModel(data[0])._doc);
			userList.push(new teamUserModel(data[1])._doc);
			userList.push(new teamUserModel(data[2])._doc);

			populatedUserList = userList.slice();
			// fake populate
			populatedUserList[0].userId = { _id: data[0].userId };
			populatedUserList[1].userId = { _id: data[1].userId };
			populatedUserList[2].userId = { _id: data[2].userId };
		});

		it('should work for empty array', () => {
			expect(removeDuplicatedTeamUsers([]).length).to.equal(0);
		});

		it('should work for basic model', () => {
			expect(removeDuplicatedTeamUsers(userList)).to.be.an('array').with.lengthOf(3);
			expect(removeDuplicatedTeamUsers(userList.concat(userList)))
				.to.be.an('array')
				.with.lengthOf(3);
		});

		it('should work for *populated* userIds', () => {
			expect(removeDuplicatedTeamUsers(populatedUserList)).to.be.an('array').with.lengthOf(3);
			expect(removeDuplicatedTeamUsers(populatedUserList.concat(populatedUserList)))
				.to.be.an('array')
				.with.lengthOf(3);
		});

		it('should work for mixed *populated* and NOT *populated* userIds', () => {
			expect(removeDuplicatedTeamUsers(userList.concat(populatedUserList)))
				.to.be.an('array')
				.with.lengthOf(3);
		});

		it('should get empty array for wrong input types', () => {
			expect(removeDuplicatedTeamUsers({})).to.be.an('array').that.is.empty;
			expect(removeDuplicatedTeamUsers('')).to.be.an('array').that.is.empty;
			expect(removeDuplicatedTeamUsers(true)).to.be.an('array').that.is.empty;
			expect(removeDuplicatedTeamUsers(false)).to.be.an('array').that.is.empty;
		});
	});

	describe('arrayRemoveAddDiffs', () => {
		it('should work for empty arrays', () => {
			expect(arrayRemoveAddDiffs([], [])).to.deep.equal({ add: [], remove: [] });
		});

		it('should work for plain arrays', () => {
			expect(arrayRemoveAddDiffs([1], [2])).to.deep.equal({ add: [2], remove: [1] });
			expect(arrayRemoveAddDiffs([1, 2, 3], [2, 4])).to.deep.equal({ add: [4], remove: [1, 3] });
			expect(arrayRemoveAddDiffs(['foo', 'bar'], ['foo', 'baz', 'bar'])).to.deep.equal({ add: ['baz'], remove: [] });
			expect(arrayRemoveAddDiffs(['foo', 'bar'], ['bar'])).to.deep.equal({ add: [], remove: ['foo'] });
		});

		it('should ignore duplicate values', () => {
			expect(arrayRemoveAddDiffs([1, 1, 2], [1, 2])).to.deep.equal({ add: [], remove: [] });
			expect(arrayRemoveAddDiffs([1, 1, 2], [1, 1, 1, 1, 3])).to.deep.equal({ add: [3], remove: [2] });
		});

		it('should work on huge arrays', () => {
			const arr = new Array(2 ** 12).fill(1);
			const arr2 = Array.from(arr);
			arr2.push(2);
			expect(arrayRemoveAddDiffs(arr, arr2)).to.deep.equal({ add: [2], remove: [] });
		});

		it('should use a provided key to compare elements', () => {
			const original = [{ name: 'foo' }, { name: 'bar', data: 1 }];
			const changed = [{ name: 'baz' }, { name: 'bar', data: 2 }];
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

			const original = [{ _id: id1 }, { _id: id2 }];
			const changed = [{ _id: id1 }, { _id: id3 }];
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
			await Promise.all(
				['create', 'patch'].map(async (method) => {
					const { userId, user } = await setupUser();
					expect(userId).to.not.equal(undefined);
					const hook = {
						app,
						method,
						data: {
							userIds: [userId],
						},
					};
					const result = await populateUsersForEachUserIdinHookData(hook);
					expect(result[0]._id.toString()).to.equal(user._id.toString());
					expect(result[0].firstName).to.equal(user.firstName);
					await deleteUser(userId);
				})
			);
		});

		it('should fail for invalid userIds', async () => {
			const { userId } = await setupUser();
			expect(userId).to.not.equal(undefined);
			const hook = {
				app,
				method: 'create',
				data: {
					userIds: [userId, '123456'],
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
			await Promise.all(
				['create', 'patch'].map(async (method) => {
					const { userId, user } = await setupUser();
					expect(userId).to.not.equal(undefined);
					const hook = {
						app,
						method,
						data: {
							userIds: [userId, userId, userId, userId],
						},
					};
					const result = await populateUsersForEachUserIdinHookData(hook);
					expect(result.length).to.equal(1);
					expect(result[0]._id.toString()).to.equal(user._id.toString());
					expect(result[0].firstName).to.equal(user.firstName);
					await deleteUser(userId);
				})
			);
		});

		it('should work for multiple userIds', async () => {
			await Promise.all(
				['create', 'patch'].map(async (method) => {
					const { userId: userId1, user: user1 } = await setupUser();
					const { userId: userId2, user: user2 } = await setupUser();
					const { userId: userId3, user: user3 } = await setupUser();
					const { userId: userId4, user: user4 } = await setupUser();

					const hook = {
						app,
						method,
						data: {
							userIds: [userId1, userId2, userId3, userId4],
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
				})
			);
		});
	});

	describe('getSessionUser', () => {
		it('should fail for invalid sessionUser data', () => {
			const hook = {
				params: {
					account: {
						userId: 'foobar',
					},
				},
			};
			return getSessionUser(hook)
				.then(() => {
					throw new Error('This should not happen due to an invalid sessionUser object');
				})
				.catch((err) => {
					expect(err instanceof NotFound).to.equal(true);
					expect(err.message).to.equal('User not found.');
				});
		});

		it('should return the sessionUser if it is defined in the hook context', () => {
			const hook = {
				params: {
					account: {
						userId: undefined,
					},
				},
				additionalInfosTeam: {
					sessionUser: {
						aaaaa: '#*783dhshad7mad37',
					},
				},
			};
			return getSessionUser(hook).then((sessionUser) => {
				expect(sessionUser).to.deep.equal(hook.additionalInfosTeam.sessionUser);
				expect(hook.additionalInfosTeam.isSuperhero).to.equal(false);
			});
		});

		it('should should set isSuperhero flag according to sessionUser roles', () => {
			const hook = {
				params: {
					account: {
						userId: undefined,
					},
				},
				additionalInfosTeam: {
					sessionUser: {
						roles: [{ name: 'teacher' }, { name: 'superhero' }],
					},
				},
			};
			return getSessionUser(hook).then((sessionUser) => {
				expect(sessionUser).to.deep.equal(hook.additionalInfosTeam.sessionUser);
				expect(hook.additionalInfosTeam.isSuperhero).to.equal(true);
			});
		});

		it('should populate the sessionUser if an account id is set', async () => {
			const { user } = await setupUser('superhero');
			const hook = {
				app,
				params: {
					account: {
						userId: user._id,
					},
				},
				additionalInfosTeam: {},
			};

			await getSessionUser(hook).then((sessionUser) => {
				expect(sessionUser._id).to.deep.equal(user._id);
				expect(sessionUser.firstName).to.deep.equal(user.firstName);
				expect(sessionUser.lastName).to.deep.equal(user.lastName);
				expect(hook.additionalInfosTeam.isSuperhero).to.equal(true);
			});

			await deleteUser(user._id);
		});
	});
});
