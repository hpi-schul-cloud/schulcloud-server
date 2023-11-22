import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { externalToolFactory, legacySchoolDoFactory, schoolExternalToolFactory } from '@shared/testing';
import { ContextExternalToolType } from '../../context-external-tool/entity';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ExternalTool, ExternalToolMetadata } from '../domain';
import { ExternalToolMetadataService } from './external-tool-metadata.service';

describe('ExternalToolMetadataService', () => {
	let module: TestingModule;
	let service: ExternalToolMetadataService;

	let schoolExternalToolRepo: DeepMocked<SchoolExternalToolRepo>;
	let contextExternalToolRepo: DeepMocked<ContextExternalToolRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ExternalToolMetadataService,
				{
					provide: SchoolExternalToolRepo,
					useValue: createMock<SchoolExternalToolRepo>(),
				},
				{
					provide: ContextExternalToolRepo,
					useValue: createMock<ContextExternalToolRepo>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolMetadataService);
		schoolExternalToolRepo = module.get(SchoolExternalToolRepo);
		contextExternalToolRepo = module.get(ContextExternalToolRepo);
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

				const externalToolMetadata: ExternalToolMetadata = new ExternalToolMetadata({
					schoolExternalToolCount: 2,
					contextExternalToolCountPerContext: { course: 3, boardElement: 3 },
				});

				schoolExternalToolRepo.findByExternalToolId.mockResolvedValue([schoolExternalTool, schoolExternalTool1]);
				contextExternalToolRepo.countBySchoolToolIdsAndContextType.mockResolvedValue(3);

				return {
					toolId,
					externalToolMetadata,
					schoolExternalTool,
					schoolExternalTool1,
				};
			};

			it('should call the repo to get schoolExternalTools by externalToolId', async () => {
				const { toolId } = setup();

				await service.getMetadata(toolId);

				expect(schoolExternalToolRepo.findByExternalToolId).toHaveBeenCalledWith(toolId);
			});

			it('should call the repo to count contextExternalTools by schoolExternalToolId and context', async () => {
				const { toolId, schoolExternalTool, schoolExternalTool1 } = setup();

				await service.getMetadata(toolId);

				expect(contextExternalToolRepo.countBySchoolToolIdsAndContextType).toHaveBeenCalledWith(
					ContextExternalToolType.COURSE,
					[schoolExternalTool.id, schoolExternalTool1.id]
				);
				expect(contextExternalToolRepo.countBySchoolToolIdsAndContextType).toHaveBeenCalledWith(
					ContextExternalToolType.BOARD_ELEMENT,
					[schoolExternalTool.id, schoolExternalTool1.id]
				);
				expect(contextExternalToolRepo.countBySchoolToolIdsAndContextType).toHaveBeenCalledTimes(2);
			});

			it('should return externalToolMetadata', async () => {
				const { toolId, externalToolMetadata } = setup();

				const result: ExternalToolMetadata = await service.getMetadata(toolId);

				expect(result).toEqual(externalToolMetadata);
			});
		});

		describe('when no related school external tool was found', () => {
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();
				const externalToolEntity: ExternalTool = externalToolFactory.buildWithId(undefined, toolId);

				const externalToolMetadata: ExternalToolMetadata = new ExternalToolMetadata({
					schoolExternalToolCount: 0,
					contextExternalToolCountPerContext: { course: 0, boardElement: 0 },
				});

				schoolExternalToolRepo.findByExternalToolId.mockResolvedValue([]);
				contextExternalToolRepo.countBySchoolToolIdsAndContextType.mockResolvedValue(0);

				return {
					toolId,
					externalToolEntity,
					externalToolMetadata,
				};
			};

			it('should return empty externalToolMetadata', async () => {
				const { toolId, externalToolMetadata } = setup();

				const result: ExternalToolMetadata = await service.getMetadata(toolId);

				expect(result).toEqual(externalToolMetadata);
			});
		});
	});
});
