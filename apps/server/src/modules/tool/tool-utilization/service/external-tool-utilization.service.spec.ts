import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardCommonToolService } from '@modules/board';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalToolService } from '../../context-external-tool';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { contextExternalToolFactory } from '../../context-external-tool/testing';
import { SchoolExternalToolService } from '../../school-external-tool';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { schoolExternalToolFactory } from '../../school-external-tool/testing';
import { ExternalToolUtilization, SchoolExternalToolUtilization } from '../domain';
import { ExternalToolUtilizationService } from './external-tool-utilization.service';

describe(ExternalToolUtilizationService.name, () => {
	let module: TestingModule;
	let service: ExternalToolUtilizationService;

	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let boardCommonToolService: DeepMocked<BoardCommonToolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ExternalToolUtilizationService,
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
				{
					provide: BoardCommonToolService,
					useValue: createMock<BoardCommonToolService>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolUtilizationService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		contextExternalToolService = module.get(ContextExternalToolService);
		boardCommonToolService = module.get(BoardCommonToolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getUtilizationForExternalTool', () => {
		describe('when the tool has no usages', () => {
			const setup = () => {
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([]);
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

				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool]);
				contextExternalToolService.findBySchoolToolIdsAndContextType.mockResolvedValueOnce(contextExternalTools);
				contextExternalToolService.findBySchoolToolIdsAndContextType.mockResolvedValueOnce(contextExternalTools);
				contextExternalToolService.findBySchoolToolIdsAndContextType.mockResolvedValueOnce(contextExternalTools);
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
				contextExternalToolService.findBySchoolToolIdsAndContextType.mockResolvedValueOnce([]);
				contextExternalToolService.findBySchoolToolIdsAndContextType.mockResolvedValueOnce([]);
				contextExternalToolService.findBySchoolToolIdsAndContextType.mockResolvedValueOnce([]);
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

				contextExternalToolService.findBySchoolToolIdsAndContextType.mockResolvedValueOnce(contextExternalTools);
				contextExternalToolService.findBySchoolToolIdsAndContextType.mockResolvedValueOnce(contextExternalTools);
				contextExternalToolService.findBySchoolToolIdsAndContextType.mockResolvedValueOnce(contextExternalTools);
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
