import { createMock } from '@golevelup/ts-jest';
import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ILtiToolProperties, LtiTool } from '@shared/domain';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiPrivacyPermission, LtiRoleType } from '@shared/domain/entity/ltitool.entity';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { LtiToolRepo } from '@shared/repo/ltitool/ltitool.repo';
import { cleanupCollections } from '@shared/testing';
import { ltiToolFactory } from '@shared/testing/factory/ltitool.factory';
import { LegacyLogger } from '@src/core/logger';

class LtiToolRepoSpec extends LtiToolRepo {
	mapEntityToDOSpec(entity: LtiTool): LtiToolDO {
		return super.mapEntityToDO(entity);
	}

	mapDOToEntityPropertiesSpec(entityDO: LtiToolDO): ILtiToolProperties {
		return super.mapDOToEntityProperties(entityDO);
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
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
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

	describe('entityFactory', () => {
		const props: ILtiToolProperties = {
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
		};

		it('should return new entity of type LtiTool', () => {
			const result: LtiTool = repo.entityFactory(props);

			expect(result).toBeInstanceOf(LtiTool);
		});

		it('should return new entity with values from properties', () => {
			const result: LtiTool = repo.entityFactory(props);

			expect(result).toEqual(expect.objectContaining(props));
		});
	});

	describe('findByUserAndTool', () => {
		it('should find a ltitool by userId and toolId', async () => {
			const entity: LtiTool = ltiToolFactory.buildWithId();
			await em.persistAndFlush(entity);

			const result: LtiToolDO[] = await repo.findByName(entity.name);

			expect(result[0].id).toEqual(entity.id);
		});

		it('should throw an error if the ltitool was not found', async () => {
			const entity: LtiTool = ltiToolFactory.buildWithId();
			await expect(repo.findByName(entity.name)).rejects.toThrow(NotFoundError);
		});
	});

	describe('findByClientIdAndIsLocal', () => {
		describe('when the tool exists', () => {
			const setup = async () => {
				const clientId = 'clientId';
				const ltiTool: LtiTool = ltiToolFactory.buildWithId({ oAuthClientId: clientId });

				await em.persistAndFlush(ltiTool);

				return {
					clientId,
					ltiTool,
				};
			};

			it('should return the tool', async () => {
				const { ltiTool, clientId } = await setup();

				const result: LtiToolDO | null = await repo.findByClientIdAndIsLocal(clientId, true);

				expect(result?.id).toEqual(ltiTool.id);
			});
		});

		describe('when no tool exists', () => {
			it('should return the tool', async () => {
				const result: LtiToolDO | null = await repo.findByClientIdAndIsLocal(new ObjectId().toHexString(), true);

				expect(result).toBeNull();
			});
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

	describe('mapEntityToDO', () => {
		it('should return a domain object', () => {
			const testEntity = ltiToolFactory.buildWithId();

			const ltiToolDO: LtiToolDO = repo.mapEntityToDOSpec(testEntity);

			expect(testEntity).toEqual(expect.objectContaining(ltiToolDO));
		});
	});

	describe('mapDOToEntityProperties', () => {
		it('should map DO to Entity Properties', () => {
			const testDO: LtiToolDO = new LtiToolDO({
				id: 'testId',
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

			const result: ILtiToolProperties = repo.mapDOToEntityPropertiesSpec(testDO);

			expect(testDO).toEqual(expect.objectContaining(result));
		});
	});
});
