import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ContentElementService } from '@modules/board';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { contextExternalToolFactory, schoolExternalToolFactory } from '@shared/testing';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ExternalToolMetadata } from '../../external-tool/domain';
import { SchoolExternalTool, SchoolExternalToolMetadata } from '../../school-external-tool/domain';
import { CommonToolMetadataService } from './common-tool-metadata.service';

describe(CommonToolMetadataService.name, () => {
	let module: TestingModule;
	let service: CommonToolMetadataService;

	let schoolExternalToolRepo: DeepMocked<SchoolExternalToolRepo>;
	let contextExternalToolRepo: DeepMocked<ContextExternalToolRepo>;
	let contentElementService: DeepMocked<ContentElementService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonToolMetadataService,
				{
					provide: SchoolExternalToolRepo,
					useValue: createMock<SchoolExternalToolRepo>(),
				},
				{
					provide: ContextExternalToolRepo,
					useValue: createMock<ContextExternalToolRepo>(),
				},
				{
					provide: ContentElementService,
					useValue: createMock<ContentElementService>(),
				},
			],
		}).compile();

		service = module.get(CommonToolMetadataService);
		schoolExternalToolRepo = module.get(SchoolExternalToolRepo);
		contextExternalToolRepo = module.get(ContextExternalToolRepo);
		contentElementService = module.get(ContentElementService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getMetadataForExternalTool', () => {
		describe('when the tool has no usages', () => {
			const setup = () => {
				schoolExternalToolRepo.findByExternalToolId.mockResolvedValueOnce([]);
			};

			it('should return 0 usages for all contexts', async () => {
				setup();

				const result: ExternalToolMetadata = await service.getMetadataForExternalTool(new ObjectId().toHexString());

				expect(result).toEqual<ExternalToolMetadata>({
					schoolExternalToolCount: 0,
					contextExternalToolCountPerContext: {
						course: 0,
						boardElement: 0,
						mediaBoardElement: 0,
					},
				});
			});
		});

		describe('when the tool has usages in all contexts', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextExternalTools: ContextExternalTool[] = contextExternalToolFactory.buildListWithId(2);

				schoolExternalToolRepo.findByExternalToolId.mockResolvedValueOnce([schoolExternalTool]);
				contextExternalToolRepo.findBySchoolToolIdsAndContextType.mockResolvedValueOnce(contextExternalTools);
				contextExternalToolRepo.findBySchoolToolIdsAndContextType.mockResolvedValueOnce(contextExternalTools);
				contextExternalToolRepo.findBySchoolToolIdsAndContextType.mockResolvedValueOnce(contextExternalTools);
				contentElementService.countBoardUsageForExternalTools.mockResolvedValueOnce(3);
			};

			it('should return the amount of usages for all contexts', async () => {
				setup();

				const result: ExternalToolMetadata = await service.getMetadataForExternalTool(new ObjectId().toHexString());

				expect(result).toEqual<ExternalToolMetadata>({
					schoolExternalToolCount: 1,
					contextExternalToolCountPerContext: {
						course: 2,
						boardElement: 3,
						mediaBoardElement: 2,
					},
				});
			});
		});
	});

	describe('getMetadataForSchoolExternalTool', () => {
		describe('when the tool has no usages', () => {
			const setup = () => {
				contextExternalToolRepo.findBySchoolToolIdsAndContextType.mockResolvedValueOnce([]);
				contextExternalToolRepo.findBySchoolToolIdsAndContextType.mockResolvedValueOnce([]);
				contentElementService.countBoardUsageForExternalTools.mockResolvedValueOnce(0);
			};

			it('should return 0 usages for all contexts', async () => {
				setup();

				const result: SchoolExternalToolMetadata = await service.getMetadataForSchoolExternalTool(
					new ObjectId().toHexString()
				);

				expect(result).toEqual<SchoolExternalToolMetadata>({
					contextExternalToolCountPerContext: {
						course: 0,
						boardElement: 0,
						mediaBoardElement: 0,
					},
				});
			});
		});

		describe('when the tool has usages in all contexts', () => {
			const setup = () => {
				const contextExternalTools: ContextExternalTool[] = contextExternalToolFactory.buildListWithId(2);

				contextExternalToolRepo.findBySchoolToolIdsAndContextType.mockResolvedValueOnce(contextExternalTools);
				contextExternalToolRepo.findBySchoolToolIdsAndContextType.mockResolvedValueOnce(contextExternalTools);
				contentElementService.countBoardUsageForExternalTools.mockResolvedValueOnce(3);
			};

			it('should return the amount of usages for all contexts', async () => {
				setup();

				const result: SchoolExternalToolMetadata = await service.getMetadataForSchoolExternalTool(
					new ObjectId().toHexString()
				);

				expect(result).toEqual<SchoolExternalToolMetadata>({
					contextExternalToolCountPerContext: {
						course: 2,
						boardElement: 3,
						mediaBoardElement: 0,
					},
				});
			});
		});
	});
});
