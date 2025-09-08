import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolExternalToolService } from '../service';
import { schoolExternalToolFactory } from '../testing';
import { AdminApiSchoolExternalToolUc } from './admin-api-school-external-tool.uc';

describe(AdminApiSchoolExternalToolUc.name, () => {
	let module: TestingModule;
	let uc: AdminApiSchoolExternalToolUc;

	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AdminApiSchoolExternalToolUc,
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
			],
		}).compile();

		uc = module.get(AdminApiSchoolExternalToolUc);
		schoolExternalToolService = module.get(SchoolExternalToolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('createExternalTool', () => {
		describe('when creating a tool', () => {
			const setup = () => {
				const schoolExternalTool = schoolExternalToolFactory.build();

				schoolExternalToolService.saveSchoolExternalTool.mockResolvedValueOnce(schoolExternalTool);

				return {
					schoolExternalTool,
				};
			};

			it('should save the tool', async () => {
				const { schoolExternalTool } = setup();

				await uc.createSchoolExternalTool(schoolExternalTool.getProps());

				expect(schoolExternalToolService.saveSchoolExternalTool).toHaveBeenCalledWith(schoolExternalTool);
			});

			it('should return the tool', async () => {
				const { schoolExternalTool } = setup();

				const result = await uc.createSchoolExternalTool(schoolExternalTool.getProps());

				expect(result).toEqual(schoolExternalTool);
			});
		});
	});
});
