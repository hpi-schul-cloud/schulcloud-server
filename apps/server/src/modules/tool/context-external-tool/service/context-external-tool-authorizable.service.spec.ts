import { contextExternalToolFactory, legacySchoolDoFactory, schoolExternalToolFactory } from '@shared/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ContextExternalToolRepo } from '@shared/repo';
import { ContextExternalToolAuthorizableService } from './context-external-tool-authorizable.service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ContextExternalTool } from '../domain';

describe('ContextExternalToolAuthorizableService', () => {
	let module: TestingModule;
	let service: ContextExternalToolAuthorizableService;

	let contextExternalToolRepo: DeepMocked<ContextExternalToolRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ContextExternalToolAuthorizableService,
				{
					provide: ContextExternalToolRepo,
					useValue: createMock<ContextExternalToolRepo>(),
				},
			],
		}).compile();

		service = module.get(ContextExternalToolAuthorizableService);
		contextExternalToolRepo = module.get(ContextExternalToolRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('findById', () => {
		describe('when id is given', () => {
			const setup = () => {
				const schoolId: string = legacySchoolDoFactory.buildWithId().id as string;
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					schoolId,
				});
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string, schoolExternalTool.schoolId)
					.build();

				contextExternalToolRepo.findById.mockResolvedValue(contextExternalTool);

				return {
					contextExternalTool,
					contextExternalToolId: contextExternalTool.id as string,
				};
			};

			it('should return a contextExternalTool', async () => {
				const { contextExternalTool, contextExternalToolId } = setup();

				const result: ContextExternalTool = await service.findById(contextExternalToolId);

				expect(result).toEqual(contextExternalTool);
			});
		});
	});
});
