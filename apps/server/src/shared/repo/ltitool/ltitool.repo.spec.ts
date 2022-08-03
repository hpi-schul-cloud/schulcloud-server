import { EntityProperties } from '@shared/repo';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections } from '@shared/testing';
import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';
import { NotFoundError } from '@mikro-orm/core';
import { ILtiToolProperties, LtiTool } from '@shared/domain';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiToolRepo } from '@shared/repo/ltitool/ltitool.repo';
import { ltiToolFactory } from '@shared/testing/factory/ltitool.factory';

class LtiToolRepoSpec extends LtiToolRepo {
	mapEntityToDOSpec(entity: LtiTool): LtiToolDO {
		return super.mapEntityToDO(entity);
	}

	mapDOToEntitySpec(entityDO: LtiToolDO): EntityProperties<ILtiToolProperties> {
		return super.mapDOToEntity(entityDO);
	}
}

describe('LtiTool Repo', () => {
	let module: TestingModule;
	let repo: LtiToolRepoSpec;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				LtiToolRepoSpec,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();
		repo = module.get(LtiToolRepoSpec);
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
		expect(repo.entityName).toBe(LtiTool);
	});

	it('should implement getConstructor', () => {
		expect(repo.getConstructor()).toBe(LtiTool);
	});

	describe('findByUserAndTool', () => {
		it('should find a pseudonym by userId and toolId', async () => {
			// Arrange
			const entity: LtiTool = ltiToolFactory.buildWithId();
			await em.persistAndFlush(entity);

			// Act
			const result = await repo.findByName(entity.name);

			// Assert
			expect(result.id).toEqual(entity.id);
		});

		it('should throw an Error if the scope mismatches the idtype', async () => {
			const entity: LtiTool = ltiToolFactory.buildWithId();
			await expect(repo.findByName(entity.name)).rejects.toThrow(NotFoundError);
		});
	});

	describe('mapEntityToDO', () => {
		it('should return a domain object', () => {
			// Arrange
			const id = new ObjectId();
			const testEntity: LtiTool = {
				id: id.toHexString(),
				_id: id,
				updatedAt: new Date('2022-07-20'),
				createdAt: new Date('2022-07-20'),
				name: 'toolName',
			};

			// Act
			const ltiToolDO: LtiToolDO = repo.mapEntityToDOSpec(testEntity);

			// Assert
			expect(ltiToolDO.id).toEqual(testEntity.id);
			expect(ltiToolDO.name).toEqual(testEntity.name);
		});
	});

	describe('mapDOToEntity', () => {
		it('should map DO to Entity', () => {
			// Arrange
			const testDO: LtiToolDO = new LtiToolDO({
				id: 'testId',
				updatedAt: new Date('2022-07-20'),
				createdAt: new Date('2022-07-20'),
				name: 'toolName',
			});

			// Act
			const result: EntityProperties<ILtiToolProperties> = repo.mapDOToEntitySpec(testDO);

			// Assert
			expect(result.id).toEqual(testDO.id);
			expect(result.name).toEqual(testDO.name);
		});
	});
});
