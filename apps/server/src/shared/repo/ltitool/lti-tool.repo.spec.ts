import { EntityProperties } from '@shared/repo';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections } from '@shared/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';
import { NotFoundError } from '@mikro-orm/core';
import { IFindOptions, ILtiToolProperties, LtiTool, Page, SortOrder } from '@shared/domain';
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

	let sortingMapper: DeepMocked<LtiToolSortingMapper>;

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

	function setup() {
		const ltiToolDO: LtiToolDO = new LtiToolDO({
			id: 'testId',
			updatedAt: new Date('2022-07-20'),
			createdAt: new Date('2022-07-20'),
			name: 'ltiTool',
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
		const queryLtiToolDO: Partial<LtiToolDO> = { name: 'ltiTool-*' };
		return {
			ltiToolDO,
			queryLtiToolDO,
		};
	}

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

	describe('find', () => {
		async function setupFind() {
			const { queryLtiToolDO } = setup();
			queryLtiToolDO.name = '.';

			const options: IFindOptions<LtiToolDO> = {};

			await em.nativeDelete(LtiTool, {});
			const ltiToolA: LtiTool = ltiToolFactory.withName('A').buildWithId();
			const ltiToolB: LtiTool = ltiToolFactory.withName('B').buildWithId();
			const ltiToolC: LtiTool = ltiToolFactory.withName('B').buildWithId();
			const ltiTools: LtiTool[] = [ltiToolA, ltiToolB, ltiToolC];
			await em.persistAndFlush([ltiToolA, ltiToolB, ltiToolC]);

			return { queryLtiToolDO, options, ltiTools };
		}

		describe('sortingMapper', () => {
			it('should call mapDOSortOrderToQueryOrder with options.order', async () => {
				const { queryLtiToolDO, options } = await setupFind();
				options.order = {
					name: SortOrder.asc,
				};

				await repo.find(queryLtiToolDO, options);

				expect(sortingMapper.mapDOSortOrderToQueryOrder).toHaveBeenCalledWith(options.order);
			});

			it('should call mapDOSortOrderToQueryOrder with an empty object', async () => {
				const { queryLtiToolDO, options } = await setupFind();
				options.order = undefined;

				await repo.find(queryLtiToolDO, options);

				expect(sortingMapper.mapDOSortOrderToQueryOrder).toHaveBeenCalledWith({});
			});
		});

		describe('pagination', () => {
			it('should return all ltiTools when options with pagination is set to undefined', async () => {
				const { queryLtiToolDO, ltiTools } = await setupFind();

				const page: Page<LtiToolDO> = await repo.find(queryLtiToolDO, undefined);

				expect(page.data.length).toBe(ltiTools.length);
			});

			it('should return one ltiTool when pagination has a limit of 1', async () => {
				const { queryLtiToolDO, options } = await setupFind();
				options.pagination = { limit: 1 };

				const page: Page<LtiToolDO> = await repo.find(queryLtiToolDO, options);

				expect(page.data.length).toBe(1);
			});

			it('should return no ltiTool when pagination has a limit of 1 and skip is set to 2', async () => {
				const { queryLtiToolDO, options } = await setupFind();
				options.pagination = { limit: 1, skip: 3 };

				const page: Page<LtiToolDO> = await repo.find(queryLtiToolDO, options);

				expect(page.data.length).toBe(0);
			});
		});

		describe('order', () => {
			it('should return ltiTools ordered by default _id when no order is specified', async () => {
				const { queryLtiToolDO, options, ltiTools } = await setupFind();
				sortingMapper.mapDOSortOrderToQueryOrder.mockReturnValue({});

				const page: Page<LtiToolDO> = await repo.find(queryLtiToolDO, options);

				expect(page.data[0].name).toEqual(ltiTools[0].name);
				expect(page.data[1].name).toEqual(ltiTools[1].name);
				expect(page.data[2].name).toEqual(ltiTools[2].name);
			});

			it('should return ltiTools ordered by name ascending', async () => {
				const { queryLtiToolDO, options, ltiTools } = await setupFind();

				options.order = {
					name: SortOrder.asc,
				};

				const page: Page<LtiToolDO> = await repo.find(queryLtiToolDO, options);

				expect(page.data[0].name).toEqual(ltiTools[0].name);
				expect(page.data[1].name).toEqual(ltiTools[1].name);
				expect(page.data[2].name).toEqual(ltiTools[2].name);
			});
		});
	});

	describe('mapEntityToDO', () => {
		it('should return a domain object', () => {
			const testEntity: LtiTool = ltiToolFactory.buildWithId();

			const ltiToolDO: LtiToolDO = repo.mapEntityToDOSpec(testEntity);

			expect(testEntity).toEqual(expect.objectContaining(ltiToolDO));
		});
	});

	describe('mapDOToEntity', () => {
		it('should map DO to Entity', () => {
			const { ltiToolDO } = setup();

			const result: EntityProperties<ILtiToolProperties> = repo.mapDOToEntitySpec(ltiToolDO);

			expect(ltiToolDO).toEqual(expect.objectContaining(result));
		});
	});
});
