import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardCommonToolService } from '@modules/board';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ContextExternalToolRepo } from '../../context-external-tool/repo';
import { contextExternalToolFactory } from '../../context-external-tool/testing';
import { ExternalToolUtilization } from '../../external-tool/domain';
import { SchoolExternalTool, SchoolExternalToolUtilization } from '../../school-external-tool/domain';
import { SchoolExternalToolRepo } from '../../school-external-tool/repo';
import { schoolExternalToolFactory } from '../../school-external-tool/testing';
import { CommonToolUtilizationService } from './common-tool-utilization.service';

describe(CommonToolUtilizationService.name, () => {
	let module: TestingModule;
	let service: CommonToolUtilizationService;

	let schoolExternalToolRepo: DeepMocked<SchoolExternalToolRepo>;
	let contextExternalToolRepo: DeepMocked<ContextExternalToolRepo>;
	let boardCommonToolService: DeepMocked<BoardCommonToolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonToolUtilizationService,
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

		service = module.get(CommonToolUtilizationService);
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

				const result: ExternalToolUtilization = await service.getUtilizationForExternalTool(
					new ObjectId().toHexString()
				);

				expect(result).toEqual<ExternalToolUtilization>({
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

				const result: ExternalToolUtilization = await service.getUtilizationForExternalTool(
					new ObjectId().toHexString()
				);

				expect(result).toEqual<ExternalToolUtilization>({
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

				const result: SchoolExternalToolUtilization = await service.getUtilizationForSchoolExternalTool(
					new ObjectId().toHexString()
				);

				expect(result).toEqual<SchoolExternalToolUtilization>({
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

				const result: SchoolExternalToolUtilization = await service.getUtilizationForSchoolExternalTool(
					new ObjectId().toHexString()
				);

				expect(result).toEqual<SchoolExternalToolUtilization>({
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
