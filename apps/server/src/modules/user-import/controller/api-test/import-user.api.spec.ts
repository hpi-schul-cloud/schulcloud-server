import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import {
	FilterImportUserParams,
	FilterMatchType,
	FilterRoleType,
	FilterUserParams,
	ImportUserListResponse,
	ImportUserResponse,
	ImportUserSortOrder,
	MatchType,
	SortImportUserParams,
	UpdateFlagParams,
	UpdateMatchParams,
	UserMatchListResponse,
	UserMatchResponse,
	UserRole,
} from '@modules/user-import/controller/dto';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PaginationParams } from '@shared/controller';
import { ImportUser, MatchCreator, SchoolEntity, SystemEntity, User } from '@shared/domain/entity';
import { Permission, RoleName, SortOrder } from '@shared/domain/interface';
import { SchoolFeature } from '@shared/domain/types';
import {
	TestApiClient,
	UserAndAccountTestFactory,
	cleanupCollections,
	importUserFactory,
	roleFactory,
	schoolEntityFactory,
	systemEntityFactory,
	userFactory,
} from '@shared/testing';
import { AccountEntity } from '@src/modules/account/domain/entity/account.entity';
import { accountFactory } from '@src/modules/account/testing';
import { IUserImportFeatures, UserImportFeatures } from '../../config';

