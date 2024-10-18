import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizableReferenceType, AuthorizationInjectionService } from '@modules/authorization';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalToolRepo } from '@shared/repo';
import { legacySchoolDoFactory } from '@shared/testing';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { schoolExternalToolFactory } from '../../school-external-tool/testing';
import { ContextExternalTool } from '../domain';
import { contextExternalToolFactory } from '../testing';
import { ContextExternalToolAuthorizableService } from './context-external-tool-authorizable.service';

describe('ContextExternalToolAuthorizableService', () => {
	let module: TestingModule;
	let service: ContextExternalToolAuthorizableService;

	let contextExternalToolRepo: DeepMocked<ContextExternalToolRepo>;
	let injectionService: DeepMocked<AuthorizationInjectionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ContextExternalToolAuthorizableService,
				{
					provide: ContextExternalToolRepo,
					useValue: createMock<ContextExternalToolRepo>(),
				},
				AuthorizationInjectionService,
			],
		}).compile();

		service = module.get(ContextExternalToolAuthorizableService);
		contextExternalToolRepo = module.get(ContextExternalToolRepo);
		injectionService = module.get(AuthorizationInjectionService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('constructor', () => {
		it('should inject itself into the AuthorizationInjectionService', () => {
			expect(injectionService.getReferenceLoader(AuthorizableReferenceType.ContextExternalToolEntity)).toBe(service);
		});
	});

	describe('findById', () => {
		describe('when id is given', () => {
			const setup = () => {
				const schoolId: string = legacySchoolDoFactory.buildWithId().id as string;
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					schoolId,
				});
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id, schoolExternalTool.schoolId)
					.build();

				contextExternalToolRepo.findById.mockResolvedValue(contextExternalTool);

				return {
					contextExternalTool,
					contextExternalToolId: contextExternalTool.id,
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
