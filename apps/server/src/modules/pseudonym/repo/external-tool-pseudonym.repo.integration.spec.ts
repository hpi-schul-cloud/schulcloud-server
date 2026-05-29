import { LegacyLogger } from '@core/logger';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Page } from '@shared/domain/domainobject';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { v4 as uuidv4 } from 'uuid';
import { PseudonymSearchQuery } from '../domain';
import { ExternalToolPseudonymEntity } from '../entity';
import { externalToolPseudonymEntityFactory } from '../testing';
import { ExternalToolPseudonymRepo } from './external-tool-pseudonym.repo';
import { Pseudonym } from './pseudonym.do';

describe('ExternalToolPseudonymRepo', () => {
	let module: TestingModule;
	let repo: ExternalToolPseudonymRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({ entities: [ExternalToolPseudonymEntity, User], ensureIndexes: true }),
			],
			providers: [
				ExternalToolPseudonymRepo,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		repo = module.get(ExternalToolPseudonymRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('findByUserIdAndToolIdOrFail', () => {
		describe('when pseudonym is existing', () => {
			const setup = async () => {
				const entity: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId();
				await em.persist(entity).flush();

				return {
					entity,
				};
			};

			it('should find a externalToolPseudonymEntity by userId and toolId', async () => {
				const { entity } = await setup();

				const result: Pseudonym = await repo.findByUserIdAndToolIdOrFail(
					entity.userId.toHexString(),
					entity.toolId.toHexString()
				);

				expect(result.id).toEqual(entity.id);
			});
		});
	});

	describe('findPseudonymsByUserId', () => {
		describe('when pseudonym is existing', () => {
			const setup = async () => {
				const user1 = userFactory.buildWithId();
				const user2 = userFactory.buildWithId();
				const pseudonym1: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId({
					userId: user1.id,
				});
				const pseudonym2: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId({
					userId: user1.id,
				});
				const pseudonym3: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId({
					userId: user2.id,
				});
				const pseudonym4: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId({
					userId: user2.id,
				});

				await em.persist([pseudonym1, pseudonym2, pseudonym3, pseudonym4]).flush();

				return {
					user1,
					pseudonym1,
					pseudonym2,
				};
			};

			it('should return array of pseudonyms', async () => {
				const { user1, pseudonym1, pseudonym2 } = await setup();

				const result: Pseudonym[] = await repo.findByUserId(user1.id);

				const expectedArray = [
					{
						id: pseudonym1.id,
						pseudonym: pseudonym1.pseudonym,
						toolId: pseudonym1.toolId.toHexString(),
						userId: pseudonym1.userId.toHexString(),
						createdAt: pseudonym1.createdAt,
						updatedAt: pseudonym1.updatedAt,
					},
					{
						id: pseudonym2.id,
						pseudonym: pseudonym2.pseudonym,
						toolId: pseudonym2.toolId.toHexString(),
						userId: pseudonym2.userId.toHexString(),
						createdAt: pseudonym2.createdAt,
						updatedAt: pseudonym2.updatedAt,
					},
				];

				expect(result).toHaveLength(2);
				expect(result).toEqual(
					expect.arrayContaining([expect.objectContaining(expectedArray[0]), expect.objectContaining(expectedArray[1])])
				);
			});
		});

		describe('when no pseudonym exists for the user', () => {
			it('should return empty array', async () => {
				const result: Pseudonym[] = await repo.findByUserId(new ObjectId().toHexString());

				expect(result).toHaveLength(0);
			});
		});
	});

	describe('findOrCreate', () => {
		describe('when pseudonym is new', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const toolId = new ObjectId().toHexString();

				return { userId, toolId };
			};

			it('should create a new pseudonym if it does not exist', async () => {
				const { userId, toolId } = setup();

				const result: Pseudonym = await repo.findOrCreate(userId, toolId);

				expect(result.id).toBeTruthy();
				expect(result.pseudonym).toEqual(expect.any(String));
				expect(result.toolId).toEqual(toolId);
				expect(result.userId).toEqual(userId);
			});
		});

		describe('when pseudonym is existing', () => {
			const setup = async () => {
				const entity: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId();
				await em.persist(entity).flush();

				return {
					entity,
					userId: entity.userId.toHexString(),
					toolId: entity.toolId.toHexString(),
				};
			};

			it('should not change object and just return existing pseudonym', async () => {
				const { entity, userId, toolId } = await setup();

				const result: Pseudonym = await repo.findOrCreate(userId, toolId);

				expect(result.createdAt).toEqual(entity.createdAt);
				expect(result.pseudonym).toEqual(entity.pseudonym);
			});
		});

		describe('when findOrCreate is called twice sequentially', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const toolId = new ObjectId().toHexString();

				return { userId, toolId };
			};

			it('should not alter the existing pseudonym', async () => {
				const { userId, toolId } = setup();

				const firstResult: Pseudonym = await repo.findOrCreate(userId, toolId);
				const secondResult: Pseudonym = await repo.findOrCreate(userId, toolId);

				expect(secondResult.id).toEqual(firstResult.id);
				expect(secondResult.pseudonym).toEqual(firstResult.pseudonym);
				expect(secondResult.userId).toEqual(firstResult.userId);
				expect(secondResult.toolId).toEqual(firstResult.toolId);
				expect(secondResult.createdAt).toEqual(firstResult.createdAt);
				expect(secondResult.updatedAt).toEqual(firstResult.updatedAt);
			});
		});

		describe('when findOrCreate is called twice concurrently', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const toolId = new ObjectId().toHexString();

				return { userId, toolId };
			};

			it('should not throw a duplicate-key error', async () => {
				const { userId, toolId } = setup();

				await expect(
					Promise.all([repo.findOrCreate(userId, toolId), repo.findOrCreate(userId, toolId)])
				).resolves.not.toThrow();
			});

			it('should result in exactly one document in the database', async () => {
				const { userId, toolId } = setup();

				await Promise.all([repo.findOrCreate(userId, toolId), repo.findOrCreate(userId, toolId)]);

				const count = await em.count(ExternalToolPseudonymEntity, {
					userId: new ObjectId(userId),
					toolId: new ObjectId(toolId),
				});

				expect(count).toEqual(1);
			});
		});
	});

	describe('deletePseudonymsByUserId', () => {
		describe('when pseudonyms are not existing', () => {
			const setup = () => {
				const user = userFactory.buildWithId();

				return {
					user,
				};
			};

			it('should return empty array', async () => {
				const { user } = setup();

				const result = await repo.deletePseudonymsByUserId(user.id);

				expect(result).toEqual([]);
			});
		});

		describe('when pseudonyms are existing', () => {
			const setup = async () => {
				const user1 = userFactory.buildWithId();
				const user2 = userFactory.buildWithId();
				const pseudonym1: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId({
					userId: user1.id,
				});
				const pseudonym2: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId({
					userId: user1.id,
				});
				const pseudonym3: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId({
					userId: user2.id,
				});
				const pseudonym4: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId({
					userId: user2.id,
				});

				await em.persist([pseudonym1, pseudonym2, pseudonym3, pseudonym4]).flush();

				const expectedResult = [pseudonym1.id, pseudonym2.id];

				return {
					expectedResult,
					user1,
					pseudonym1,
					pseudonym2,
				};
			};

			it('should delete all pseudonyms for userId', async () => {
				const { expectedResult, user1 } = await setup();

				const result = await repo.deletePseudonymsByUserId(user1.id);

				expect(result).toEqual(expectedResult);
			});
		});
	});

	describe('findByPseudonym', () => {
		describe('when pseudonym is existing', () => {
			const setup = async () => {
				const entity: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId();
				await em.persist(entity).flush();
				em.clear();

				return {
					entity,
				};
			};

			it('should return a pseudonym', async () => {
				const { entity } = await setup();

				const result: Pseudonym | null = await repo.findByPseudonym(entity.pseudonym);

				expect(result?.id).toEqual(entity.id);
			});
		});

		describe('when pseudonym not exists', () => {
			it('should return null', async () => {
				const pseudonym: Pseudonym | null = await repo.findByPseudonym(uuidv4());

				expect(pseudonym).toBeNull();
			});
		});
	});

	describe('findByQuery', () => {
		const setupThreePseudonyms = async () => {
			const query: PseudonymSearchQuery = {
				userId: new ObjectId().toHexString(),
			};

			const pseudonym1: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.build({
				userId: query.userId,
				toolId: new ObjectId().toHexString(),
				pseudonym: 'pseudonym1',
			});

			const pseudonym2: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.build({
				userId: query.userId,
				toolId: new ObjectId().toHexString(),
				pseudonym: 'pseudonym2',
			});

			const pseudonym3: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.build({
				userId: query.userId,
				toolId: new ObjectId().toHexString(),
				pseudonym: 'pseudonym3',
			});

			const pseudonyms: ExternalToolPseudonymEntity[] = [pseudonym1, pseudonym2, pseudonym3];

			await em.persist(pseudonyms).flush();
			em.clear();

			return { query, pseudonyms };
		};

		describe('when query with all parameters is given', () => {
			it('should return all three pseudonyms', async () => {
				const { query, pseudonyms } = await setupThreePseudonyms();

				const page: Page<Pseudonym> = await repo.findByQuery(query);

				expect(page.data.length).toEqual(pseudonyms.length);
			});
		});

		describe('when pagination has a limit of 1', () => {
			it('should return one pseudonym', async () => {
				const { query } = await setupThreePseudonyms();

				const page: Page<Pseudonym> = await repo.findByQuery(query, { pagination: { limit: 1 } });

				expect(page.data.length).toEqual(1);
			});
		});

		describe('when pagination has a limit of 1 and skip is set to 2', () => {
			it('should return the third element', async () => {
				const { query, pseudonyms } = await setupThreePseudonyms();

				const page: Page<Pseudonym> = await repo.findByQuery(query, { pagination: { skip: 2 } });

				expect(page.data[0].id).toEqual(pseudonyms[2].id);
			});
		});
	});
});
