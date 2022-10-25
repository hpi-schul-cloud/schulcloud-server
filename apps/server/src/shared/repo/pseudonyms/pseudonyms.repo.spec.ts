import { EntityProperties } from '@shared/repo';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections } from '@shared/testing';
import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';
import { PseudonymDO } from '@shared/domain/domainobject/pseudonym.do';
import { PseudonymsRepo } from '@shared/repo/pseudonyms/pseudonyms.repo';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError } from '@mikro-orm/core';
import { pseudonymFactory } from '@shared/testing/factory/pseudonym.factory';
import { IPseudonymProperties, Pseudonym } from '@shared/domain';

class PseudonymsRepoSpec extends PseudonymsRepo {
	mapEntityToDOSpec(entity: Pseudonym): PseudonymDO {
		return super.mapEntityToDO(entity);
	}

	mapDOToEntityPropertiesSpec(entityDO: PseudonymDO): EntityProperties<IPseudonymProperties> {
		return super.mapDOToEntityProperties(entityDO);
	}
}

describe('Pseudonym Repo', () => {
	let module: TestingModule;
	let repo: PseudonymsRepoSpec;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				PseudonymsRepoSpec,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();
		repo = module.get(PseudonymsRepoSpec);
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
		expect(repo.entityName).toBe(Pseudonym);
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

	describe('findByUserAndTool', () => {
		it('should find a pseudonym by userId and toolId', async () => {
			// Arrange
			const entity: Pseudonym = pseudonymFactory.buildWithId();
			await em.persistAndFlush(entity);

			// Act
			const result = await repo.findByUserIdAndToolId(entity.userId.toHexString(), entity.toolId.toHexString());

			// Assert
			expect(result.id).toEqual(entity.id);
		});

		it('should throw an Error if the scope mismatches the idtype', async () => {
			const entity: Pseudonym = pseudonymFactory.buildWithId();
			await expect(
				repo.findByUserIdAndToolId(entity.userId.toHexString(), entity.toolId.toHexString())
			).rejects.toThrow(NotFoundError);
		});
	});

	describe('mapEntityToDO', () => {
		it('should return a domain object', () => {
			// Arrange
			const id = new ObjectId();
			const testEntity: Pseudonym = {
				id: id.toHexString(),
				_id: id,
				updatedAt: new Date('2022-07-20'),
				createdAt: new Date('2022-07-20'),
				pseudonym: uuidv4(),
				toolId: new ObjectId(),
				userId: new ObjectId(),
			};

			// Act
			const pseudonymDO: PseudonymDO = repo.mapEntityToDOSpec(testEntity);

			// Assert
			expect(pseudonymDO.id).toEqual(testEntity.id);
			expect(pseudonymDO.pseudonym).toEqual(testEntity.pseudonym);
			expect(pseudonymDO.toolId).toEqual(testEntity.toolId.toHexString());
			expect(pseudonymDO.userId).toEqual(testEntity.userId.toHexString());
		});
	});

	describe('mapDOToEntityProperties', () => {
		it('should map DO to Entity Properties', () => {
			// Arrange
			const testDO: PseudonymDO = new PseudonymDO({
				id: 'testId',
				updatedAt: new Date('2022-07-20'),
				createdAt: new Date('2022-07-20'),
				pseudonym: uuidv4(),
				toolId: new ObjectId().toHexString(),
				userId: new ObjectId().toHexString(),
			});

			// Act
			const result: EntityProperties<IPseudonymProperties> = repo.mapDOToEntityPropertiesSpec(testDO);

			// Assert
			expect(result.id).toEqual(testDO.id);
			expect(result.pseudonym).toEqual(testDO.pseudonym);
			expect(result.toolId.toHexString()).toEqual(testDO.toolId);
			expect(result.userId.toHexString()).toEqual(testDO.userId);
		});
	});
});
