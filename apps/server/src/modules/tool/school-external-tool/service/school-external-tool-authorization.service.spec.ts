import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolExternalToolRepo } from '@shared/repo';
import { legacySchoolDoFactory } from '@shared/testing';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { schoolExternalToolFactory } from '../../school-external-tool/testing';
import { SchoolExternalToolAuthorizableService } from './school-external-tool-authorizable.service';
import { AuthorizableReferenceType, AuthorizationInjectionService } from '@src/modules/authorization';

describe('SchoolExternalToolAuthorizableService', () => {
	let module: TestingModule;
	let service: SchoolExternalToolAuthorizableService;

	let schoolExternalToolRepo: DeepMocked<SchoolExternalToolRepo>;
	let injectionService: DeepMocked<AuthorizationInjectionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolExternalToolAuthorizableService,
				{
					provide: SchoolExternalToolRepo,
					useValue: createMock<SchoolExternalToolRepo>(),
				},
				{
					provide: AuthorizationInjectionService,
					useValue: createMock<AuthorizationInjectionService>(),
				},
			],
		}).compile();

		service = module.get(SchoolExternalToolAuthorizableService);
		schoolExternalToolRepo = module.get(SchoolExternalToolRepo);
		injectionService = module.get(AuthorizationInjectionService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('constructor', () => {
		it('should inject itself into the AuthorizationInjectionService', () => {
			expect(injectionService.injectReferenceLoader).toHaveBeenCalledWith(
				AuthorizableReferenceType.SchoolExternalToolEntity,
				service
			);
		});
	});

	describe('findById', () => {
		describe('when id is given', () => {
			const setup = () => {
				const schoolId: string = legacySchoolDoFactory.buildWithId().id as string;
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					schoolId,
				});

				schoolExternalToolRepo.findById.mockResolvedValue(schoolExternalTool);

				return {
					schoolExternalTool,
					schoolExternalToolId: schoolExternalTool.id,
				};
			};

			it('should return a contextExternalTool', async () => {
				const { schoolExternalTool, schoolExternalToolId } = setup();

				const result: SchoolExternalTool = await service.findById(schoolExternalToolId);

				expect(result).toEqual(schoolExternalTool);
			});
		});
	});
});
