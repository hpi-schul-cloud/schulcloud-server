import { contextExternalToolDOFactory, schoolDOFactory, schoolExternalToolDOFactory } from '@shared/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ContextExternalToolRepo } from '@shared/repo';
import { ContextExternalToolAuthorizableService } from './context-external-tool-authorizable.service';
import { SchoolExternalToolDO } from '../../school-external-tool/domain';
import { ContextExternalToolDO } from '../domain';

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
				const schoolId: string = schoolDOFactory.buildWithId().id as string;
				const schoolExternalToolDO: SchoolExternalToolDO = schoolExternalToolDOFactory.build({
					schoolId,
				});
				const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory
					.withSchoolExternalToolRef(schoolExternalToolDO.id as string, schoolExternalToolDO.schoolId)
					.build();

				contextExternalToolRepo.findById.mockResolvedValue(contextExternalTool);

				return {
					contextExternalTool,
					contextExternalToolId: contextExternalTool.id as string,
				};
			};

			it('should return a contextExternalTool', async () => {
				const { contextExternalTool, contextExternalToolId } = setup();

				const result: ContextExternalToolDO = await service.findById(contextExternalToolId);

				expect(result).toEqual(contextExternalTool);
			});
		});
	});
});
