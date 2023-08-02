import { createMock } from '@golevelup/ts-jest';
import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, pseudonymFactory, externalToolPseudonymEntityFactory, userFactory } from '@shared/testing';
import { pseudonymEntityFactory } from '@shared/testing/factory/pseudonym.factory';
import { LegacyLogger } from '@src/core/logger';
import { v4 as uuidv4 } from 'uuid';
import { Pseudonym } from '@shared/domain';
import { ExternalToolPseudonymEntity } from '../entity';
import { ExternalToolPseudonymRepo } from './external-tool-pseudonym.repo';

describe('ExternalToolPseudonymRepo', () => {
	let module: TestingModule;
	let repo: ExternalToolPseudonymRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
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
				await em.persistAndFlush(entity);

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

		describe('when pseudonym is existing', () => {
			const setup = () => {
				const entity: ExternalToolPseudonymEntity = pseudonymEntityFactory.buildWithId();

				return {
					entity,
				};
			};

			it('should throw an error ', async () => {
				const { entity } = setup();

				await expect(
					repo.findByUserIdAndToolIdOrFail(entity.userId.toHexString(), entity.toolId.toHexString())
				).rejects.toThrow(NotFoundError);
			});
		});
	});

	describe('findByUserIdAndToolId', () => {
		describe('when pseudonym is existing', () => {
			const setup = async () => {
				const entity: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId();

				await em.persistAndFlush(entity);

				return {
					entity,
				};
			};

			it('should return a pseudonym', async () => {
				const { entity } = await setup();

				const result: Pseudonym | null = await repo.findByUserIdAndToolId(
					entity.userId.toHexString(),
					entity.toolId.toHexString()
				);

				expect(result?.id).toEqual(entity.id);
			});
		});

		describe('when there is no pseudonym', () => {
			it('should return null', async () => {
				const result: Pseudonym | null = await repo.findByUserIdAndToolId(
					new ObjectId().toHexString(),
					new ObjectId().toHexString()
				);

				expect(result).toBeNull();
			});
		});
	});

	describe('findPseudonymsByUserId', () => {
		describe('when pseudonym is existing', () => {
			const setup = async () => {
				const user = userFactory.buildWithId();
				const pseudonym1: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId({
					userId: user.id,
				});
				const pseudonym2: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId({
					userId: user.id,
				});

				await em.persistAndFlush([pseudonym1, pseudonym2]);

				return {
					user,
					pseudonym1,
					pseudonym2,
				};
			};

			it('should return array of pseudonyms', async () => {
				const { user } = await setup();

				const result: Pseudonym[] = await repo.findPseudonymsByUserId(user.id);

				expect(result).toHaveLength(2);
				expect(result[0].userId).toEqual(user.id);
				expect(result[1].userId).toEqual(user.id);
			});
		});

		describe('should return empty array when there is no pseudonym', () => {
			it('should return empty array', async () => {
				const result: Pseudonym[] = await repo.findPseudonymsByUserId(new ObjectId().toHexString());

				expect(result).toHaveLength(0);
			});
		});
	});

	describe('createOrUpdate', () => {
		describe('when pseudonym is new', () => {
			const setup = () => {
				return {
					domainObject: pseudonymFactory.build({
						pseudonym: uuidv4(),
						toolId: new ObjectId().toHexString(),
						userId: new ObjectId().toHexString(),
					}),
				};
			};

			it('should create a new pseudonym if it does not exist', async () => {
				const { domainObject } = setup();

				const result: Pseudonym = await repo.createOrUpdate(domainObject);

				expect(result.id).toBeTruthy();
				expect(result.pseudonym).toEqual(domainObject.pseudonym);
				expect(result.toolId).toEqual(domainObject.toolId);
				expect(result.userId).toEqual(domainObject.userId);
			});
		});

		describe('when pseudonym is existing', () => {
			const setup = async () => {
				const entity: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId();
				await em.persistAndFlush(entity);

				return {
					domainObject: pseudonymFactory.build({
						id: entity.id,
						pseudonym: uuidv4(),
						toolId: new ObjectId().toHexString(),
						userId: new ObjectId().toHexString(),
					}),
				};
			};

			it('should update an existing pseudonym', async () => {
				const { domainObject } = await setup();

				const result: Pseudonym = await repo.createOrUpdate(domainObject);

				expect(result.id).toEqual(domainObject.id);
				expect(result.pseudonym).toEqual(domainObject.pseudonym);
				expect(result.toolId).toEqual(domainObject.toolId);
				expect(result.userId).toEqual(domainObject.userId);
			});
		});
	});

	describe('deletePseudonymsByUserId', () => {
		describe('when pseudonyms are existing', () => {
			const setup = async () => {
				const user = userFactory.buildWithId();
				const pseudonym1: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId({
					userId: user.id,
				});
				const pseudonym2: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId({
					userId: user.id,
				});

				await em.persistAndFlush([pseudonym1, pseudonym2]);

				return {
					user,
				};
			};

			it('should delete all pseudonyms for userId', async () => {
				const { user } = await setup();

				const result: number = await repo.deletePseudonymsByUserId(user.id);

				expect(result).toEqual(2);
			});
		});

		describe('should return empty array when there is no pseudonym', () => {
			it('should return empty array', async () => {
				const result: Pseudonym[] = await repo.findPseudonymsByUserId(new ObjectId().toHexString());
				expect(result).toHaveLength(0);
			});
		});
	});
});
