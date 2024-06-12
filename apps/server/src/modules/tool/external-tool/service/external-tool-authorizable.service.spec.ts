import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalToolRepo } from '@shared/repo';
import { externalToolFactory } from '../testing';
import { ExternalToolAuthorizableService } from './external-tool-authorizable.service';

describe(ExternalToolAuthorizableService.name, () => {
	let module: TestingModule;
	let service: ExternalToolAuthorizableService;

	let externalToolRepo: DeepMocked<ExternalToolRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ExternalToolAuthorizableService,
				{
					provide: ExternalToolRepo,
					useValue: createMock<ExternalToolRepo>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolAuthorizableService);
		externalToolRepo = module.get(ExternalToolRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
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
