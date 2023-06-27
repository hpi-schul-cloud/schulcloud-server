import { createMock } from '@golevelup/ts-jest';
import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { IPseudonymProperties, Pseudonym } from '@shared/domain';
import { PseudonymDO } from '@shared/domain/domainobject/pseudonym.do';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { PseudonymsRepo } from '@shared/repo/pseudonyms/pseudonyms.repo';
import { cleanupCollections } from '@shared/testing';
import { pseudonymFactory } from '@shared/testing/factory/pseudonym.factory';
import { LegacyLogger } from '@src/core/logger';
import { v4 as uuidv4 } from 'uuid';

describe('Pseudonym Repo', () => {
	let module: TestingModule;
	let repo: PseudonymsRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				PseudonymsRepo,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		repo = module.get(PseudonymsRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('entityName', () => {
		it('should return Pseudonym', () => {
			expect(repo.entityName).toBe(Pseudonym);
		});
	});

	describe('entityFactory', () => {
		const props: IPseudonymProperties = {
			pseudonym: 'pseudonym',
			toolId: new ObjectId(),
			userId: new ObjectId(),
		};

		it('should return new entity of type Pseudonym', () => {
			const result: Pseudonym = repo.entityFactory(props);

			expect(result).toBeInstanceOf(Pseudonym);
		});

		it('should return new entity with values from properties', () => {
			const result: Pseudonym = repo.entityFactory(props);

			expect(result).toEqual(expect.objectContaining(props));
		});
	});

	describe('findByUserIdAndToolIdOrFail', () => {
		it('should find a pseudonym by userId and toolId', async () => {
			const entity: Pseudonym = pseudonymFactory.buildWithId();
			await em.persistAndFlush(entity);

			const result = await repo.findByUserIdAndToolIdOrFail(entity.userId.toHexString(), entity.toolId.toHexString());

			expect(result.id).toEqual(entity.id);
		});

		it('should throw an Error if the scope mismatches the idtype', async () => {
			const entity: Pseudonym = pseudonymFactory.buildWithId();
			await expect(
				repo.findByUserIdAndToolIdOrFail(entity.userId.toHexString(), entity.toolId.toHexString())
			).rejects.toThrow(NotFoundError);
		});
	});

	describe('findByUserIdAndToolId', () => {
		describe('when there is a pseudonym', () => {
			const setup = async () => {
				const entity: Pseudonym = pseudonymFactory.buildWithId();

				await em.persistAndFlush(entity);

				return {
					entity,
				};
			};

			it('should return a pseudonym by userId and toolId', async () => {
				const { entity } = await setup();

				const result: PseudonymDO | null = await repo.findByUserIdAndToolId(
					entity.userId.toHexString(),
					entity.toolId.toHexString()
				);

				expect(result?.id).toEqual(entity.id);
			});
		});

		describe('when there is no pseudonym', () => {
			it('should return null', async () => {
				const result: PseudonymDO | null = await repo.findByUserIdAndToolId(
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

			const domainObject: PseudonymDO = new PseudonymDO({
				id,
				pseudonym: uuidv4(),
				toolId: new ObjectId().toHexString(),
				userId: new ObjectId().toHexString(),
			});

			const entity: Pseudonym = pseudonymFactory.buildWithId(
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

			const result: PseudonymDO = await repo.save(domainObject);

			expect(result).toEqual(domainObject);
		});
	});
});
