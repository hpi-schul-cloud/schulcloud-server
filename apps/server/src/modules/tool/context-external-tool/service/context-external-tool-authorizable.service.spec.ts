import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalToolRepo } from '@shared/repo/contextexternaltool/context-external-tool.repo';
import { legacySchoolDoFactory } from '@shared/testing/factory/domainobject/legacy-school.factory';
import { contextExternalToolFactory } from '@shared/testing/factory/domainobject/tool/context-external-tool.factory';
import { schoolExternalToolFactory } from '@shared/testing/factory/domainobject/tool/school-external-tool.factory';
import { SchoolExternalTool } from '../../school-external-tool/domain/school-external-tool.do';
import { ContextExternalTool } from '../domain/context-external-tool.do';
import { ContextExternalToolAuthorizableService } from './context-external-tool-authorizable.service';

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
