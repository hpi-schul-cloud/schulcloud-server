import { createMock } from '@golevelup/ts-jest';
import { FindOptions, NotFoundError, QueryOrderMap } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { IFindOptions, IUserProperties, LanguageType, Role, School, SortOrder, System, User } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { cleanupCollections, roleFactory, schoolFactory, systemFactory, userFactory } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { UserQuery } from '@src/modules/user/service/user-query.type';
import { Page } from '@shared/domain/domainobject/page';

describe('UserRepo', () => {
	let module: TestingModule;
	let repo: UserDORepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				UserDORepo,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();
		repo = module.get(UserDORepo);
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

	describe('entityFactory', () => {
		const props: IUserProperties = {
			email: 'email@email.email',
			firstName: 'firstName',
			lastName: 'lastName',
			school: schoolFactory.buildWithId(),
			roles: [roleFactory.buildWithId()],
		};

		it('should return new entity of type User', () => {
			const result: User = repo.entityFactory(props);

			expect(result).toBeInstanceOf(User);
		});

		it('should return new entity with values from properties', () => {
			const result: User = repo.entityFactory(props);

			expect(result).toEqual(
				expect.objectContaining({
					email: props.email,
					firstName: props.firstName,
					lastName: props.lastName,
					school: props.school,
				})
			);
			expect(result.roles.getItems()).toEqual(props.roles);
		});
	});

	describe('findById', () => {
		it('should find user without populating roles', async () => {
			const user: User = userFactory.buildWithId();

			await em.persistAndFlush(user);

			const result: UserDO = await repo.findById(user.id);

			expect(result.id).toEqual(user.id);
			expect(result.roleIds).toEqual([]);
		});

		it('should find user and populate roles', async () => {
			const roles3: Role[] = roleFactory.buildList(1);
			await em.persistAndFlush(roles3);

			const roles2: Role[] = roleFactory.buildList(1, { roles: roles3 });
			await em.persistAndFlush(roles2);

			const roles1: Role[] = roleFactory.buildList(1, { roles: roles2 });
			await em.persistAndFlush(roles1);

			const user: User = userFactory.build({ roles: roles1 });
			await em.persistAndFlush([user]);

			em.clear();

			const result: UserDO = await repo.findById(user.id, true);

			expect(result.id).toEqual(user.id);
			expect(result.roleIds).toEqual([roles1[0].id]);
		});

		it('should throw if user cannot be found', async () => {
			await expect(repo.findById(new ObjectId().toHexString(), false)).rejects.toThrow(NotFoundError);
		});
	});

	describe('findByExternalId', () => {
		const externalId = 'externalId';
		let system: System;
		let school: School;
		let user: User;

		beforeEach(async () => {
			system = systemFactory.buildWithId();
			school = schoolFactory.buildWithId();
			school.systems.add(system);
			user = userFactory.buildWithId({ externalId, school });

			await em.persistAndFlush([user, system, school]);
		});

		it('should find a user by its external id', async () => {
			const result: UserDO | null = await repo.findByExternalId(user.externalId as string, system.id);

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

			const result: UserDO | null = await repo.findByExternalId(user.externalId as string, system.id);

			expect(result).toBeNull();
		});

		it('should return null if school has no corresponding system', async () => {
			school.systems.removeAll();

			const result: UserDO | null = await repo.findByExternalId(user.externalId as string, system.id);

			expect(result).toBeNull();
		});
	});

	describe('findByExternalIdOrFail', () => {
		const externalId = 'externalId';
		let system: System;
		let school: School;
		let user: User;

		beforeEach(async () => {
			system = systemFactory.buildWithId();
			school = schoolFactory.buildWithId();
			school.systems.add(system);
			user = userFactory.buildWithId({ externalId, school });

			await em.persistAndFlush([user, system, school]);
		});

		it('should find a user by its external id', async () => {
			const result: UserDO = await repo.findByExternalIdOrFail(user.externalId as string, system.id);

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

	describe('mapEntityToDO', () => {
		it('should return a domain object', () => {
			const id = new ObjectId();
			const testEntity: User = userFactory.buildWithId(
				{
					email: 'email@email.email',
					firstName: 'firstName',
					lastName: 'lastName',
					school: schoolFactory.buildWithId(),
					ldapDn: 'ldapDn',
					externalId: 'externalId',
					language: LanguageType.DE,
					forcePasswordChange: false,
					preferences: { firstLogin: true },
				},
				id.toHexString()
			);
			const role: Role = roleFactory.buildWithId();
			testEntity.roles.add(role);
			testEntity.firstNameSearchValues = ['em'];
			testEntity.lastNameSearchValues = ['em'];
			testEntity.emailSearchValues = ['em'];
			testEntity.importHash = 'importHash';
			testEntity.outdatedSince = new Date();
			testEntity.lastLoginSystemChange = new Date();
			testEntity.previousExternalId = 'someId';

			const userDO: UserDO = repo.mapEntityToDO(testEntity);

			expect(userDO).toEqual(
				expect.objectContaining({
					id: testEntity.id,
					updatedAt: testEntity.updatedAt,
					createdAt: testEntity.createdAt,
					email: testEntity.email,
					firstName: testEntity.firstName,
					lastName: testEntity.lastName,
					schoolId: testEntity.school.id,
					roleIds: [role.id],
					ldapDn: testEntity.ldapDn,
					externalId: testEntity.externalId,
					importHash: testEntity.importHash,
					firstNameSearchValues: testEntity.firstNameSearchValues,
					lastNameSearchValues: testEntity.lastNameSearchValues,
					emailSearchValues: testEntity.emailSearchValues,
					language: testEntity.language,
					forcePasswordChange: testEntity.forcePasswordChange,
					preferences: testEntity.preferences,
					outdatedSince: testEntity.outdatedSince,
					lastLoginSystemChange: testEntity.lastLoginSystemChange,
					previousExternalId: testEntity.previousExternalId,
				})
			);
		});
	});

	describe('mapDOToEntityProperties', () => {
		it('should map DO to Entity Properties', () => {
			const testDO: UserDO = new UserDO({
				id: 'testId',
				email: 'email@email.email',
				firstName: 'firstName',
				lastName: 'lastName',
				roleIds: [new ObjectId().toHexString()],
				schoolId: new ObjectId().toHexString(),
				ldapDn: 'ldapDn',
				externalId: 'externalId',
				language: LanguageType.DE,
				forcePasswordChange: false,
				preferences: { firstLogin: true },
				outdatedSince: new Date(),
				lastLoginSystemChange: new Date(),
				previousExternalId: 'someId',
			});

			const result: IUserProperties = repo.mapDOToEntityProperties(testDO);

			expect(result).toEqual<IUserProperties>({
				email: testDO.email,
				firstName: testDO.firstName,
				lastName: testDO.lastName,
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				school: expect.objectContaining<Partial<School>>({ id: testDO.schoolId }),
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				roles: [expect.objectContaining<Partial<Role>>({ id: testDO.roleIds[0] })],
				ldapDn: testDO.ldapDn,
				externalId: testDO.externalId,
				language: testDO.language,
				forcePasswordChange: testDO.forcePasswordChange,
				preferences: testDO.preferences,
				outdatedSince: testDO.outdatedSince,
				lastLoginSystemChange: testDO.lastLoginSystemChange,
				previousExternalId: testDO.previousExternalId,
			});
		});
	});

	describe('find() is called', () => {
		const setupFind = async () => {
			const query: UserQuery = {
				schoolId: undefined,
				isOutdated: undefined,
				lastLoginSystemChangeSmallerThan: undefined,
				outdatedSince: undefined,
			};

			const options: IFindOptions<UserDO> = {};

			await em.nativeDelete(User, {});
			await em.nativeDelete(School, {});

			const userA: User = userFactory.buildWithId({ firstName: 'A' });
			const userB: User = userFactory.buildWithId({ firstName: 'B' });
			const userC: User = userFactory.buildWithId({ firstName: 'C' });
			const users: User[] = [userA, userB, userC];
			await em.persistAndFlush(users);

			const emFindAndCountSpy = jest.spyOn(em, 'findAndCount');

			return { query, options, users, emFindAndCountSpy };
		};

		describe('sorting', () => {
			it('should create queryOrderMap with options.order', async () => {
				const { query, options, emFindAndCountSpy } = await setupFind();
				options.order = {
					id: SortOrder.asc,
				};

				await repo.find(query, options);

				expect(emFindAndCountSpy).toHaveBeenCalledWith(
					User,
					{},
					expect.objectContaining<FindOptions<User>>({
						orderBy: expect.objectContaining<QueryOrderMap<User>>({ _id: options.order.id }) as QueryOrderMap<User>,
					})
				);
			});

			it('should create queryOrderMap with an empty object', async () => {
				const { query, options, emFindAndCountSpy } = await setupFind();
				options.order = undefined;

				await repo.find(query, options);

				expect(emFindAndCountSpy).toHaveBeenCalledWith(
					User,
					{},
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

					const page: Page<UserDO> = await repo.find(query, undefined);

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
				it('should return one ltiTool', async () => {
					const { query, options } = await setupFind();
					options.pagination = { limit: 1 };

					const page: Page<UserDO> = await repo.find(query, options);

					expect(page.data.length).toBe(1);
				});
			});

			describe('pagination has a limit of 1 and skip is set to 2', () => {
				it('should return no ltiTool when ', async () => {
					const { query, options } = await setupFind();
					options.pagination = { limit: 1, skip: 3 };

					const page: Page<UserDO> = await repo.find(query, options);

					expect(page.data.length).toBe(0);
				});
			});
		});

		describe('order', () => {
			it('should return users ordered by default _id when no order is specified', async () => {
				const { query, options, users } = await setupFind();

				const page: Page<UserDO> = await repo.find(query, options);

				expect(page.data[0].id).toEqual(users[0].id);
				expect(page.data[1].id).toEqual(users[1].id);
				expect(page.data[2].id).toEqual(users[2].id);
			});
		});

		describe('scope', () => {
			it('should add query to scope', async () => {
				const { options, emFindAndCountSpy } = await setupFind();
				const lastLoginSystemChangeSmallerThan: Date = new Date();
				const outdatedSince: Date = new Date();
				const query: UserQuery = {
					schoolId: 'schoolId',
					isOutdated: true,
					lastLoginSystemChangeSmallerThan,
					outdatedSince,
				};

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
											$lt: lastLoginSystemChangeSmallerThan,
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
								outdatedSince: {
									$eq: outdatedSince,
								},
							},
						],
					},
					expect.objectContaining<FindOptions<User>>({
						orderBy: expect.objectContaining<QueryOrderMap<User>>({}) as QueryOrderMap<User>,
					})
				);
			});
		});
	});
});
