import { LegacyLogger } from '@core/logger';
import { createMock } from '@golevelup/ts-jest';
import { type EntityData, type FindOptions, NotFoundError, type QueryOrderMap } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { RoleName } from '@modules/role';
import type { Role } from '@modules/role/repo';
import { roleFactory } from '@modules/role/testing';
import { SchoolEntity } from '@modules/school/repo';
import { schoolEntityFactory } from '@modules/school/testing';
import type { SystemEntity } from '@modules/system/repo';
import { systemEntityFactory } from '@modules/system/testing';
import { Test, type TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common/error';
import { RoleReference } from '@shared/domain/domainobject';
import { type IFindOptions, LanguageType, SortOrder } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { MultipleUsersFoundLoggableException, UserDiscoverableQuery, type UserDo } from '../domain';
import { userDoFactory, userFactory } from '../testing';
import { UserDoMikroOrmRepo } from './user-do.repo';
import { User } from './user.entity';

describe('UserRepo', () => {
	let module: TestingModule;
	let repo: UserDoMikroOrmRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [User] })],
			providers: [
				UserDoMikroOrmRepo,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();
		repo = module.get(UserDoMikroOrmRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.findById).toEqual('function');
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(User);
	});

	describe('findById', () => {
		it('should find user without populating roles', async () => {
			const user = userFactory.buildWithId();

			await em.persist(user).flush();

			const result = await repo.findById(user.id);

			expect(result.id).toEqual(user.id);
			expect(result.roles).toEqual([]);
		});

		it('should find user and populate roles', async () => {
			const roles3 = roleFactory.buildList(1);
			await em.persist(roles3).flush();

			const roles2 = roleFactory.buildList(1, { roles: roles3 });
			await em.persist(roles2).flush();

			const roles1 = roleFactory.buildList(1, { roles: roles2 });
			await em.persist(roles1).flush();

			const user = userFactory.build({ roles: roles1 });
			await em.persist([user]).flush();

			em.clear();

			const result = await repo.findById(user.id, true);

			expect(result.id).toEqual(user.id);
			expect(result.roles).toEqual([
				{
					id: roles1[0].id,
					name: roles1[0].name,
				},
			]);
		});

		it('should find user and populate secondary schools', async () => {
			const school = schoolEntityFactory.buildWithId();
			const role = roleFactory.buildWithId();
			await em.persist([school, role]).flush();
			const user = userFactory.buildWithId({ secondarySchools: [{ school, role }] });
			await em.persist(user).flush();

			em.clear();

			const result = await repo.findById(user.id, true);

			expect(result.secondarySchools).toEqual([{ schoolId: school.id, role: { id: role.id, name: role.name } }]);
		});

		it('should throw if user cannot be found', async () => {
			await expect(repo.findById(new ObjectId().toHexString(), false)).rejects.toThrow(NotFoundError);
		});
	});

	describe('findByExternalId', () => {
		describe('when one user was found', () => {
			const externalId = 'externalId';
			let system: SystemEntity;
			let school: SchoolEntity;
			let user: User;

			beforeEach(async () => {
				system = systemEntityFactory.buildWithId();
				school = schoolEntityFactory.buildWithId();
				school.systems.add(system);
				user = userFactory.buildWithId({ externalId, school });

				await em.persist([user, system, school]).flush();
			});

			it('should find a user by its external id', async () => {
				const result = await repo.findByExternalId(user.externalId as string, system.id);

				expect(result).toEqual(
					expect.objectContaining({
						id: user.id,
						externalId: user.externalId,
						schoolId: school.id,
					})
				);
			});

			it('should return null if no user with external id was found', async () => {
				await em.nativeDelete(User, {});

				const result = await repo.findByExternalId(user.externalId as string, system.id);

				expect(result).toBeNull();
			});

			it('should return null if school has no corresponding system', async () => {
				school.systems.removeAll();

				const result = await repo.findByExternalId(user.externalId as string, system.id);

				expect(result).toBeNull();
			});
		});

		describe('when multiple users were found with the same system', () => {
			const externalId = 'externalId';
			let system: SystemEntity;
			let school: SchoolEntity;
			let users: User[];

			beforeEach(async () => {
				system = systemEntityFactory.buildWithId();
				school = schoolEntityFactory.buildWithId();
				school.systems.add(system);
				users = userFactory.buildList(2, { externalId, school });

				await em.persist([...users, system, school]).flush();
			});

			it('should throw error', async () => {
				await expect(repo.findByExternalId(users[0].externalId as string, system.id)).rejects.toThrow(
					new MultipleUsersFoundLoggableException(externalId)
				);
			});
		});

		describe('when two users have the same external id but different systems', () => {
			it('should return the user of the requested system', async () => {
				const system1 = systemEntityFactory.buildWithId();
				const system2 = systemEntityFactory.buildWithId();
				const school1 = schoolEntityFactory.buildWithId();
				const school2 = schoolEntityFactory.buildWithId();
				school1.systems.add(system1);
				school2.systems.add(system2);
				const user1 = userFactory.buildWithId({ externalId: 'externalId', school: school1 });
				const user2 = userFactory.buildWithId({ externalId: 'externalId', school: school2 });

				await em.persist([system1, system2, school1, school2, user1, user2]).flush();

				const result = await repo.findByExternalId(user2.externalId as string, system2.id);

				expect(result).toEqual(
					expect.objectContaining({
						id: user2.id,
						externalId: user2.externalId,
						schoolId: school2.id,
					})
				);
			});
		});
	});

	describe('findByExternalIdOrFail', () => {
		const externalId = 'externalId';
		let system: SystemEntity;
		let school: SchoolEntity;
		let user: User;

		beforeEach(async () => {
			system = systemEntityFactory.buildWithId();
			school = schoolEntityFactory.buildWithId();
			school.systems.add(system);
			user = userFactory.buildWithId({ externalId, school });

			await em.persist([user, system, school]).flush();
		});

		it('should find a user by its external id', async () => {
			const result = await repo.findByExternalIdOrFail(user.externalId as string, system.id);

			expect(result).toEqual(
				expect.objectContaining({
					id: user.id,
					externalId: user.externalId,
					schoolId: school.id,
				})
			);
		});

		describe('when no user with external id was found', () => {
			it('should fail', async () => {
				await em.nativeDelete(User, {});
				await expect(repo.findByExternalIdOrFail(user.externalId as string, system.id)).rejects.toThrow(
					EntityNotFoundError
				);
			});
		});
	});

	describe('findByEmail', () => {
		it('should find user by email', async () => {
			const originalUsername = 'USER@EXAMPLE.COM';
			const user = userFactory.build({ email: originalUsername });
			await em.persist([user]).flush();
			em.clear();

			const result = await repo.findByEmail('USER@EXAMPLE.COM');
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(expect.objectContaining({ email: originalUsername }));
		});

		it('should find user by email, ignoring case', async () => {
			const originalUsername = 'USER@EXAMPLE.COM';
			const user = userFactory.build({ email: originalUsername });
			await em.persist([user]).flush();
			em.clear();

			const result = await repo.findByEmail('USER@example.COM');
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(expect.objectContaining({ email: originalUsername }));

			const result2 = await repo.findByEmail('user@example.com');
			expect(result2).toHaveLength(1);
			expect(result2[0]).toEqual(expect.objectContaining({ email: originalUsername }));
		});

		it('should not find by wildcard', async () => {
			const originalUsername = 'USER@EXAMPLE.COM';
			const user = userFactory.build({ email: originalUsername });
			await em.persist([user]).flush();
			em.clear();

			const result = await repo.findByEmail('USER@EXAMPLECCOM');
			expect(result).toHaveLength(0);

			const result2 = await repo.findByEmail('.*');
			expect(result2).toHaveLength(0);
		});

		it('should populate the roles', async () => {
			const email = 'USER@EXAMPLE.COM';
			const role = roleFactory.buildWithId();
			const user = userFactory.build({ email, roles: [role] });
			await em.persist([user]).flush();
			em.clear();

			const result = await repo.findByEmail(email);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(
				expect.objectContaining({
					email,
					roles: [
						new RoleReference({
							id: role.id,
							name: role.name,
						}),
					],
				})
			);
		});
	});

	describe('mapEntityToDO', () => {
		it('should return a domain object', () => {
			const id = new ObjectId();
			const secondarySchools = [
				{
					role: roleFactory.buildWithId(),
					school: schoolEntityFactory.buildWithId(),
				},
			];
			const testEntity: User = userFactory.buildWithId(
				{
					email: 'email@email.email',
					firstName: 'firstName',
					lastName: 'lastName',
					school: schoolEntityFactory.buildWithId(),
					secondarySchools,
					ldapDn: 'ldapDn',
					externalId: 'externalId',
					language: LanguageType.DE,
					forcePasswordChange: false,
					preferences: { firstLogin: true },
					birthday: new Date(),
				},
				id.toHexString()
			);
			const role = roleFactory.buildWithId();
			testEntity.roles.add(role);
			testEntity.importHash = 'importHash';
			testEntity.outdatedSince = new Date();
			testEntity.lastLoginSystemChange = new Date();
			testEntity.previousExternalId = 'someId';

			const userDO = repo.mapEntityToDO(testEntity);

			expect(userDO).toEqual(
				expect.objectContaining({
					id: testEntity.id,
					updatedAt: testEntity.updatedAt,
					createdAt: testEntity.createdAt,
					email: testEntity.email,
					firstName: testEntity.firstName,
					lastName: testEntity.lastName,
					preferredName: testEntity.preferredName,
					schoolId: testEntity.school.id,
					secondarySchools: [
						{
							schoolId: secondarySchools[0].school.id,
							role: {
								id: secondarySchools[0].role.id,
								name: secondarySchools[0].role.name,
							},
						},
					],
					roles: [
						{
							id: role.id,
							name: role.name,
						},
					],
					ldapDn: testEntity.ldapDn,
					externalId: testEntity.externalId,
					importHash: testEntity.importHash,
					language: testEntity.language,
					forcePasswordChange: testEntity.forcePasswordChange,
					preferences: testEntity.preferences,
					outdatedSince: testEntity.outdatedSince,
					lastLoginSystemChange: testEntity.lastLoginSystemChange,
					previousExternalId: testEntity.previousExternalId,
					birthday: testEntity.birthday,
				})
			);
		});
	});

	describe('mapDOToEntityProperties', () => {
		it('should map DO to Entity Properties', () => {
			const testDO = userDoFactory.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.USER }]).buildWithId(
				{
					email: 'email@email.email',
					firstName: 'firstName',
					lastName: 'lastName',
					preferredName: 'preferredName',
					schoolId: new ObjectId().toHexString(),
					secondarySchools: [
						{
							schoolId: new ObjectId().toHexString(),
							role: { id: new ObjectId().toHexString(), name: RoleName.USER },
						},
					],
					ldapDn: 'ldapDn',
					externalId: 'externalId',
					language: LanguageType.DE,
					forcePasswordChange: false,
					preferences: { firstLogin: true },
					outdatedSince: new Date(),
					lastLoginSystemChange: new Date(),
					previousExternalId: 'someId',
					birthday: new Date(),
				},
				'testId'
			);

			const result = repo.mapDOToEntityProperties(testDO);

			expect(result).toEqual<EntityData<User>>({
				email: testDO.email,
				firstName: testDO.firstName,
				lastName: testDO.lastName,
				preferredName: testDO.preferredName,
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				school: expect.objectContaining<Partial<SchoolEntity>>({ id: testDO.schoolId }),
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				roles: [expect.objectContaining<Partial<Role>>({ id: testDO.roles[0].id })],
				secondarySchools: [
					expect.objectContaining({
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						school: expect.objectContaining({ id: testDO.secondarySchools[0].schoolId }),
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						role: expect.objectContaining({ id: testDO.secondarySchools[0].role.id }),
					}),
				],
				ldapDn: testDO.ldapDn,
				externalId: testDO.externalId,
				language: testDO.language,
				forcePasswordChange: testDO.forcePasswordChange,
				preferences: testDO.preferences,
				outdatedSince: testDO.outdatedSince,
				lastLoginSystemChange: testDO.lastLoginSystemChange,
				previousExternalId: testDO.previousExternalId,
				birthday: testDO.birthday,
			});
		});
	});

	describe('find() is called', () => {
		describe('usecases', () => {
			describe('when searching by school and role', () => {
				const setup = async () => {
					const school = schoolEntityFactory.buildWithId();
					const otherSchool = schoolEntityFactory.buildWithId();
					const role = roleFactory.buildWithId();
					const otherRole = roleFactory.buildWithId();
					const userWithSchoolAndRole = userFactory.buildWithId({ school, roles: [role] });
					const userWithSchoolAndMultipleRoles = userFactory.buildWithId({ school, roles: [role, otherRole] });
					const userWithDifferentSchool = userFactory.buildWithId({ school: otherSchool, roles: [role] });
					const userWithDifferentRole = userFactory.buildWithId({ school, roles: [otherRole] });
					const query = {
						schoolId: school.id,
						roleId: role.id,
					};

					await em
						.persist([
							userWithSchoolAndMultipleRoles,
							userWithSchoolAndRole,
							userWithDifferentSchool,
							userWithDifferentRole,
						])
						.flush();

					return {
						userWithDifferentRole,
						userWithDifferentSchool,
						userWithSchoolAndMultipleRoles,
						userWithSchoolAndRole,
						query,
					};
				};

				it('should find user with school and role', async () => {
					const { query, userWithSchoolAndRole } = await setup();

					const result = await repo.find(query);

					expect(result.data).toContainEqual(expect.objectContaining({ id: userWithSchoolAndRole.id }));
				});

				it('should find user with school and multiple roles', async () => {
					const { query, userWithSchoolAndMultipleRoles } = await setup();

					const result = await repo.find(query);

					expect(result.data).toContainEqual(expect.objectContaining({ id: userWithSchoolAndMultipleRoles.id }));
				});

				it('should not find user with school, but different role', async () => {
					const { query, userWithDifferentRole } = await setup();

					const result = await repo.find(query);

					expect(result.data).not.toContainEqual(expect.objectContaining({ id: userWithDifferentRole.id }));
				});

				it('should not find user with role, but different school', async () => {
					const { query, userWithDifferentSchool } = await setup();

					const result = await repo.find(query);

					expect(result.data).not.toContainEqual(expect.objectContaining({ id: userWithDifferentSchool.id }));
				});
			});

			describe('when searching for discoverable users', () => {
				const setup = async () => {
					const school = schoolEntityFactory.buildWithId();
					const otherSchool = schoolEntityFactory.buildWithId();
					const role = roleFactory.buildWithId();
					const otherRole = roleFactory.buildWithId();
					const userOptedIn = userFactory.buildWithId({ school, roles: [role], discoverable: true });
					const userOptedOut = userFactory.buildWithId({ school, roles: [role, otherRole], discoverable: false });
					const userUndecided = userFactory.buildWithId({ school, roles: [role] });
					const userWithDifferentRole = userFactory.buildWithId({ school, roles: [otherRole] });
					const userWithDifferentSchool = userFactory.buildWithId({ school: otherSchool, roles: [role] });

					await em
						.persist([userOptedIn, userOptedOut, userUndecided, userWithDifferentRole, userWithDifferentSchool])
						.flush();

					return {
						userOptedOut,
						userOptedIn,
						userUndecided,
						userWithDifferentRole,
						userWithDifferentSchool,
						schoolId: school.id,
						roleId: role.id,
					};
				};

				describe('with discoverable: "true"', () => {
					it('should find user with discoverable: true', async () => {
						const { schoolId, roleId, userOptedIn } = await setup();

						const result = await repo.find({ schoolId, roleId, discoverable: UserDiscoverableQuery.TRUE });

						expect(result.data).toContainEqual(expect.objectContaining({ id: userOptedIn.id }));
					});

					it('should not find user with discoverable: false', async () => {
						const { schoolId, roleId, userOptedOut } = await setup();

						const result = await repo.find({ schoolId, roleId, discoverable: UserDiscoverableQuery.TRUE });

						expect(result.data).not.toContainEqual(expect.objectContaining({ id: userOptedOut.id }));
					});

					it('should not find user with discoverable: undefined', async () => {
						const { schoolId, roleId, userUndecided } = await setup();

						const result = await repo.find({ schoolId, roleId, discoverable: UserDiscoverableQuery.TRUE });

						expect(result.data).not.toContainEqual(expect.objectContaining({ id: userUndecided.id }));
					});
				});

				describe('with discoverable: "not-false"', () => {
					it('should find user with discoverable: true', async () => {
						const { schoolId, roleId, userOptedIn } = await setup();

						const result = await repo.find({ schoolId, roleId, discoverable: UserDiscoverableQuery.NOT_FALSE });

						expect(result.data).toContainEqual(expect.objectContaining({ id: userOptedIn.id }));
					});

					it('should find user with discoverable: undefined', async () => {
						const { schoolId, roleId, userUndecided } = await setup();

						const result = await repo.find({ schoolId, roleId, discoverable: UserDiscoverableQuery.NOT_FALSE });

						expect(result.data).toContainEqual(expect.objectContaining({ id: userUndecided.id }));
					});

					it('should not find user with discoverable: false', async () => {
						const { schoolId, roleId, userOptedOut } = await setup();

						const result = await repo.find({ schoolId, roleId, discoverable: UserDiscoverableQuery.NOT_FALSE });

						expect(result.data).not.toContainEqual(expect.objectContaining({ id: userOptedOut.id }));
					});
				});

				it('should not find user with different role', async () => {
					const { schoolId, roleId, userWithDifferentRole } = await setup();

					const result = await repo.find({ schoolId, roleId, discoverable: UserDiscoverableQuery.TRUE });

					expect(result.data).not.toContainEqual(expect.objectContaining({ id: userWithDifferentRole.id }));
				});

				it('should not find user with different school', async () => {
					const { schoolId, roleId, userWithDifferentSchool } = await setup();

					const result = await repo.find({ schoolId, roleId, discoverable: UserDiscoverableQuery.TRUE });

					expect(result.data).not.toContainEqual(expect.objectContaining({ id: userWithDifferentSchool.id }));
				});
			});
		});

		const setupFind = async () => {
			let query = {
				schoolId: undefined,
				isOutdated: undefined,
				lastLoginSystemChangeSmallerThan: undefined,
				outdatedSince: undefined,
				lastLoginSystemChangeBetweenEnd: undefined,
				lastLoginSystemChangeBetweenStart: undefined,
			};
			const deletedFilter = {
				$or: [{ deletedAt: { $exists: false } }, { deletedAt: null }, { deletedAt: { $gte: expect.any(Date) } }],
			};

			query = { ...query, ...deletedFilter };

			const options: IFindOptions<UserDo> = {};

			await em.nativeDelete(User, {});
			await em.nativeDelete(SchoolEntity, {});

			const userA = userFactory.buildWithId({ firstName: 'A' });
			const userB = userFactory.buildWithId({ firstName: 'B' });
			const userC = userFactory.buildWithId({ firstName: 'C' });
			const users = [userA, userB, userC];
			await em.persist(users).flush();

			const emFindAndCountSpy = jest.spyOn(em, 'findAndCount');

			return { query, options, users, emFindAndCountSpy, deletedFilter };
		};

		describe('sorting', () => {
			it('should create queryOrderMap with options.order', async () => {
				const { query, options, emFindAndCountSpy, deletedFilter } = await setupFind();
				options.order = {
					id: SortOrder.asc,
				};

				await repo.find(query, options);

				expect(emFindAndCountSpy).toHaveBeenCalledWith(
					User,
					deletedFilter,
					expect.objectContaining<FindOptions<User>>({
						orderBy: expect.objectContaining<QueryOrderMap<User>>({ _id: options.order.id }) as QueryOrderMap<User>,
					})
				);
			});

			it('should create queryOrderMap with an empty object', async () => {
				const { query, options, emFindAndCountSpy, deletedFilter } = await setupFind();
				options.order = undefined;

				await repo.find(query, options);

				expect(emFindAndCountSpy).toHaveBeenCalledWith(
					User,
					deletedFilter,
					expect.objectContaining<FindOptions<User>>({
						orderBy: expect.objectContaining<QueryOrderMap<User>>({}) as QueryOrderMap<User>,
					})
				);
			});
		});

		describe('pagination', () => {
			describe('when options with pagination is set to undefined', () => {
				it('should return all users ', async () => {
					const { query, users } = await setupFind();

					const page = await repo.find(query, undefined);

					expect(page.data.length).toBe(users.length);
				});
			});

			describe('when limit and skip of pagination is undefined', () => {
				it('should set limit and skip to undefined in options', async () => {
					const { query, emFindAndCountSpy } = await setupFind();

					await repo.find(query, { pagination: { limit: undefined, skip: undefined } });

					expect(emFindAndCountSpy).toHaveBeenCalledWith(
						User,
						query,
						expect.objectContaining({
							offset: undefined,
							limit: undefined,
						})
					);
				});
			});

			describe(' when pagination has a limit of 1', () => {
				it('should return one user', async () => {
					const { query, options } = await setupFind();
					options.pagination = { limit: 1 };

					const page = await repo.find(query, options);

					expect(page.data.length).toBe(1);
				});
			});

			describe('pagination has a limit of 1 and skip is set to 2', () => {
				it('should return no user', async () => {
					const { query, options } = await setupFind();
					options.pagination = { limit: 1, skip: 3 };

					const page = await repo.find(query, options);

					expect(page.data.length).toBe(0);
				});
			});
		});

		describe('order', () => {
			it('should return users ordered by default _id when no order is specified', async () => {
				const { query, options, users } = await setupFind();

				const page = await repo.find(query, options);

				expect(page.data[0].id).toEqual(users[0].id);
				expect(page.data[1].id).toEqual(users[1].id);
				expect(page.data[2].id).toEqual(users[2].id);
			});
		});

		describe('scope', () => {
			const setup = async () => {
				const query = {
					schoolId: 'schoolId',
					isOutdated: true,
					lastLoginSystemChangeSmallerThan: new Date(),
					outdatedSince: new Date(),
					lastLoginSystemChangeBetweenStart: new Date(),
					lastLoginSystemChangeBetweenEnd: new Date(),
				};
				const deletedFilter = {
					$or: [{ deletedAt: { $exists: false } }, { deletedAt: null }, { deletedAt: { $gte: expect.any(Date) } }],
				};

				const options: IFindOptions<UserDo> = {};

				await em.nativeDelete(User, {});
				await em.nativeDelete(SchoolEntity, {});

				const userA = userFactory.buildWithId({ firstName: 'A' });
				const userB = userFactory.buildWithId({ firstName: 'B' });
				const userC = userFactory.buildWithId({ firstName: 'C' });
				const users = [userA, userB, userC];
				await em.persist(users).flush();

				const emFindAndCountSpy = jest.spyOn(em, 'findAndCount');

				return { query, options, users, emFindAndCountSpy, deletedFilter };
			};

			it('should add query to scope', async () => {
				const { query, options, emFindAndCountSpy, deletedFilter } = await setup();

				await repo.find(query, options);

				expect(emFindAndCountSpy).toHaveBeenCalledWith(
					User,
					{
						$and: [
							{
								school: 'schoolId',
							},
							{
								outdatedSince: {
									$exists: query.isOutdated,
								},
							},
							{
								$or: [
									{
										lastLoginSystemChange: {
											$lt: query.lastLoginSystemChangeSmallerThan,
										},
									},
									{
										lastLoginSystemChange: {
											$exists: false,
										},
									},
								],
							},
							{
								lastLoginSystemChange: {
									$gte: query.lastLoginSystemChangeBetweenStart,
									$lt: query.lastLoginSystemChangeBetweenEnd,
								},
							},
							{
								outdatedSince: {
									$eq: query.outdatedSince,
								},
							},
							deletedFilter,
						],
					},
					expect.objectContaining<FindOptions<User>>({
						orderBy: expect.objectContaining<QueryOrderMap<User>>({}) as QueryOrderMap<User>,
					})
				);
			});
		});
	});

	describe('findByIdOrNull', () => {
		describe('when user not found', () => {
			const setup = () => {
				const id = new ObjectId().toHexString();

				return { id };
			};

			it('should return null', async () => {
				const { id } = setup();

				const result = await repo.findByIdOrNull(id);

				expect(result).toBeNull();
			});
		});

		describe('when user was found', () => {
			const setup = async () => {
				const role = roleFactory.build();

				const user = userFactory.buildWithId({ roles: [role] });

				await em.persist([user, role]).flush();
				em.clear();

				return { user, role };
			};

			it('should return user with role', async () => {
				const { user, role } = await setup();

				const result = await repo.findByIdOrNull(user.id, true);

				expect(result?.id).toEqual(user.id);
				expect(result?.roles).toEqual([
					{
						id: role.id,
						name: role.name,
					},
				]);
			});
		});
	});

	describe('searchable strings generation', () => {
		const setup = () => {
			const user = userDoFactory.build({
				firstName: 'John',
				lastName: 'Doe',
				email: 'x@y.com',
			});

			const expectedSearchableStrings = [
				'Joh',
				'John',
				'ohn',
				'Doe',
				'x@y',
				'x@y.',
				'x@y.c',
				'x@y.co',
				'x@y.com',
				'@y.',
				'@y.c',
				'@y.co',
				'@y.com',
				'y.c',
				'y.co',
				'y.com',
				'.co',
				'.com',
				'com',
			];

			return { user, expectedSearchableStrings };
		};

		describe('save', () => {
			describe('when creating a user', () => {
				it('should save searchable strings', async () => {
					const { user, expectedSearchableStrings } = setup();

					await repo.save(user);
					em.clear();

					const result = await em.findOneOrFail(User, { id: user.id });

					expect(result.allSearchableStrings).toEqual(expectedSearchableStrings);
				});
			});

			describe('when updating a user', () => {
				it('should update searchable strings', async () => {
					const { user } = setup();

					await repo.save(user);

					user.email = 'x@y.org';
					await repo.save(user);
					em.clear();

					const result = await em.findOneOrFail(User, { id: user.id });

					expect(result.allSearchableStrings[result.allSearchableStrings.length - 1]).toEqual('org');
				});
			});
		});

		describe('saveAll', () => {
			describe('when creating users', () => {
				it('should save searchable strings', async () => {
					const { user, expectedSearchableStrings } = setup();

					await repo.saveAll([user]);
					em.clear();

					const result = await em.findOneOrFail(User, { id: user.id });

					expect(result.allSearchableStrings).toEqual(expectedSearchableStrings);
				});
			});

			describe('when updating users', () => {
				it('should update searchable strings', async () => {
					const { user } = setup();

					await repo.saveAll([user]);

					user.email = 'x@y.org';
					await repo.saveAll([user]);
					em.clear();

					const result = await em.findOneOrFail(User, { id: user.id });

					expect(result.allSearchableStrings[result.allSearchableStrings.length - 1]).toEqual('org');
				});
			});
		});
	});
});
