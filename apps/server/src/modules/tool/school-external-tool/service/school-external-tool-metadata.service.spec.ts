import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalToolRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { SchoolExternalToolMetadata } from '../domain';
import { SchoolExternalToolMetadataService } from './school-external-tool-metadata.service';

describe('SchoolExternalToolMetadataService', () => {
	let module: TestingModule;
	let service: SchoolExternalToolMetadataService;

	let contextExternalToolRepo: DeepMocked<ContextExternalToolRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolExternalToolMetadataService,
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
				const schoolToolId: string = new ObjectId().toHexString();

				const schoolExternalToolMetadata: SchoolExternalToolMetadata = new SchoolExternalToolMetadata({
					contextExternalToolCountPerContext: { course: 3, boardElement: 3 },
				});

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
				const schoolToolId: string = new ObjectId().toHexString();

				const schoolExternalToolMetadata: SchoolExternalToolMetadata = new SchoolExternalToolMetadata({
					contextExternalToolCountPerContext: { course: 0, boardElement: 0 },
				});

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
