import { LegacyLogger } from '@core/logger';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { ExternalToolSearchQuery } from '@modules/tool';
import { ExternalToolMediumStatus } from '@modules/tool/external-tool/enum';
import { Test, TestingModule } from '@nestjs/testing';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions, SortOrder } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { CustomParameter } from '../../../common/domain';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	LtiMessageType,
	LtiPrivacyPermission,
} from '../../../common/enum';
import { BasicToolConfig, ExternalTool, Lti11ToolConfig, Oauth2ToolConfig } from '../../domain';
import { externalToolEntityFactory, externalToolFactory } from '../../testing';
import { ExternalToolEntity } from './external-tool.entity';
import { ExternalToolRepo } from './external-tool.repo';
import { ExternalToolRepoMapper } from './mapper';

describe(ExternalToolRepo.name, () => {
	let module: TestingModule;
	let repo: ExternalToolRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [ExternalToolEntity] })],
			providers: [
				ExternalToolRepo,
				ExternalToolRepoMapper,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		repo = module.get(ExternalToolRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	const setup = async () => {
		const client1Id = 'client-1';
		const client2Id = 'client-2';

		const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.withBasicConfig().buildWithId();
		const externalOauthTool: ExternalToolEntity = externalToolEntityFactory
			.withOauth2Config({ clientId: 'client-1' })
			.buildWithId();
		const externalOauthTool2: ExternalToolEntity = externalToolEntityFactory
			.withOauth2Config({ clientId: 'client-2' })
			.buildWithId();
		const externalLti11Tool: ExternalToolEntity = externalToolEntityFactory.withLti11Config().buildWithId();

		await em.persistAndFlush([externalToolEntity, externalOauthTool, externalOauthTool2, externalLti11Tool]);
		em.clear();

		const queryExternalToolDO: ExternalToolSearchQuery = { name: 'external-tool-*' };

		return {
			externalToolEntity,
			externalOauthTool,
			externalOauthTool2,
			externalLti11Tool,
			client1Id,
			client2Id,
			queryExternalToolDO,
		};
	};

	it('getEntityName should return ExternalTool', () => {
		const { entityName } = repo;
		expect(entityName).toEqual(ExternalToolEntity);
	});

	describe('findByName', () => {
		it('should find an external tool with given toolName', async () => {
			const { externalToolEntity } = await setup();

			const result: ExternalTool | null = await repo.findByName(externalToolEntity.name);

			expect(result?.name).toEqual(externalToolEntity.name);
		});

		it('should return null when no external tool with the given name was found', async () => {
			await setup();

			const result: ExternalTool | null = await repo.findByName('notExisting');

			expect(result).toBeNull();
		});
	});

	describe('findByOAuth2ConfigClientId', () => {
		it('should find external tool with given client id', async () => {
			const { client1Id } = await setup();

			const result: ExternalTool | null = await repo.findByOAuth2ConfigClientId(client1Id);

			expect((result?.config as Oauth2ToolConfig).clientId).toEqual(client1Id);
		});

		it('should return an empty array when no externalTools were found', async () => {
			await setup();

			const result: ExternalTool | null = await repo.findByOAuth2ConfigClientId('unknown-client');

			expect(result).toBeNull();
		});
	});

	describe('save', () => {
		const setupDO = (config: BasicToolConfig | Lti11ToolConfig | Oauth2ToolConfig) => {
			const domainObject: ExternalTool = externalToolFactory.build({
				name: 'name',
				url: 'url',
				logoUrl: 'logoUrl',
				config,
				parameters: [
					new CustomParameter({
						name: 'name',
						regex: 'regex',
						displayName: 'displayName',
						description: 'description',
						type: CustomParameterType.NUMBER,
						scope: CustomParameterScope.SCHOOL,
						default: 'default',
						location: CustomParameterLocation.BODY,
						regexComment: 'mockComment',
						isOptional: false,
						isProtected: false,
					}),
				],
				isHidden: true,
				openNewTab: true,
				isDeactivated: false,
			});

			return {
				domainObject,
			};
		};

		it('should save an basic tool correctly', async () => {
			const config: BasicToolConfig = new BasicToolConfig({
				baseUrl: 'baseUrl',
			});
			const { domainObject } = setupDO(config);

			const result: ExternalTool = await repo.save(domainObject);

			expect(result).toMatchObject({ ...domainObject.getProps(), id: expect.any(String), createdAt: expect.any(Date) });
		});

		it('should save an oauth2 tool correctly', async () => {
			const config: Oauth2ToolConfig = new Oauth2ToolConfig({
				baseUrl: 'baseUrl',
				clientId: 'clientId',
				skipConsent: true,
			});
			const { domainObject } = setupDO(config);

			const result: ExternalTool = await repo.save(domainObject);

			expect(result).toMatchObject({ ...domainObject.getProps(), id: expect.any(String), createdAt: expect.any(Date) });
		});

		it('should save an lti11 tool correctly', async () => {
			const config: Lti11ToolConfig = new Lti11ToolConfig({
				baseUrl: 'baseUrl',
				secret: 'secret',
				key: 'key',
				lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
				privacy_permission: LtiPrivacyPermission.PSEUDONYMOUS,
				launch_presentation_locale: 'de-DE',
			});
			const { domainObject } = setupDO(config);

			const result: ExternalTool = await repo.save(domainObject);

			expect(result).toMatchObject({ ...domainObject.getProps(), id: expect.any(String), createdAt: expect.any(Date) });
		});
	});

	describe('find', () => {
		const setupFind = async () => {
			const { queryExternalToolDO } = await setup();
			queryExternalToolDO.name = '.';

			const options: IFindOptions<ExternalTool> = {};

			await em.nativeDelete(ExternalToolEntity, {});
			const ltiToolA: ExternalToolEntity = externalToolEntityFactory.withName('A').buildWithId();
			const ltiToolB: ExternalToolEntity = externalToolEntityFactory.withName('B').withMedium().buildWithId();
			const ltiToolC: ExternalToolEntity = externalToolEntityFactory.withName('C').withMedium().buildWithId();
			const ltiToolD: ExternalToolEntity = externalToolEntityFactory
				.withName('B')
				.withMedium({ status: ExternalToolMediumStatus.DRAFT })
				.buildWithId();
			const ltiTools: ExternalToolEntity[] = [ltiToolA, ltiToolB, ltiToolC, ltiToolD];
			await em.persistAndFlush([ltiToolA, ltiToolB, ltiToolC, ltiToolD]);
			em.clear();

			return { queryExternalToolDO, options, ltiTools };
		};

		describe('pagination', () => {
			it('should return all active external tools when options with pagination is set to undefined', async () => {
				const { queryExternalToolDO, ltiTools } = await setupFind();

				const page: Page<ExternalTool> = await repo.find(queryExternalToolDO, undefined);

				expect(page.data.length).toBe(ltiTools.length - 1);
			});

			it('should return one external tools when pagination has a limit of 1', async () => {
				const { queryExternalToolDO, options } = await setupFind();
				options.pagination = { limit: 1 };

				const page: Page<ExternalTool> = await repo.find(queryExternalToolDO, options);

				expect(page.data.length).toBe(1);
			});

			it('should return no external tools when pagination has a limit of 1 and skip is set to 2', async () => {
				const { queryExternalToolDO, options } = await setupFind();
				options.pagination = { limit: 1, skip: 3 };

				const page: Page<ExternalTool> = await repo.find(queryExternalToolDO, options);

				expect(page.data.length).toBe(0);
			});
		});

		describe('order', () => {
			it('should return external tools ordered by default _id when no order is specified', async () => {
				const { queryExternalToolDO, options, ltiTools } = await setupFind();

				const page: Page<ExternalTool> = await repo.find(queryExternalToolDO, options);

				expect(page.data[0].name).toEqual(ltiTools[0].name);
				expect(page.data[1].name).toEqual(ltiTools[1].name);
				expect(page.data[2].name).toEqual(ltiTools[2].name);
			});

			it('should return external tools ordered by name ascending', async () => {
				const { queryExternalToolDO, options, ltiTools } = await setupFind();

				options.order = {
					name: SortOrder.asc,
				};

				const page: Page<ExternalTool> = await repo.find(queryExternalToolDO, options);

				expect(page.data[0].name).toEqual(ltiTools[0].name);
				expect(page.data[1].name).toEqual(ltiTools[1].name);
				expect(page.data[2].name).toEqual(ltiTools[2].name);
			});
		});

		describe('when query is given', () => {
			it('should populate thumbnail', async () => {
				const { queryExternalToolDO, options } = await setupFind();

				const page: Page<ExternalTool> = await repo.find(queryExternalToolDO, options);

				expect(page.data[0].thumbnail?.fileName).toBeDefined();
			});

			describe('by ids', () => {
				it('should return external tools for given ids', async () => {
					const { options, ltiTools } = await setupFind();
					const query: ExternalToolSearchQuery = { ids: [ltiTools[0].id, ltiTools[1].id] };

					const page: Page<ExternalTool> = await repo.find(query, options);

					expect(page.data.length).toBe(2);
					expect(page.data[0].name).toEqual(ltiTools[0].name);
					expect(page.data[1].name).toEqual(ltiTools[1].name);
				});
			});

			describe('by template or draft', () => {
				it('should not return external tool with not active medium status', async () => {
					const { options, ltiTools } = await setupFind();
					const query: ExternalToolSearchQuery = { isTemplateOrDraft: true };

					const page: Page<ExternalTool> = await repo.find(query, options);

					expect(page.data.length).toBe(4);
					expect(page.data[0].name).toEqual(ltiTools[0].name);
					expect(page.data[1].name).toEqual(ltiTools[1].name);
					expect(page.data[2].name).toEqual(ltiTools[2].name);
					expect(page.data[3].name).toEqual(ltiTools[3].name);
				});
			});
		});
	});

	describe('findById', () => {
		const setup2 = async () => {
			const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId();

			await em.persistAndFlush(externalToolEntity);
			em.clear();

			return {
				externalToolEntity,
			};
		};

		describe('when external tool is found', () => {
			it('should return external tool with given id', async () => {
				const { externalToolEntity } = await setup2();

				const result: ExternalTool | null = await repo.findById(externalToolEntity.id);

				expect(result?.name).toEqual(externalToolEntity.name);
			});
		});

		describe('when external tool is not found', () => {
			it('should throw not found error', async () => {
				await setup2();

				await expect(repo.findById('not-existing-id')).rejects.toThrowError();
			});
		});
	});

	describe('findByMedium', () => {
		describe('when external tool is found', () => {
			const setup2 = async () => {
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					medium: {
						mediumId: 'mediumId',
						mediaSourceId: 'mediaSourceId',
					},
				});

				const otherExternalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					medium: {
						mediumId: 'mediumId',
					},
				});

				await em.persistAndFlush([externalToolEntity, otherExternalToolEntity]);
				em.clear();

				return {
					externalToolEntity,
					otherExternalToolEntity,
				};
			};

			it('should find an external tool with given medium', async () => {
				const { externalToolEntity } = await setup2();

				const result: ExternalTool | null = await repo.findByMedium('mediumId', 'mediaSourceId');

				expect(result?.name).toEqual(externalToolEntity.name);
			});

			it('should find an external tool with given mediumId without mediaSourceId', async () => {
				const { otherExternalToolEntity } = await setup2();

				const result: ExternalTool | null = await repo.findByMedium('mediumId');

				expect(result?.name).toEqual(otherExternalToolEntity.name);
			});
		});

		describe('when external tool is not found', () => {
			const setup2 = async () => {
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					medium: {
						mediumId: 'mediumId',
						mediaSourceId: 'mediaSourceId',
					},
				});

				await em.persistAndFlush(externalToolEntity);
				em.clear();
			};

			it('should return null when no external tool with the given mediumId was found', async () => {
				await setup2();

				const result: ExternalTool | null = await repo.findByMedium('notExisting');

				expect(result).toBeNull();
			});
		});
	});

	describe('deleteById', () => {
		const setup2 = async () => {
			const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId();

			await em.persistAndFlush(externalToolEntity);
			em.clear();

			return {
				externalToolEntity,
			};
		};

		it('should delete external tool with given id', async () => {
			const { externalToolEntity } = await setup2();

			await repo.deleteById(externalToolEntity.id);

			await expect(repo.findById(externalToolEntity.id)).rejects.toThrowError();
		});
	});

	describe('findAllByMediaSource', () => {
		describe('when external tools are found', () => {
			const localSetup = async () => {
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					medium: {
						mediumId: 'mediumId',
						mediaSourceId: 'mediaSourceId',
					},
				});

				const otherExternalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					medium: {
						mediumId: 'mediumId',
					},
				});

				const draftExternalToolEntity: ExternalToolEntity = externalToolEntityFactory
					.withMedium({ status: ExternalToolMediumStatus.DRAFT })
					.buildWithId();

				const templateExternalToolEntity: ExternalToolEntity = externalToolEntityFactory
					.withMedium({ status: ExternalToolMediumStatus.TEMPLATE, mediumId: undefined })
					.buildWithId();

				await em.persistAndFlush([
					externalToolEntity,
					otherExternalToolEntity,
					draftExternalToolEntity,
					templateExternalToolEntity,
				]);
				em.clear();

				return {
					externalToolEntity,
					draftExternalToolEntity,
				};
			};

			it('should find external tools by mediaSourceId, but no templates', async () => {
				const { externalToolEntity, draftExternalToolEntity } = await localSetup();

				const result: ExternalTool[] | null = await repo.findAllByMediaSource('mediaSourceId');

				expect(result[0]?.name).toEqual(externalToolEntity.name);
				expect(result[1]?.name).toEqual(draftExternalToolEntity.name);
			});
		});

		describe('when external tools are not found', () => {
			const localSetup = async () => {
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					medium: {
						mediumId: 'mediumId',
						mediaSourceId: 'mediaSourceId',
					},
				});

				await em.persistAndFlush(externalToolEntity);
				em.clear();
			};

			it('should return empty array', async () => {
				await localSetup();

				const result: ExternalTool[] = await repo.findAllByMediaSource('notExisting');

				expect(result).toEqual([]);
			});
		});
	});

	describe('saveAll', () => {
		describe('when the external tools passed do not exist', () => {
			it('should save all the external tools', async () => {
				const externalToolDOs: ExternalTool[] = externalToolFactory.buildList(5);

				await repo.saveAll(externalToolDOs);
				const savedTools = await em.find(ExternalToolEntity, {});

				expect(savedTools.length).toEqual(externalToolDOs.length);
				expect(savedTools).toEqual(
					expect.arrayContaining(
						externalToolDOs.map((externalToolDO: ExternalTool) => {
							const entity = externalToolEntityFactory.buildWithId(
								ExternalToolRepoMapper.mapDOToEntityProperties(externalToolDO),
								externalToolDO.id
							);
							entity.createdAt = expect.any(Date) as unknown as Date;
							entity.updatedAt = expect.any(Date) as unknown as Date;

							return entity;
						})
					)
				);
			});

			it('should return the saved external tools', async () => {
				const externalToolDOs: ExternalTool[] = externalToolFactory.buildList(5);

				const result: ExternalTool[] = await repo.saveAll(externalToolDOs);

				expect(result).toEqual(
					expect.arrayContaining(
						externalToolDOs.map((externalToolDO: ExternalTool) =>
							externalToolFactory.buildWithId(
								{
									...externalToolDO.getProps(),
									parameters: [],
									createdAt: expect.any(Date) as unknown as Date,
								},
								externalToolDO.id
							)
						)
					)
				);
			});
		});

		describe('when the external tools passed exist', () => {
			const setupEntities = async () => {
				const existingTools: ExternalTool[] = externalToolFactory.buildList(3);

				const externalToolEntities: ExternalToolEntity[] = existingTools.map((externalToolDO: ExternalTool) =>
					externalToolEntityFactory.buildWithId(
						ExternalToolRepoMapper.mapDOToEntityProperties(externalToolDO),
						externalToolDO.id
					)
				);

				await em.persistAndFlush(externalToolEntities);
				em.clear();

				const externalToolDOs: ExternalTool[] = existingTools.map((existingTool: ExternalTool) =>
					externalToolFactory.buildWithId(
						{
							...existingTool.getProps(),
							name: `new-${existingTool.name}`,
							description: `new-${existingTool?.description ?? 'description'}`,
						},
						existingTool.id
					)
				);

				return {
					externalToolDOs,
				};
			};

			it('should update the existing the external tools', async () => {
				const { externalToolDOs } = await setupEntities();

				await repo.saveAll(externalToolDOs);
				const updatedEntities = await em.find(ExternalToolEntity, {});

				expect(updatedEntities).toEqual(
					expect.arrayContaining(
						externalToolDOs.map((externalToolDO: ExternalTool) => {
							const entity = externalToolEntityFactory.buildWithId(
								ExternalToolRepoMapper.mapDOToEntityProperties(externalToolDO),
								externalToolDO.id
							);
							entity.createdAt = expect.any(Date) as unknown as Date;
							entity.updatedAt = expect.any(Date) as unknown as Date;

							return entity;
						})
					)
				);
			});

			it('should return the updated external tools', async () => {
				const { externalToolDOs } = await setupEntities();

				const result: ExternalTool[] = await repo.saveAll(externalToolDOs);

				const things = externalToolDOs.map((externalToolDO: ExternalTool) =>
					externalToolFactory.buildWithId(
						{
							...externalToolDO.getProps(),
							parameters: [],
							createdAt: expect.any(Date) as unknown as Date,
						},
						externalToolDO.id
					)
				);

				expect(result).toEqual(expect.arrayContaining(things));
			});
		});
	});
});
