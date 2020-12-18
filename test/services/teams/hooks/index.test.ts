import { authenticate } from '@feathersjs/authentication';
import rootPathImport from 'app-root-path';
import { expect } from 'chai';
import mongooseImport from 'mongoose';
import appPromise from '../../../../src/app';
import {
	filterToRelated,
	rejectDefaultFilePermissionUpdatesIfNotPermitted,
} from '../../../../src/services/teams/hooks/index.js';
import teamHelper from '../../helpers/services/teams';
import testObjectsImport from '../../helpers/testObjects';
import { createHook } from '../helper/helper.hook';

const { ObjectId } = mongooseImport.Types;
const reqlib = rootPathImport.require;
const { Forbidden } = reqlib('src/errors');
const { createTestAccount, createTestUser, generateRequestParams } = testObjectsImport(appPromise);

describe('Team service hook tests.', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after((done) => {
		server.close(done);
	});

	describe.skip('sendInfo', () => {});

	describe('filterToRelated', () => {
		let getDeepCopy;
		before(() => {
			const key1 = {
				deepKey1: '<value>',
				deepKey2: '<value>',
				deepKey3: '<value>',
			};
			const key2 = {
				deepKey1: '<value>',
			};
			const key3 = {
				deepKey1: '<value>',
			};
			const baseHook = createHook(app, {
				type: 'after',
				result: {
					key1,
					key2,
					key3,
				},
			});

			getDeepCopy = () => {
				const copy = { ...baseHook };
				baseHook.result = {
					// create 4 new Objects and override
					key1: { ...key1 },
					key2: { ...key2 },
					key3: { ...key3 },
				};
				return copy;
			};
		});
		it('should work for keys as string, deep path as string', () => {
			const filterToRelatedInstance = filterToRelated('deepKey1', 'result.key1');
			const output = filterToRelatedInstance(getDeepCopy());
			const outputExpected = getDeepCopy();
			delete outputExpected.result.key1.deepKey2;
			delete outputExpected.result.key1.deepKey3;
			expect(output).to.deep.equal(outputExpected);
		});

		it('should work for keys as array, deep path as string', () => {
			const filterToRelatedInstance = filterToRelated(['deepKey1', 'deepKey2'], 'result.key1');
			const output = filterToRelatedInstance(getDeepCopy());
			const outputExpected = getDeepCopy();
			delete outputExpected.result.key1.deepKey3;
			expect(output).to.deep.equal(outputExpected);
		});

		it('should work for keys as array, normal path as string', () => {
			const filterToRelatedInstance = filterToRelated(['key1', 'key2'], 'result');
			const output = filterToRelatedInstance(getDeepCopy());
			const outputExpected = getDeepCopy();
			delete outputExpected.result.key3;
			expect(output).to.deep.equal(outputExpected);
		});

		it('should pass local request without changes', () => {
			const filterToRelatedInstance = filterToRelated(['key1', 'key2'], 'result');
			const testHook = getDeepCopy();
			delete testHook.params.provider; // set to local request
			const output = filterToRelatedInstance(testHook);
			const outputExpected = getDeepCopy();
			expect(output).to.deep.equal(outputExpected);
		});

		it('should NOT pass local request without changes if it is disabled', () => {
			const filterToRelatedInstance = filterToRelated(['key1', 'key2'], 'result', false);
			const testHook = getDeepCopy();
			delete testHook.params.provider; // set to local request
			const output = filterToRelatedInstance(testHook);
			const outputExpected = getDeepCopy();
			delete outputExpected.result.key3;
			expect(output).to.deep.equal(outputExpected);
		});

		it('should try an error becouse result is not updated', () => {
			const filterToRelatedInstance = filterToRelated(['key1', 'key2'], 'result');
			const testHook = getDeepCopy();
			delete testHook.params.provider; // set to local request
			const output = filterToRelatedInstance(testHook);
			const outputExpected = getDeepCopy();
			delete outputExpected.result.key3;
			expect(output).to.not.deep.equal(outputExpected);
		});

		it.skip('should work for path as array', () => {
			// todo
		});
	});

	describe('rejectDefaultFilePermissionUpdatesIfNotPermitted', () => {
		const fut = rejectDefaultFilePermissionUpdatesIfNotPermitted;

		it('should not do anything if no data is present', () => {
			const ctx = { foo: 'bar' };
			expect(fut(ctx)).to.deep.equal(ctx);
		});

		it('should only reject changes made to permissions', () => {
			const ctx = { data: { name: 'updatedName' }, method: 'patch' };
			expect(fut(ctx)).to.deep.equal(ctx);
		});

		it('should accept changing default file permissions as team admin', async () => {
			const schoolId = new ObjectId();
			const teams = teamHelper(app, { schoolId });
			const user = await createTestUser({ schoolId, roles: 'teacher' });
			const team = await teams.create(user);
			const credentials = { username: user.email, password: user.email };
			await createTestAccount(credentials, 'local', user);
			const params = { ...(await generateRequestParams(credentials)), query: {} };
			const newFilePermission = {
				write: false,
				read: true,
				create: false,
				delete: false,
			};
			const ctx = await authenticate('jwt')({
				id: team._id,
				params,
				data: { filePermission: newFilePermission },
				app,
				type: 'before',
			});
			const result = await fut(ctx);
			expect(result).to.deep.equal(ctx);
		});

		it('should reject changing default file permissions for all other team members', async () => {
			const schoolId = new ObjectId();
			const teams = teamHelper(app, { schoolId });
			const user = await createTestUser({ schoolId, roles: 'teacher' });
			const user2 = await createTestUser({ schoolId, roles: 'user' });
			const team = await teams.create(user);
			await teams.addTeamUserToTeam(team._id, user2, 'teamexpert');
			const credentials = { username: user2.email, password: user2.email };
			await createTestAccount(credentials, 'local', user2);
			const params = { ...(await generateRequestParams(credentials)), query: {} };
			const newFilePermission = {
				write: false,
				read: true,
				create: false,
				delete: false,
			};
			const ctx = await authenticate('jwt')({
				id: team._id,
				params,
				data: { filePermission: newFilePermission },
				app,
				type: 'before',
			});
			try {
				await fut(ctx);
				expect.fail('The previous call should have failed.');
			} catch (err) {
				expect(err).to.be.instanceOf(Forbidden);
			}
		});
	});
});
