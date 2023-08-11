import { Test, TestingModule } from '@nestjs/testing';
import { externalToolFactory, setupEntities } from '@shared/testing';
import { EntityId, Page } from '@shared/domain';
import { ExternalToolConfigurationService } from './external-tool-configuration.service';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { ExternalTool } from '../domain';

describe('ExternalToolConfigurationService', () => {
	let module: TestingModule;
	let service: ExternalToolConfigurationService;

	let toolFeatures: IToolFeatures;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				ExternalToolConfigurationService,
				{
					provide: ToolFeatures,
					useValue: {
						contextConfigurationEnabled: false,
					},
				},
			],
		}).compile();

		service = module.get(ExternalToolConfigurationService);
		toolFeatures = module.get(ToolFeatures);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('filterForAvailableTools', () => {
		describe('when page ', () => {
			const setup = () => {
				const externalTools: ExternalTool[] = [
					externalToolFactory.buildWithId(undefined, 'usedToolId'),
					externalToolFactory.buildWithId(undefined, 'unusedToolId'),
					externalToolFactory.buildWithId({ isHidden: true }, 'hiddenToolId'),
				];
				const externalToolsPage: Page<ExternalTool> = new Page<ExternalTool>(externalTools, 2);
				const toolIdsInUse: EntityId[] = ['usedToolId', 'hiddenToolId'];

				return { externalToolsPage, toolIdsInUse };
			};

			it('should filter out hidden tools', () => {
				const { externalToolsPage, toolIdsInUse } = setup();

				const result = service.filterForAvailableTools(externalToolsPage, toolIdsInUse);

				expect(result.some((tool) => tool.id === 'usedToolId')).toBe(false);
			});
		});
	});

	describe('filterForAvailableSchoolExternalTools', () => {
		describe('when ...', () => {
			const setup = () => {};

			it('should ...', () => {});
		});
	});

	describe('filterForAvailableExternalTools', () => {
		describe('when ...', () => {
			const setup = () => {};

			it('should ...', () => {});
		});
	});

	describe('filterParametersForScope', () => {
		describe('when ...', () => {
			const setup = () => {};

			it('should ...', () => {});
		});
	});
});
