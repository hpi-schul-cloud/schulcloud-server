import { EntityProperties } from '@shared/repo';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections } from '@shared/testing';
import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';
import { NotFoundError } from '@mikro-orm/core';
import { ILtiToolProperties, LtiTool } from '@shared/domain';
import { LtiPrivacyPermission, LtiRoleType } from '@shared/domain/entity/ltitool.entity';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiToolRepo } from '@shared/repo/ltitool/lti-tool.repo';
import { ltiToolFactory } from '@shared/testing/factory/ltitool.factory';
import { LtiToolSortingMapper } from '@shared/repo/ltitool/lti-tool-sorting.mapper';

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

	let sortingMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				LtiToolRepoSpec,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: LtiToolSortingMapper,
					useValue: createMock<LtiToolSortingMapper>(),
				},
			],
		}).compile();
		repo = module.get(LtiToolRepoSpec);
		em = module.get(EntityManager);
		sortingMapper = module.get(LtiToolSortingMapper);
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
		it('should find a ltitool by userId and toolId', async () => {
			const entity: LtiTool = ltiToolFactory.buildWithId();
			await em.persistAndFlush(entity);

			const result = await repo.findByName(entity.name);

			expect(result.id).toEqual(entity.id);
		});

		it('should throw an error if the ltitool was not found', async () => {
			const entity: LtiTool = ltiToolFactory.buildWithId();
			await expect(repo.findByName(entity.name)).rejects.toThrow(NotFoundError);
		});
	});

	describe('findByClientIdAndIsLocal', () => {
		it('should find a ltiTool by clientId and local flag', async () => {
			const entity: LtiTool = ltiToolFactory.buildWithId();
			await em.persistAndFlush(entity);

			const result = await repo.findByClientIdAndIsLocal(entity.oAuthClientId as string, entity.isLocal as boolean);

			expect(result.id).toEqual(entity.id);
			expect(result.oAuthClientId).toEqual(entity.oAuthClientId);
			expect(result.isLocal).toEqual(entity.isLocal);
		});

		it('should not find a ltiTool by clientId and the local flag is false', async () => {
			const entity: LtiTool = ltiToolFactory.withLocal(false).buildWithId();
			await em.persistAndFlush(entity);

			const result = await repo.findByClientIdAndIsLocal(entity.oAuthClientId as string, entity.isLocal as boolean);

			expect(result.isLocal).toEqual(entity.isLocal);
		});

		it('should throw an error if the ltitool was not found', async () => {
			const entity: LtiTool = ltiToolFactory.buildWithId();
			await expect(repo.findByName(entity.name)).rejects.toThrow(NotFoundError);
		});
	});

	describe('findByOauthClientId', () => {
		it('should find a tool with the oAuthClientId', async () => {
			const oAuthClientId = 'clientId';
			const entity: LtiTool = ltiToolFactory.withOauthClientId(oAuthClientId).buildWithId();
			await em.persistAndFlush(entity);

			const result = await repo.findByOauthClientId(oAuthClientId);

			expect(result.oAuthClientId).toEqual(oAuthClientId);
		});

		it('should throw an error if the tool was not found', async () => {
			const oAuthClientId = 'NoExistingTool';

			await expect(repo.findByOauthClientId(oAuthClientId)).rejects.toThrow(NotFoundError);
		});
	});

	describe('find', () => {});

	describe('mapEntityToDO', () => {
		it('should return a domain object', () => {
			const testEntity: LtiTool = ltiToolFactory.buildWithId();

			const ltiToolDO: LtiToolDO = repo.mapEntityToDOSpec(testEntity);

			expect(testEntity).toEqual(expect.objectContaining(ltiToolDO));
		});
	});

	describe('mapDOToEntity', () => {
		it('should map DO to Entity', () => {
			const testDO: LtiToolDO = new LtiToolDO({
				id: 'testId',
				updatedAt: new Date('2022-07-20'),
				createdAt: new Date('2022-07-20'),
				name: 'toolName',
				oAuthClientId: 'clientId',
				secret: 'secret',
				isLocal: true,
				customs: [],
				isHidden: false,
				isTemplate: false,
				key: 'key',
				openNewTab: false,
				originToolId: undefined,
				privacy_permission: LtiPrivacyPermission.NAME,
				roles: [LtiRoleType.INSTRUCTOR, LtiRoleType.LEARNER],
				url: 'url',
				friendlyUrl: 'friendlyUrl',
				frontchannel_logout_uri: 'frontchannel_logout_uri',
			});

			const result: EntityProperties<ILtiToolProperties> = repo.mapDOToEntitySpec(testDO);

			expect(testDO).toEqual(expect.objectContaining(result));
		});
	});
});
