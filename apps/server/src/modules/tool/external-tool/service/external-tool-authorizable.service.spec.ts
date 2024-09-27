import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalToolRepo } from '@shared/repo';
import { externalToolFactory } from '../testing';
import { ExternalToolAuthorizableService } from './external-tool-authorizable.service';
import { AuthorizableReferenceType, AuthorizationInjectionService } from '@src/modules/authorization';

describe(ExternalToolAuthorizableService.name, () => {
	let module: TestingModule;
	let service: ExternalToolAuthorizableService;

	let externalToolRepo: DeepMocked<ExternalToolRepo>;
	let authorizationInjectionService: DeepMocked<AuthorizationInjectionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ExternalToolAuthorizableService,
				{
					provide: ExternalToolRepo,
					useValue: createMock<ExternalToolRepo>(),
				},
				{
					provide: AuthorizationInjectionService,
					useValue: createMock<AuthorizationInjectionService>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolAuthorizableService);
		externalToolRepo = module.get(ExternalToolRepo);
		authorizationInjectionService = module.get(AuthorizationInjectionService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('constructor', () => {
		it('should inject itself into the AuthorizationInjectionService', () => {
			expect(authorizationInjectionService.injectReferenceLoader).toHaveBeenCalledWith(
				AuthorizableReferenceType.ExternalTool,
				service
			);
		});
	});

	describe('findById', () => {
		describe('when there is an external tool', () => {
			const setup = () => {
				const externalTool = externalToolFactory.build();

				externalToolRepo.findById.mockResolvedValueOnce(externalTool);

				return {
					externalTool,
				};
			};

			it('should return the external tool', async () => {
				const { externalTool } = setup();

				const result = await service.findById(externalTool.id);

				expect(result).toEqual(externalTool);
			});
		});
	});
});
