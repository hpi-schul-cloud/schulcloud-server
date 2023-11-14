import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalToolRepo, ExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { externalToolFactory, legacySchoolDoFactory, schoolExternalToolFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { ToolContextType } from '../../common/enum';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ExternalTool, ExternalToolMetadata } from '../domain';
import { ExternalToolMetadataLoggable } from '../loggable/external-tool-metadata-loggable';
import { ExternalToolMetadataService } from './external-tool-metadata.service';

describe('ExternalToolMetadataService', () => {
	let module: TestingModule;
	let service: ExternalToolMetadataService;

	let externalToolRepo: DeepMocked<ExternalToolRepo>;
	let schoolExternalToolRepo: DeepMocked<SchoolExternalToolRepo>;
	let contextExternalToolRepo: DeepMocked<ContextExternalToolRepo>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ExternalToolMetadataService,
				{
					provide: ExternalToolRepo,
					useValue: createMock<ExternalToolRepo>(),
				},
				{
					provide: SchoolExternalToolRepo,
					useValue: createMock<SchoolExternalToolRepo>(),
				},
				{
					provide: ContextExternalToolRepo,
					useValue: createMock<ContextExternalToolRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolMetadataService);
		externalToolRepo = module.get(ExternalToolRepo);
		schoolExternalToolRepo = module.get(SchoolExternalToolRepo);
		contextExternalToolRepo = module.get(ContextExternalToolRepo);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getMetadata', () => {
		describe('when externalToolId is given', () => {
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();
				const externalTool: ExternalTool = externalToolFactory.buildWithId(undefined, toolId);

				const school = legacySchoolDoFactory.buildWithId();
				const school1 = legacySchoolDoFactory.buildWithId();

				const schoolToolId: string = new ObjectId().toHexString();
				const schoolToolId1: string = new ObjectId().toHexString();

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId,
					schoolId: school.id,
					id: schoolToolId,
				});
				const schoolExternalTool1: SchoolExternalTool = schoolExternalToolFactory.buildWithId(
					{ toolId, schoolId: school1.id, id: schoolToolId1 },
					schoolToolId1
				);

				const contextExternalToolCount = new Map<ToolContextType, number>();
				contextExternalToolCount.set(ToolContextType.COURSE, 3);
				contextExternalToolCount.set(ToolContextType.BOARD_ELEMENT, 3);

				const externalToolMetadata: ExternalToolMetadata = new ExternalToolMetadata({
					schoolExternalToolCount: 2,
					contextExternalToolCountPerContext: contextExternalToolCount,
				});

				externalToolRepo.findById.mockResolvedValue(externalTool);
				schoolExternalToolRepo.findByExternalToolId.mockResolvedValue([schoolExternalTool, schoolExternalTool1]);
				contextExternalToolRepo.countContextExternalToolsBySchoolToolIdsAndContextType.mockResolvedValue(3);

				return {
					toolId,
					externalToolMetadata,
					schoolExternalTool,
					schoolExternalTool1,
				};
			};

			it('should call the repo to get schoolExternalTools by externalToolId', async () => {
				const { toolId } = setup();

				await service.getMetaData(toolId);

				expect(schoolExternalToolRepo.findByExternalToolId).toHaveBeenCalledWith(toolId);
			});

			it('should call the repo to count contextExternalTools by schoolExternalToolId and context', async () => {
				const { toolId, schoolExternalTool, schoolExternalTool1 } = setup();

				await service.getMetaData(toolId);

				expect(contextExternalToolRepo.countContextExternalToolsBySchoolToolIdsAndContextType).toHaveBeenCalledWith(
					ToolContextType.COURSE,
					[schoolExternalTool.id, schoolExternalTool1.id]
				);
				expect(contextExternalToolRepo.countContextExternalToolsBySchoolToolIdsAndContextType).toHaveBeenCalledWith(
					ToolContextType.BOARD_ELEMENT,
					[schoolExternalTool.id, schoolExternalTool1.id]
				);
				expect(contextExternalToolRepo.countContextExternalToolsBySchoolToolIdsAndContextType).toHaveBeenCalledTimes(2);
			});

			it('should return externalToolMetadata', async () => {
				const { toolId, externalToolMetadata } = setup();

				const result: ExternalToolMetadata = await service.getMetaData(toolId);

				expect(result).toEqual(externalToolMetadata);
			});
		});

		describe('when no related school external tool was found', () => {
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();
				const externalToolEntity: ExternalTool = externalToolFactory.buildWithId(undefined, toolId);

				const contextExternalToolCount = new Map<ToolContextType, number>();
				contextExternalToolCount.set(ToolContextType.COURSE, 0);
				contextExternalToolCount.set(ToolContextType.BOARD_ELEMENT, 0);

				const externalToolMetadata: ExternalToolMetadata = new ExternalToolMetadata({
					schoolExternalToolCount: 0,
					contextExternalToolCountPerContext: contextExternalToolCount,
				});

				externalToolRepo.findById.mockResolvedValue(externalToolEntity);
				schoolExternalToolRepo.findByExternalToolId.mockResolvedValue([]);
				contextExternalToolRepo.countContextExternalToolsBySchoolToolIdsAndContextType.mockResolvedValue(0);

				return {
					toolId,
					externalToolEntity,
					externalToolMetadata,
				};
			};

			it('should return empty externalToolMetadata', async () => {
				const { toolId, externalToolMetadata } = setup();

				const result: ExternalToolMetadata = await service.getMetaData(toolId);

				expect(result).toEqual(externalToolMetadata);
				expect(logger.info).toHaveBeenCalledWith(
					new ExternalToolMetadataLoggable(
						`There are no such schoolExternalTools for toolId: ${toolId}, returning empty metadata.`
					)
				);
			});
		});
	});
});
