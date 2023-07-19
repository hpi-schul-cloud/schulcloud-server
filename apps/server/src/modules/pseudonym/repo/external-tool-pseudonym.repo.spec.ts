import { createMock } from '@golevelup/ts-jest';
import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections } from '@shared/testing';
import { pseudonymEntityFactory } from '@shared/testing/factory/pseudonym.factory';
import { LegacyLogger } from '@src/core/logger';
import { v4 as uuidv4 } from 'uuid';
import { Pseudonym } from '@shared/domain';
import { externalToolPseudonymEntityFactory } from '@shared/testing/factory/external-tool-pseudonym.factory';
import { PseudonymsRepo } from './pseudonyms.repo';
import { ExternalToolPseudonymEntity, IExternalToolPseudonymEntityProps } from '../entity';
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

	describe('entityName', () => {
		it('should return ExternalToolPseudonymEntity', () => {
			expect(repo.entityName).toBe(ExternalToolPseudonymEntity);
		});
	});

	describe('entityFactory', () => {
		const props: IExternalToolPseudonymEntityProps = {
			pseudonym: 'pseudonym',
			toolId: new ObjectId(),
			userId: new ObjectId(),
		};

		it('should return new entity of type ExternalToolPseudonymEntity', () => {
			const result: ExternalToolPseudonymEntity = repo.entityFactory(props);

			expect(result).toBeInstanceOf(ExternalToolPseudonymEntity);
		});

		it('should return new entity with values from properties', () => {
			const result: ExternalToolPseudonymEntity = repo.entityFactory(props);

			expect(result).toEqual(expect.objectContaining(props));
		});
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

	describe('save', () => {
		const setup = async () => {
			const id = new ObjectId().toHexString();

			const domainObject: Pseudonym = new Pseudonym({
				id,
				pseudonym: uuidv4(),
				toolId: new ObjectId().toHexString(),
				userId: new ObjectId().toHexString(),
			});

			const entity: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId(
				{
					pseudonym: uuidv4(),
					toolId: new ObjectId(),
					userId: new ObjectId(),
				},
				id
			);

			await em.persistAndFlush(entity);

			return {
				domainObject,
			};
		};

		it('should return a domain object', async () => {
			const { domainObject } = await setup();

			const result: Pseudonym = await repo.save(domainObject);

			expect(result).toEqual(domainObject);
		});
	});
});