describe('ImportUser Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;

	let testApiClient: TestApiClient;
	let userImportFeatures: IUserImportFeatures;

	const authenticatedUser = async (
		permissions: Permission[] = [],
		features: SchoolFeature[] = [],
		schoolHasExternalId = true
	) => {
		const system = systemEntityFactory.buildWithId();
		const school = schoolEntityFactory.build({
			officialSchoolNumber: 'foo',
			features,
			systems: [system],
			externalId: schoolHasExternalId ? system.id : undefined,
		});
		const roles = [roleFactory.build({ name: RoleName.ADMINISTRATOR, permissions })];
		await em.persistAndFlush([system, school, ...roles]);
		const user = userFactory.buildWithId({ roles, school });
		const account = accountFactory.withUser(user).buildWithId();
		await em.persistAndFlush([user, account]);
		em.clear();
		return { user, account, roles, school, system };
	};

	const setConfig = (systemId?: string) => {
		userImportFeatures.userMigrationEnabled = true;
		userImportFeatures.userMigrationSystemId = systemId || new ObjectId().toString();
		userImportFeatures.useWithUserLoginMigration = false;
	};

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();

		await app.init();

		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'user/import');
		userImportFeatures = app.get(UserImportFeatures);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(() => {
		setConfig();
	});

	describe('[GET] /user/import', () => {
		let importusers: ImportUser[];
		beforeAll(async () => {
			const { school } = await authenticatedUser();
			importusers = importUserFactory.buildList(10, { school });
			await em.persistAndFlush(importusers);
		});

		afterAll(async () => {
			await em.removeAndFlush(importusers);
		});

		describe('Generic Errors', () => {
			describe('When feature is not enabled', () => {
				let account: AccountEntity;
				beforeEach(async () => {
					({ account } = await authenticatedUser([
						Permission.SCHOOL_IMPORT_USERS_MIGRATE,
						Permission.SCHOOL_IMPORT_USERS_UPDATE,
						Permission.SCHOOL_IMPORT_USERS_VIEW,
					]));
					testApiClient = await testApiClient.login(account);
					userImportFeatures.userMigrationEnabled = false;
					userImportFeatures.userMigrationSystemId = '';
				});

				afterEach(() => {
					setConfig();
				});

				it('System is not set', async () => {
					await testApiClient.get().expect(HttpStatus.INTERNAL_SERVER_ERROR);
				});

				it('GET /user/import is UNAUTHORIZED', async () => {
					await testApiClient.get().expect(HttpStatus.INTERNAL_SERVER_ERROR);
				});

				it('GET /user/import/unassigned is UNAUTHORIZED', async () => {
					await testApiClient.get('unassigned').expect(HttpStatus.INTERNAL_SERVER_ERROR);
				});

				it('PATCH /user/import/:id/match is UNAUTHORIZED', async () => {
					const id = new ObjectId().toString();
					const params: UpdateMatchParams = { userId: new ObjectId().toString() };
					await testApiClient.patch(`${id}/match`).send(params).expect(HttpStatus.INTERNAL_SERVER_ERROR);
				});

				it('DELETE /user/import/:id/match is UNAUTHORIZED', async () => {
					const id = new ObjectId().toString();
					await testApiClient.delete(`${id}/match`).send().expect(HttpStatus.INTERNAL_SERVER_ERROR);
				});

				it('PATCH /user/import/:id/flag is UNAUTHORIZED', async () => {
					const id = new ObjectId().toString();
					const params: UpdateFlagParams = { flagged: true };
					await testApiClient.patch(`${id}/flag`).send(params).expect(HttpStatus.INTERNAL_SERVER_ERROR);
				});

				it('POST /user/import/migrate is UNAUTHORIZED', async () => {
					await testApiClient.post('migrate').send().expect(HttpStatus.INTERNAL_SERVER_ERROR);
				});

				it('POST /user/import/startSync is UNAUTHORIZED', async () => {
					await testApiClient.post('startSync').send().expect(HttpStatus.INTERNAL_SERVER_ERROR);
				});

				it('POST /user/import/startUserMigration is UNAUTHORIZED', async () => {
					await testApiClient.post('startUserMigration').send().expect(HttpStatus.INTERNAL_SERVER_ERROR);
				});
			});

			describe('When authorization is missing', () => {
				let account: AccountEntity;
				let system: SystemEntity;

				beforeEach(async () => {
					({ account, system } = await authenticatedUser());
					testApiClient = await testApiClient.login(account);
					userImportFeatures.userMigrationSystemId = system._id.toString();
				});

				it('GET /user/import is UNAUTHORIZED', async () => {
					await testApiClient.get().expect(HttpStatus.UNAUTHORIZED);
				});

				it('GET /user/import/unassigned is UNAUTHORIZED', async () => {
					await testApiClient.get('unassigned').expect(HttpStatus.UNAUTHORIZED);
				});

				it('PATCH /user/import/:id/match is UNAUTHORIZED', async () => {
					const id = new ObjectId().toString();
					const params: UpdateMatchParams = { userId: new ObjectId().toString() };
					await testApiClient.patch(`${id}/match`).send(params).expect(HttpStatus.UNAUTHORIZED);
				});

				it('DELETE /user/import/:id/match is UNAUTHORIZED', async () => {
					const id = new ObjectId().toString();
					await testApiClient.delete(`${id}/match`).send().expect(HttpStatus.UNAUTHORIZED);
				});

				it('PATCH /user/import/:id/flag is UNAUTHORIZED', async () => {
					const id = new ObjectId().toString();
					const params: UpdateFlagParams = { flagged: true };
					await testApiClient.patch(`${id}/flag`).send(params).expect(HttpStatus.UNAUTHORIZED);
				});

				it('POST /user/import/migrate is UNAUTHORIZED', async () => {
					await testApiClient.post('migrate').send().expect(HttpStatus.UNAUTHORIZED);
				});

				it('POST /user/import/startSync is UNAUTHORIZED', async () => {
					await testApiClient.post('startSync').send().expect(HttpStatus.UNAUTHORIZED);
				});

				it('POST /user/import/startUserMigration is UNAUTHORIZED', async () => {
					await testApiClient.post('startUserMigration').send().expect(HttpStatus.UNAUTHORIZED);
				});
			});

			describe('When school is LDAP Migration Pilot School', () => {
				let account: AccountEntity;
				let school: SchoolEntity;
				let system: SystemEntity;

				beforeEach(async () => {
					({ school, system, account } = await authenticatedUser(
						[Permission.SCHOOL_IMPORT_USERS_VIEW],
						[SchoolFeature.LDAP_UNIVENTION_MIGRATION]
					));
					testApiClient = await testApiClient.login(account);
					userImportFeatures.userMigrationSystemId = system._id.toString();
					userImportFeatures.userMigrationEnabled = false;
				});

				it('GET user/import is authorized, despite feature not enabled', async () => {
					const usermatch = userFactory.build({ school });
					const importuser = importUserFactory.build({ school });
					await em.persistAndFlush([usermatch, importuser]);
					await testApiClient.get().expect(HttpStatus.OK);
				});
			});

			describe('When current user has permission Permission.SCHOOL_IMPORT_USERS_VIEW', () => {
				let account: AccountEntity;
				let school: SchoolEntity;
				let system: SystemEntity;
				beforeEach(async () => {
					({ school, system, account } = await authenticatedUser([Permission.SCHOOL_IMPORT_USERS_VIEW]));
					testApiClient = await testApiClient.login(account);
					userImportFeatures.userMigrationSystemId = system._id.toString();
				});

				it('GET /user/import responds with importusers', async () => {
					const usermatch = userFactory.build({ school });
					const importuser = importUserFactory.build({ school });
					await em.persistAndFlush([usermatch, importuser]);
					await testApiClient.get().expect(HttpStatus.OK);
				});

				it('GET /user/import/unassigned is UNAUTHORIZED', async () => {
					await testApiClient.get('unassigned').expect(HttpStatus.OK);
				});

				it('PATCH /user/import/:id/match is UNAUTHORIZED', async () => {
					const id = new ObjectId().toString();
					const params: UpdateMatchParams = { userId: new ObjectId().toString() };
					await testApiClient.patch(`${id}/match`).send(params).expect(HttpStatus.UNAUTHORIZED);
				});

				it('DELETE /user/import/:id/match is UNAUTHORIZED', async () => {
					const id = new ObjectId().toString();
					await testApiClient.delete(`${id}/match`).send().expect(HttpStatus.UNAUTHORIZED);
				});

				it('PATCH /user/import/:id/flag is UNAUTHORIZED', async () => {
					const id = new ObjectId().toString();
					const params: UpdateFlagParams = { flagged: true };
					await testApiClient.patch(`${id}/flag`).send(params).expect(HttpStatus.UNAUTHORIZED);
				});

				it('POST /user/import/migrate is UNAUTHORIZED', async () => {
					await testApiClient.post('migrate').send().expect(HttpStatus.UNAUTHORIZED);
				});

				it('POST /user/import/startSync is UNAUTHORIZED', async () => {
					await testApiClient.post('startSync').send().expect(HttpStatus.UNAUTHORIZED);
				});

				it('POST /user/import/startUserMigration is UNAUTHORIZED', async () => {
					await testApiClient.post('startUserMigration').send().expect(HttpStatus.UNAUTHORIZED);
				});
			});

			describe('When current user has permission Permission.SCHOOL_IMPORT_USERS_UPDATE', () => {
				let account: AccountEntity;
				let user: User;
				let school: SchoolEntity;
				let system: SystemEntity;

				beforeEach(async () => {
					({ account, school, system, user } = await authenticatedUser([Permission.SCHOOL_IMPORT_USERS_UPDATE]));
					testApiClient = await testApiClient.login(account);
					setConfig(system._id.toString());
				});

				it('GET /user/import is UNAUTHORIZED', async () => {
					const usermatch = userFactory.build({ school });
					const importuser = importUserFactory.build({ school });
					await em.persistAndFlush([usermatch, importuser]);
					em.clear();
					await testApiClient.get().expect(HttpStatus.UNAUTHORIZED);
				});

				it('GET /user/import/unassigned is UNAUTHORIZED', async () => {
					await testApiClient.get('unassigned').expect(HttpStatus.UNAUTHORIZED);
				});

				it('PATCH /user/import/:id/match is allowed', async () => {
					const userMatch = userFactory.build({ school });
					const importUser = importUserFactory.build({ school });
					await em.persistAndFlush([userMatch, importUser]);
					em.clear();
					const params: UpdateMatchParams = { userId: user.id };
					await testApiClient.patch(`${importUser.id}/match`).send(params).expect(HttpStatus.OK);
				});

				it('DELETE /user/import/:id/match is allowed', async () => {
					const userMatch = userFactory.build({ school });
					const importUser = importUserFactory.matched(MatchCreator.AUTO, userMatch).build({ school });
					await em.persistAndFlush([userMatch, importUser]);
					em.clear();
					await testApiClient.delete(`${importUser.id}/match`).send().expect(HttpStatus.OK);
				});

				it('PATCH /user/import/:id/flag is allowed', async () => {
					const importUser = importUserFactory.build({ school });
					await em.persistAndFlush(importUser);
					em.clear();
					const params: UpdateFlagParams = { flagged: true };
					await testApiClient.patch(`${importUser.id}/flag`).send(params).expect(HttpStatus.OK);
				});

				it('POST /user/import/migrate is UNAUTHORIZED', async () => {
					await testApiClient.post('migrate').send().expect(HttpStatus.UNAUTHORIZED);
				});

				it('POST /user/import/startSync is UNAUTHORIZED', async () => {
					await testApiClient.post('startSync').send().expect(HttpStatus.UNAUTHORIZED);
				});

				it('POST /user/import/startUserMigration is UNAUTHORIZED', async () => {
					await testApiClient.post('startUserMigration').send().expect(HttpStatus.UNAUTHORIZED);
				});
			});

			describe('When current user has permissions Permission.SCHOOL_IMPORT_USERS_MIGRATE', () => {
				let account: AccountEntity;
				let system: SystemEntity;

				beforeEach(async () => {
					({ account, system } = await authenticatedUser());
					testApiClient = await testApiClient.login(account);
					setConfig(system._id.toString());
				});

				it('GET /user/import is UNAUTHORIZED', async () => {
					await testApiClient.get().expect(HttpStatus.UNAUTHORIZED);
				});

				it('GET /user/import/unassigned is UNAUTHORIZED', async () => {
					await testApiClient.get('unassigned').expect(HttpStatus.UNAUTHORIZED);
				});

				it('PATCH /user/import/:id/match is UNAUTHORIZED', async () => {
					const id = new ObjectId().toString();
					const params: UpdateMatchParams = { userId: new ObjectId().toString() };
					await testApiClient.patch(`${id}/match`).send(params).expect(HttpStatus.UNAUTHORIZED);
				});

				it('DELETE /user/import/:id/match is UNAUTHORIZED', async () => {
					const id = new ObjectId().toString();
					await testApiClient.delete(`${id}/match`).send().expect(HttpStatus.UNAUTHORIZED);
				});

				it('PATCH /user/import/:id/flag is UNAUTHORIZED', async () => {
					const id = new ObjectId().toString();
					const params: UpdateFlagParams = { flagged: true };
					await testApiClient.patch(`${id}/flag`).send(params).expect(HttpStatus.UNAUTHORIZED);
				});

				it('POST /user/import/migrate is UNAUTHORIZED', async () => {
					await testApiClient.post('migrate').send().expect(HttpStatus.UNAUTHORIZED);
				});

				it('POST /user/import/startSync is UNAUTHORIZED', async () => {
					await testApiClient.post('startSync').send().expect(HttpStatus.UNAUTHORIZED);
				});

				it('POST /user/import/startUserMigration is UNAUTHORIZED', async () => {
					await testApiClient.post('startUserMigration').send().expect(HttpStatus.UNAUTHORIZED);
				});
			});
		});

		describe('Business Errors', () => {
			let account: AccountEntity;
			let school: SchoolEntity;

			beforeEach(async () => {
				({ account, school } = await authenticatedUser([Permission.SCHOOL_IMPORT_USERS_UPDATE]));
				testApiClient = await testApiClient.login(account);
			});

			describe('[setMatch]', () => {
				describe('When set a match on import user', () => {
					it('should fail for different school of match- and import-user', async () => {
						const importUser = importUserFactory.build({ school });
						const otherSchool = schoolEntityFactory.build();
						const userMatch = userFactory.build({ school: otherSchool });
						await em.persistAndFlush([userMatch, importUser]);
						em.clear();
						const params: UpdateMatchParams = { userId: userMatch.id };
						await testApiClient.patch(`${importUser.id}/match`).send(params).expect(HttpStatus.FORBIDDEN);
					});

					it('should fail for different school of current-/authenticated- and import-user', async () => {
						const otherSchool = schoolEntityFactory.build();
						const importUser = importUserFactory.build({ school: otherSchool });
						const userMatch = userFactory.build({ school: otherSchool });
						await em.persistAndFlush([userMatch, importUser]);
						em.clear();
						const params: UpdateMatchParams = { userId: userMatch.id };
						await testApiClient.patch(`${importUser.id}/match`).send(params).expect(HttpStatus.FORBIDDEN);
					});
				});

				describe('When set a match with a single user twice', () => {
					it('should fail', async () => {
						const userMatch = userFactory.build({ school });
						const importUser = importUserFactory.matched(MatchCreator.AUTO, userMatch).build({ school });
						const unmatchedImportUser = importUserFactory.build({ school });
						await em.persistAndFlush([userMatch, importUser]);
						em.clear();
						const params: UpdateMatchParams = { userId: userMatch.id };
						await testApiClient.patch(`${unmatchedImportUser.id}/match`).send(params).expect(HttpStatus.BAD_REQUEST);
					});
				});
			});

			describe('[removeMatch]', () => {
				describe('When remove a match on import user', () => {
					it('should fail for different school of current- and import-user', async () => {
						const otherSchool = schoolEntityFactory.build();
						const importUser = importUserFactory.build({ school: otherSchool });
						await em.persistAndFlush(importUser);
						em.clear();
						await testApiClient.delete(`${importUser.id}/match`).send().expect(HttpStatus.FORBIDDEN);
					});
				});
			});
			describe('[updateFlag]', () => {
				describe('When change flag on import user', () => {
					it('should fail for different school of current- and import-user', async () => {
						const otherSchool = schoolEntityFactory.build();
						const importUser = importUserFactory.build({ school: otherSchool });
						await em.persistAndFlush(importUser);
						em.clear();
						const params: UpdateFlagParams = { flagged: true };
						await testApiClient.patch(`${importUser.id}/flag`).send(params).expect(HttpStatus.FORBIDDEN);
					});
				});
			});
		});

		describe('Acceptance Criteria', () => {
			const expectAllUserMatchResponsePropertiesExist = (match?: UserMatchResponse, withMatch = true) => {
				expect(match).toBeDefined();
				expect(match?.userId).toEqual(expect.any(String));
				expect(match?.firstName).toEqual(expect.stringMatching('John'));
				expect(match?.lastName).toEqual(expect.stringMatching('Doe'));
				expect(match?.loginName).toEqual(expect.stringMatching('user-'));
				expect(match?.roleNames).toEqual(expect.any(Array));
				expect(match?.roleNames.length).toBeGreaterThanOrEqual(1);
				if (withMatch === true) {
					expect(['admin', 'auto']).toContain(match?.matchedBy);
				}
			};

			const expectAllImportUserResponsePropertiesExist = (data: ImportUserResponse, matchExists: boolean) => {
				expect(data).toEqual(
					expect.objectContaining({
						importUserId: expect.any(String),
						firstName: expect.stringMatching('John'),
						lastName: expect.stringMatching('Doe'),
						loginName: expect.stringMatching('john'),
						roleNames: expect.any(Array),
						classNames: expect.any(Array),
						flagged: expect.any(Boolean),
					} as Partial<Record<keyof ImportUserResponse, unknown>>)
				);
				expect(data.roleNames.length).toBeGreaterThanOrEqual(1);
				expect(data.classNames.length).toBeGreaterThanOrEqual(1);
				if (matchExists === true) {
					expectAllUserMatchResponsePropertiesExist(data.match, true);
				} else {
					expect(data.match).toBeUndefined();
				}
			};

			describe('find', () => {
				let account: AccountEntity;
				let school: SchoolEntity;

				beforeEach(async () => {
					await cleanupCollections(em);

					({ account, school } = await authenticatedUser([Permission.SCHOOL_IMPORT_USERS_VIEW]));

					testApiClient = await testApiClient.login(account);
				});

				describe('[findAllUnmatchedUsers]', () => {
					describe('[GET] user/import/unassigned', () => {
						it('should respond with users of own school', async () => {
							const otherSchoolsUser = userFactory.build();
							const currentSchoolsUser = userFactory.build({ school });
							await em.persistAndFlush([otherSchoolsUser, currentSchoolsUser]);
							em.clear();

							const response = await testApiClient.get('unassigned').expect(HttpStatus.OK);

							const listResponse = response.body as UserMatchListResponse;
							expect(listResponse.data.some((elem) => elem.userId === currentSchoolsUser.id)).toEqual(true);
						});

						it.skip('should not respond with assigned users', async () => {
							const otherSchoolsUser = userFactory.build();
							const currentSchoolsUser = userFactory.build({ school });
							const importUser = importUserFactory.matched(MatchCreator.AUTO, currentSchoolsUser).build({ school });
							await em.persistAndFlush([otherSchoolsUser, currentSchoolsUser, importUser]);
							em.clear();

							const response = await testApiClient.get('unassigned').expect(HttpStatus.OK);

							const listResponse = response.body as UserMatchListResponse;
							expect(listResponse.data.some((elem) => elem.userId === currentSchoolsUser.id)).toEqual(false);
						});

						it('should respond userMatch with all properties', async () => {
							const currentSchoolsUser = userFactory.withRoleByName(RoleName.TEACHER).build({
								school,
							});
							await em.persistAndFlush([currentSchoolsUser]);
							em.clear();

							const response = await testApiClient.get('unassigned').expect(HttpStatus.OK);

							const listResponse = response.body as UserMatchListResponse;
							expectAllUserMatchResponsePropertiesExist(listResponse.data[0], false);
						});

						describe('when use pagination', () => {
							it('should skip users', async () => {
								const unassignedUsers = userFactory.buildList(10, { school });
								await em.persistAndFlush(unassignedUsers);
								const query: PaginationParams = { skip: 3 };

								const response = await testApiClient.get('unassigned').query(query).expect(HttpStatus.OK);

								const result = response.body as UserMatchListResponse;
								expect(result.total).toBeGreaterThanOrEqual(10);
								expect(result.data.length).toBeGreaterThanOrEqual(7);
							});

							it('should limit users', async () => {
								const unassignedUsers = userFactory.buildList(10, { school });
								await em.persistAndFlush(unassignedUsers);
								const query: PaginationParams = { limit: 3 };

								const response = await testApiClient.get('unassigned').query(query).expect(HttpStatus.OK);

								const result = response.body as UserMatchListResponse;
								expect(result.total).toBeGreaterThanOrEqual(10);
								expect(result.data).toHaveLength(3);
							});
						});

						describe('when apply filters', () => {
							it('should match name in firstname', async () => {
								const users = userFactory.buildList(10, { school });
								const searchUser = userFactory.build({ school, firstName: 'Peter' });
								users.push(searchUser);
								await em.persistAndFlush(users);
								const query: FilterUserParams = { name: 'ETE' };

								const response = await testApiClient.get('unassigned').query(query).expect(HttpStatus.OK);

								const result = response.body as UserMatchListResponse;
								expect(result.total).toEqual(1);
								expect(result.data.some((u) => u.userId === searchUser.id)).toEqual(true);
							});

							it('should match name in lastname', async () => {
								const users = userFactory.buildList(10, { school });
								const searchUser = userFactory.build({ school, firstName: 'Peter', lastName: 'fox' });
								users.push(searchUser);
								await em.persistAndFlush(users);
								const query: FilterUserParams = { name: 'X' };

								const response = await testApiClient.get('unassigned').query(query).expect(HttpStatus.OK);

								const result = response.body as UserMatchListResponse;
								expect(result.total).toEqual(1);
								expect(result.data.some((u) => u.userId === searchUser.id)).toEqual(true);
							});
						});
					});
				});

				describe('[findAllImportUsers]', () => {
					it('should return importUsers of current school', async () => {
						const otherSchoolsImportUser = importUserFactory.build();
						const currentSchoolsImportUser = importUserFactory.build({
							school,
						});
						await em.persistAndFlush([otherSchoolsImportUser, currentSchoolsImportUser]);
						em.clear();

						const response = await testApiClient.get().expect(HttpStatus.OK);

						const listResponse = response.body as ImportUserListResponse;
						expect(listResponse.data.some((elem) => elem.importUserId === currentSchoolsImportUser.id)).toEqual(true);
						expect(listResponse.data.some((elem) => elem.importUserId === otherSchoolsImportUser.id)).toEqual(false);
						expectAllImportUserResponsePropertiesExist(listResponse.data[0], false);
					});

					it('should return importUsers with all properties including match and roles', async () => {
						const otherSchoolsImportUser = importUserFactory.build();
						const userMatch = userFactory.withRoleByName(RoleName.TEACHER).build({ school });
						const currentSchoolsImportUser = importUserFactory.matched(MatchCreator.AUTO, userMatch).build({ school });
						await em.persistAndFlush([otherSchoolsImportUser, currentSchoolsImportUser]);
						em.clear();

						const response = await testApiClient.get().expect(HttpStatus.OK);

						const listResponse = response.body as ImportUserListResponse;
						expect(listResponse.data.some((elem) => elem.importUserId === currentSchoolsImportUser.id)).toEqual(true);
						expect(listResponse.data.some((elem) => elem.importUserId === otherSchoolsImportUser.id)).toEqual(false);
						expectAllImportUserResponsePropertiesExist(listResponse.data[0], true);
					});

					describe('when use sorting', () => {
						it('should sort by firstname asc', async () => {
							const currentSchoolsImportUsers = importUserFactory.buildList(10, {
								school,
							});
							currentSchoolsImportUsers[3].firstName = 'Anne';
							currentSchoolsImportUsers[7].firstName = 'Zoe';
							await em.persistAndFlush(currentSchoolsImportUsers);
							em.clear();
							const query: SortImportUserParams = {
								sortBy: ImportUserSortOrder.FIRSTNAME,
								sortOrder: SortOrder.asc,
							};

							const response = await testApiClient.get().query(query).expect(HttpStatus.OK);

							const listResponse = response.body as ImportUserListResponse;
							const smallIndex = listResponse.data.findIndex((elem) => elem.firstName === 'Anne');
							const higherIndex = listResponse.data.findIndex((elem) => elem.firstName === 'Zoe');
							expect(smallIndex).toBeLessThan(higherIndex);
						});

						it('should sort by firstname desc', async () => {
							const currentSchoolsImportUsers = importUserFactory.buildList(10, {
								school,
							});
							currentSchoolsImportUsers[3].firstName = 'Anne';
							currentSchoolsImportUsers[7].firstName = 'Zoe';
							await em.persistAndFlush(currentSchoolsImportUsers);
							em.clear();
							const query: SortImportUserParams = {
								sortBy: ImportUserSortOrder.FIRSTNAME,
								sortOrder: SortOrder.desc,
							};

							const response = await testApiClient.get().query(query).expect(HttpStatus.OK);

							const listResponse = response.body as ImportUserListResponse;
							const smallIndex = listResponse.data.findIndex((elem) => elem.firstName === 'Zoe');
							const higherIndex = listResponse.data.findIndex((elem) => elem.firstName === 'Anne');
							expect(smallIndex).toBeLessThan(higherIndex);
						});

						it('should sort by lastname asc', async () => {
							const currentSchoolsImportUsers = importUserFactory.buildList(10, {
								school,
							});
							currentSchoolsImportUsers[3].lastName = 'Schmidt';
							currentSchoolsImportUsers[7].lastName = 'Müller';
							await em.persistAndFlush(currentSchoolsImportUsers);
							em.clear();
							const query: SortImportUserParams = {
								sortBy: ImportUserSortOrder.LASTNAME,
								sortOrder: SortOrder.asc,
							};

							const response = await testApiClient.get().query(query).expect(HttpStatus.OK);

							const listResponse = response.body as ImportUserListResponse;
							const smallIndex = listResponse.data.findIndex((elem) => elem.lastName === 'Müller');
							const higherIndex = listResponse.data.findIndex((elem) => elem.lastName === 'Schmidt');
							expect(smallIndex).toBeLessThan(higherIndex);
						});

						it('should sort by lastname desc', async () => {
							const currentSchoolsImportUsers = importUserFactory.buildList(10, {
								school,
							});
							currentSchoolsImportUsers[3].lastName = 'Schmidt';
							currentSchoolsImportUsers[7].lastName = 'Müller';
							await em.persistAndFlush(currentSchoolsImportUsers);
							em.clear();
							const query: SortImportUserParams = {
								sortBy: ImportUserSortOrder.LASTNAME,
								sortOrder: SortOrder.desc,
							};

							const response = await testApiClient.get().query(query).expect(HttpStatus.OK);

							const listResponse = response.body as ImportUserListResponse;
							const smallIndex = listResponse.data.findIndex((elem) => elem.lastName === 'Schmidt');
							const higherIndex = listResponse.data.findIndex((elem) => elem.lastName === 'Müller');
							expect(smallIndex).toBeLessThan(higherIndex);
						});
					});

					describe('when use pagination', () => {
						it('should skip importusers', async () => {
							const importUsers = importUserFactory.buildList(10, { school });
							await em.persistAndFlush(importUsers);
							const query: PaginationParams = { skip: 3 };

							const response = await testApiClient.get().query(query).expect(HttpStatus.OK);

							const result = response.body as ImportUserListResponse;
							expect(result.total).toBeGreaterThanOrEqual(10);
							expect(result.data.length).toBeGreaterThanOrEqual(7);
						});

						it('should limit importusers', async () => {
							const importUsers = importUserFactory.buildList(10, { school });
							await em.persistAndFlush(importUsers);
							const query: PaginationParams = { limit: 3 };

							const response = await testApiClient.get().query(query).expect(HttpStatus.OK);

							const result = response.body as ImportUserListResponse;
							expect(result.total).toBeGreaterThanOrEqual(10);
							expect(result.data).toHaveLength(3);
						});
					});

					describe('when apply filters', () => {
						it('should filter by firstname', async () => {
							const importUsers = importUserFactory.buildList(10, { school });
							importUsers[0].firstName = 'Klaus-Peter';
							await em.persistAndFlush(importUsers);
							const query: FilterImportUserParams = { firstName: 's-p' };

							const response = await testApiClient.get().query(query).expect(HttpStatus.OK);

							const result = response.body as ImportUserListResponse;
							expect(result.data.length).toEqual(1);
							expect(result.data[0].firstName).toEqual('Klaus-Peter');
						});

						it('should filter by lastname', async () => {
							const importUsers = importUserFactory.buildList(10, { school });
							importUsers[0].lastName = 'Weimann';
							await em.persistAndFlush(importUsers);
							const query: FilterImportUserParams = { lastName: 'Mann' };

							const response = await testApiClient.get().query(query).expect(HttpStatus.OK);

							const result = response.body as ImportUserListResponse;
							expect(result.data.length).toEqual(1);
							expect(result.data[0].lastName).toEqual('Weimann');
						});

						it('should filter by username', async () => {
							const importUsers = importUserFactory.buildList(10, { school });
							importUsers[0].ldapDn = 'uid=EinarWeimann12,...';
							await em.persistAndFlush(importUsers);
							const query: FilterImportUserParams = { loginName: 'Mann1' };

							const response = await testApiClient.get().query(query).expect(HttpStatus.OK);

							const result = response.body as ImportUserListResponse;
							expect(result.data.length).toEqual(1);
							expect(result.data[0].loginName).toEqual('EinarWeimann12');
						});

						it('should filter by one role of student, teacher, or admin', async () => {
							const importUsers = importUserFactory.buildList(10, { school });
							importUsers[0].roleNames = [RoleName.TEACHER];
							await em.persistAndFlush(importUsers);
							const query: FilterImportUserParams = { role: FilterRoleType.TEACHER };

							const response = await testApiClient.get().query(query).expect(HttpStatus.OK);

							const result = response.body as ImportUserListResponse;
							expect(result.data.length).toEqual(1);
							expect(result.data[0].roleNames).toContain(UserRole.TEACHER);
						});

						it('should filter by class', async () => {
							const importUsers = importUserFactory.buildList(10, { school });
							importUsers[0].classNames = ['class1', 'second'];
							await em.persistAndFlush(importUsers);
							const query: FilterImportUserParams = { classes: 'ss1' };

							const response = await testApiClient.get().query(query).expect(HttpStatus.OK);

							const result = response.body as ImportUserListResponse;
							expect(result.data.length).toEqual(1);
							expect(result.data[0].classNames).toContain('class1');
						});

						it('should filter by match type none', async () => {
							const importUsers = importUserFactory.buildList(10, { school });
							importUsers[0].setMatch(userFactory.build({ school }), MatchCreator.AUTO);
							await em.persistAndFlush(importUsers);
							const query: FilterImportUserParams = { match: [FilterMatchType.NONE] };

							const response = await testApiClient.get().query(query).expect(HttpStatus.OK);

							const result = response.body as ImportUserListResponse;
							expect(result.data.some((iu) => iu.match?.matchedBy !== MatchType.AUTO)).toEqual(true);
							expect(result.data.some((iu) => iu.match?.matchedBy !== MatchType.MANUAL)).toEqual(true);
							expect(result.data.length).toEqual(9);
						});

						it('should filter by match type none also deleted matches', async () => {
							const importUsers = importUserFactory.buildList(10, { school });
							importUsers[0].setMatch(userFactory.build({ school }), MatchCreator.AUTO);
							await em.persistAndFlush(importUsers);
							importUsers[0].revokeMatch();
							await em.persistAndFlush(importUsers);
							const query: FilterImportUserParams = { match: [FilterMatchType.NONE] };

							const response = await testApiClient.get().query(query).expect(HttpStatus.OK);

							const result = response.body as ImportUserListResponse;
							expect(result.data.some((iu) => iu.match?.matchedBy !== MatchType.AUTO)).toEqual(true);
							expect(result.data.some((iu) => iu.match?.matchedBy !== MatchType.MANUAL)).toEqual(true);
							expect(result.data.length).toEqual(10);
						});

						it('should filter by match type admin (manual)', async () => {
							const importUsers = importUserFactory.buildList(10, { school });
							importUsers[0].setMatch(userFactory.build({ school }), MatchCreator.MANUAL);
							await em.persistAndFlush(importUsers);
							const query: FilterImportUserParams = { match: [FilterMatchType.MANUAL] };

							const response = await testApiClient.get().query(query).expect(HttpStatus.OK);

							const result = response.body as ImportUserListResponse;
							expect(result.data.some((iu) => iu.match?.matchedBy === MatchType.MANUAL)).toEqual(true);
							expect(result.data.some((iu) => iu.match?.matchedBy !== MatchType.MANUAL)).toEqual(false);
							expect(result.data.length).toEqual(1);
						});

						it('should filter by match type auto', async () => {
							const importUsers = importUserFactory.buildList(10, { school });
							importUsers[0].setMatch(userFactory.build({ school }), MatchCreator.AUTO);
							await em.persistAndFlush(importUsers);
							const query: FilterImportUserParams = { match: [FilterMatchType.AUTO] };

							const response = await testApiClient.get().query(query).expect(HttpStatus.OK);

							const result = response.body as ImportUserListResponse;
							expect(result.data.some((iu) => iu.match?.matchedBy === MatchType.AUTO)).toEqual(true);
							expect(result.data.some((iu) => iu.match?.matchedBy !== MatchType.AUTO)).toEqual(false);
							expect(result.data.length).toEqual(1);
						});

						it('should filter by multiple match types', async () => {
							const importUsers = importUserFactory.buildList(10, { school });
							importUsers[0].setMatch(userFactory.build({ school }), MatchCreator.MANUAL);
							importUsers[1].setMatch(userFactory.build({ school }), MatchCreator.AUTO);
							await em.persistAndFlush(importUsers);
							const query: FilterImportUserParams = {
								match: [FilterMatchType.AUTO, FilterMatchType.MANUAL],
							};

							const response = await testApiClient.get().query(query).expect(HttpStatus.OK);

							const result = response.body as ImportUserListResponse;
							expect(result.data.some((iu) => iu.match?.matchedBy === MatchType.MANUAL)).toEqual(true);
							expect(result.data.some((iu) => iu.match?.matchedBy === MatchType.AUTO)).toEqual(true);
							expect(result.data.length).toEqual(2);
						});

						it('should filter by flag enabled', async () => {
							const importUsers = importUserFactory.buildList(10, { school });
							importUsers[0].flagged = true;
							await em.persistAndFlush(importUsers);
							const query: FilterImportUserParams = { flagged: true };

							const response = await testApiClient.get().query(query).expect(HttpStatus.OK);

							const result = response.body as ImportUserListResponse;
							expect(result.data.some((iu) => iu.flagged === false)).toEqual(false);
							expect(result.data.some((iu) => iu.flagged === true)).toEqual(true);
							expect(result.data.length).toEqual(1);
						});
					});
				});
			});

			describe('updates', () => {
				let account: AccountEntity;
				let school: SchoolEntity;

				beforeEach(async () => {
					({ account, school } = await authenticatedUser([Permission.SCHOOL_IMPORT_USERS_UPDATE]));
					testApiClient = await testApiClient.login(account);
				});

				describe('[setMatch]', () => {
					describe('[PATCH] user/import/:id/match', () => {
						it('should set a manual match', async () => {
							const userToBeMatched = userFactory.withRoleByName(RoleName.STUDENT).build({
								school,
							});
							const unmatchedImportUser = importUserFactory.build({
								school,
							});
							await em.persistAndFlush([userToBeMatched, unmatchedImportUser]);
							em.clear();
							const params: UpdateMatchParams = { userId: userToBeMatched.id };

							const result = await testApiClient
								.patch(`${unmatchedImportUser.id}/match`)
								.send(params)
								.expect(HttpStatus.OK);

							const importUserResponse = result.body as ImportUserResponse;
							expectAllImportUserResponsePropertiesExist(importUserResponse, true);
							expect(importUserResponse.match?.matchedBy).toEqual(MatchType.MANUAL);
							expect(importUserResponse.match?.userId).toEqual(userToBeMatched.id);
						});

						it('should update an existing auto match to manual', async () => {
							const userMatch = userFactory.withRoleByName(RoleName.STUDENT).build({
								school,
							});
							const alreadyMatchedImportUser = importUserFactory.matched(MatchCreator.AUTO, userMatch).build({
								school,
							});
							const manualUserMatch = userFactory.withRoleByName(RoleName.STUDENT).build({
								school,
							});
							await em.persistAndFlush([userMatch, alreadyMatchedImportUser, manualUserMatch]);
							em.clear();
							const params: UpdateMatchParams = { userId: manualUserMatch.id };

							const result = await testApiClient
								.patch(`${alreadyMatchedImportUser.id}/match`)
								.send(params)
								.expect(HttpStatus.OK);

							const elem = result.body as ImportUserResponse;
							expectAllImportUserResponsePropertiesExist(elem, true);
							expect(elem.match?.matchedBy).toEqual(MatchType.MANUAL);
							expect(elem.match?.userId).toEqual(manualUserMatch.id);
						});
					});
				});

				describe('[removeMatch]', () => {
					describe('[DELETE] user/import/:id/match', () => {
						it('should remove a match', async () => {
							const userMatch = userFactory.withRoleByName(RoleName.STUDENT).build({
								school,
							});
							const importUserWithMatch = importUserFactory.matched(MatchCreator.AUTO, userMatch).build({
								school,
							});
							await em.persistAndFlush([importUserWithMatch]);
							em.clear();

							const result = await testApiClient.delete(`${importUserWithMatch.id}/match`).send().expect(HttpStatus.OK);

							expectAllImportUserResponsePropertiesExist(result.body as ImportUserResponse, false);
						});

						it('should not fail when importuser is not having a match', async () => {
							const importUserWithoutMatch = importUserFactory.build({
								school,
							});
							await em.persistAndFlush([importUserWithoutMatch]);
							em.clear();

							const result = await testApiClient
								.delete(`${importUserWithoutMatch.id}/match`)
								.send()
								.expect(HttpStatus.OK);

							expectAllImportUserResponsePropertiesExist(result.body as ImportUserResponse, false);
						});
					});
				});

				describe('[updateFlag]', () => {
					describe('[PATCH] user/import/:id/flag', () => {
						it('should add a flag', async () => {
							const importUser = importUserFactory.build({
								school,
							});
							await em.persistAndFlush([importUser]);
							em.clear();
							const params: UpdateFlagParams = { flagged: true };

							const result = await testApiClient.patch(`${importUser.id}/flag`).send(params).expect(HttpStatus.OK);

							const response = result.body as ImportUserResponse;
							expectAllImportUserResponsePropertiesExist(response, false);
							expect(response.flagged).toEqual(true);
						});

						it('should remove a flag', async () => {
							const importUser = importUserFactory.build({
								school,
								flagged: true,
							});
							await em.persistAndFlush([importUser]);
							em.clear();
							const params: UpdateFlagParams = { flagged: false };

							const result = await testApiClient.patch(`${importUser.id}/flag`).send(params).expect(HttpStatus.OK);

							const response = result.body as ImportUserResponse;
							expectAllImportUserResponsePropertiesExist(response, false);
							expect(response.flagged).toEqual(false);
						});
					});
				});
			});

			describe('[migrate]', () => {
				let account: AccountEntity;
				let school: SchoolEntity;

				beforeEach(async () => {
					({ account, school } = await authenticatedUser([Permission.SCHOOL_IMPORT_USERS_MIGRATE]));
					school.officialSchoolNumber = 'foo';
					school.inMaintenanceSince = new Date();
					school.externalId = 'foo';
					school.inUserMigration = true;
					testApiClient = await testApiClient.login(account);
				});

				describe('POST user/import/migrate', () => {
					it('should migrate', async () => {
						school.officialSchoolNumber = 'foo';

						const importUser = importUserFactory.build({
							school,
						});
						await em.persistAndFlush([importUser]);
						em.clear();

						await testApiClient.post('migrate').expect(HttpStatus.CREATED);
					});
				});
			});

			describe('[startUserMigration]', () => {
				let account: AccountEntity;
				let system: SystemEntity;

				describe('POST user/import/startUserMigration', () => {
					it('should set in user migration mode', async () => {
						({ account, system } = await authenticatedUser([Permission.SCHOOL_IMPORT_USERS_MIGRATE]));
						testApiClient = await testApiClient.login(account);
						userImportFeatures.userMigrationSystemId = system._id.toString();

						await testApiClient.post('startUserMigration').expect(HttpStatus.CREATED);
					});
				});
			});

			describe('[endSchoolMaintenance]', () => {
				describe('POST user/import/startSync', () => {
					it('should remove inMaintenanceSince from school', async () => {
						const school = schoolEntityFactory.buildWithId({
							externalId: 'foo',
							inMaintenanceSince: new Date(),
							inUserMigration: false,
						});
						const roles = [
							roleFactory.build({
								name: RoleName.ADMINISTRATOR,
								permissions: [Permission.SCHOOL_IMPORT_USERS_MIGRATE],
							}),
						];
						await em.persistAndFlush([school, ...roles]);

						const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school }, [
							Permission.SCHOOL_IMPORT_USERS_MIGRATE,
						]);

						await em.persistAndFlush([adminUser, adminAccount]);
						em.clear();

						testApiClient = await testApiClient.login(adminAccount);

						await testApiClient.post('startSync').expect(HttpStatus.CREATED);
					});
				});
			});
		});
	});
});
