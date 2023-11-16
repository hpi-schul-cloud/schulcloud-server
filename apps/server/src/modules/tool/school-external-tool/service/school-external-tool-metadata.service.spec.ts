import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { legacySchoolDoFactory, schoolExternalToolFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { SchoolExternalTool, SchoolExternalToolMetadata } from '../domain';
import { SchoolExternalToolMetadataService } from './school-external-tool-metadata.service';

describe('SchoolExternalToolMetadataService', () => {
	let module: TestingModule;
	let service: SchoolExternalToolMetadataService;

	let schoolExternalToolRepo: DeepMocked<SchoolExternalToolRepo>;
	let contextExternalToolRepo: DeepMocked<ContextExternalToolRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolExternalToolMetadataService,
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

		service = module.get(SchoolExternalToolMetadataService);
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
		describe('when schoolExternalToolId is given', () => {
			const setup = () => {
				const school = legacySchoolDoFactory.buildWithId();
				const school1 = legacySchoolDoFactory.buildWithId();

				const schoolToolId: string = new ObjectId().toHexString();
				const schoolToolId1: string = new ObjectId().toHexString();

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolId: school.id,
					id: schoolToolId,
				});
				const schoolExternalTool1: SchoolExternalTool = schoolExternalToolFactory.buildWithId(
					{ schoolId: school1.id, id: schoolToolId1 },
					schoolToolId1
				);

				const schoolExternalToolMetadata: SchoolExternalToolMetadata = new SchoolExternalToolMetadata({
					contextExternalToolCountPerContext: { course: 3, boardElement: 3 },
				});

				schoolExternalToolRepo.findByExternalToolId.mockResolvedValue([schoolExternalTool, schoolExternalTool1]);
				contextExternalToolRepo.countBySchoolToolIdsAndContextType.mockResolvedValue(3);

				return {
					schoolToolId,
					schoolExternalToolMetadata,
				};
			};

			it('should return externalToolMetadata', async () => {
				const { schoolToolId, schoolExternalToolMetadata } = setup();

				const result: SchoolExternalToolMetadata = await service.getMetadata(schoolToolId);

				expect(result).toEqual(schoolExternalToolMetadata);
			});
		});

		describe('when no related context external tool was found', () => {
			const setup = () => {
				const school = legacySchoolDoFactory.buildWithId();
				const school1 = legacySchoolDoFactory.buildWithId();

				const schoolToolId: string = new ObjectId().toHexString();
				const schoolToolId1: string = new ObjectId().toHexString();

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolId: school.id,
					id: schoolToolId,
				});
				const schoolExternalTool1: SchoolExternalTool = schoolExternalToolFactory.buildWithId(
					{ schoolId: school1.id, id: schoolToolId1 },
					schoolToolId1
				);

				const schoolExternalToolMetadata: SchoolExternalToolMetadata = new SchoolExternalToolMetadata({
					contextExternalToolCountPerContext: { course: 0, boardElement: 0 },
				});

				schoolExternalToolRepo.findByExternalToolId.mockResolvedValue([schoolExternalTool, schoolExternalTool1]);
				contextExternalToolRepo.countBySchoolToolIdsAndContextType.mockResolvedValue(0);

				return {
					schoolToolId,
					schoolExternalToolMetadata,
				};
			};

			it('should return empty schoolExternalToolMetadata', async () => {
				const { schoolToolId, schoolExternalToolMetadata } = setup();

				const result: SchoolExternalToolMetadata = await service.getMetadata(schoolToolId);

				expect(result).toEqual(schoolExternalToolMetadata);
			});
		});
	});
});
