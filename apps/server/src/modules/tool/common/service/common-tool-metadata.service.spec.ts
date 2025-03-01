import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardCommonToolService } from '@modules/board';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ContextExternalToolRepo } from '../../context-external-tool/repo';
import { contextExternalToolFactory } from '../../context-external-tool/testing';
import { ExternalToolMetadata } from '../../external-tool/domain';
import { SchoolExternalTool, SchoolExternalToolMetadata } from '../../school-external-tool/domain';
import { SchoolExternalToolRepo } from '../../school-external-tool/repo';
import { schoolExternalToolFactory } from '../../school-external-tool/testing';
import { CommonToolMetadataService } from './common-tool-metadata.service';

describe(CommonToolMetadataService.name, () => {
	let module: TestingModule;
	let service: CommonToolMetadataService;

	let schoolExternalToolRepo: DeepMocked<SchoolExternalToolRepo>;
	let contextExternalToolRepo: DeepMocked<ContextExternalToolRepo>;
	let boardCommonToolService: DeepMocked<BoardCommonToolService>;

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
					provide: BoardCommonToolService,
					useValue: createMock<BoardCommonToolService>(),
				},
			],
		}).compile();

		service = module.get(CommonToolMetadataService);
		schoolExternalToolRepo = module.get(SchoolExternalToolRepo);
		contextExternalToolRepo = module.get(ContextExternalToolRepo);
		boardCommonToolService = module.get(BoardCommonToolService);
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
						mediaBoard: 0,
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
				boardCommonToolService.countBoardUsageForExternalTools.mockResolvedValueOnce(3);
			};

			it('should return the amount of usages for all contexts', async () => {
				setup();

				const result: ExternalToolMetadata = await service.getMetadataForExternalTool(new ObjectId().toHexString());

				expect(result).toEqual<ExternalToolMetadata>({
					schoolExternalToolCount: 1,
					contextExternalToolCountPerContext: {
						course: 2,
						boardElement: 3,
						mediaBoard: 2,
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
				contextExternalToolRepo.findBySchoolToolIdsAndContextType.mockResolvedValueOnce([]);
				boardCommonToolService.countBoardUsageForExternalTools.mockResolvedValueOnce(0);
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
						mediaBoard: 0,
					},
				});
			});
		});

		describe('when the tool has usages in all contexts', () => {
			const setup = () => {
				const contextExternalTools: ContextExternalTool[] = contextExternalToolFactory.buildListWithId(2);

				contextExternalToolRepo.findBySchoolToolIdsAndContextType.mockResolvedValueOnce(contextExternalTools);
				contextExternalToolRepo.findBySchoolToolIdsAndContextType.mockResolvedValueOnce(contextExternalTools);
				contextExternalToolRepo.findBySchoolToolIdsAndContextType.mockResolvedValueOnce(contextExternalTools);
				boardCommonToolService.countBoardUsageForExternalTools.mockResolvedValueOnce(3);
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
						mediaBoard: 2,
					},
				});
			});
		});
	});
});
