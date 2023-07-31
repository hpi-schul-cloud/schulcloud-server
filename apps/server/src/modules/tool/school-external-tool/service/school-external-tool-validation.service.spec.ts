import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { externalToolFactory, schoolExternalToolFactory } from '@shared/testing/factory/domainobject/tool';
import { CommonToolValidationService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalTool } from '../domain';
import { SchoolExternalToolValidationService } from './school-external-tool-validation.service';

describe('SchoolExternalToolValidationService', () => {
	let module: TestingModule;
	let service: SchoolExternalToolValidationService;

	let externalToolService: DeepMocked<ExternalToolService>;
	let commonToolValidationService: DeepMocked<CommonToolValidationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolExternalToolValidationService,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: CommonToolValidationService,
					useValue: createMock<CommonToolValidationService>(),
				},
			],
		}).compile();

		service = module.get(SchoolExternalToolValidationService);
		externalToolService = module.get(ExternalToolService);
		commonToolValidationService = module.get(CommonToolValidationService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('validate', () => {
		const setup = (
			externalToolDoMock?: Partial<ExternalTool>,
			schoolExternalToolDoMock?: Partial<SchoolExternalTool>
		) => {
			const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
				...schoolExternalToolFactory.buildWithId(),
				...schoolExternalToolDoMock,
			});
			const externalTool: ExternalTool = new ExternalTool({
				...externalToolFactory.buildWithId(),
				...externalToolDoMock,
			});
			externalToolService.findExternalToolById.mockResolvedValue(externalTool);
			const schoolExternalToolId = schoolExternalTool.id as string;
			return {
				schoolExternalToolDO: schoolExternalTool,
				ExternalTool,
				schoolExternalToolId,
			};
		};

		describe('when schoolExternalTool is given', () => {
			it('should call externalToolService.findExternalToolById', async () => {
				const { schoolExternalToolDO } = setup();

				await service.validate(schoolExternalToolDO);

				expect(externalToolService.findExternalToolById).toHaveBeenCalledWith(schoolExternalToolDO.toolId);
			});

			it('should call commonToolValidationService.checkForDuplicateParameters', async () => {
				const { schoolExternalToolDO } = setup();

				await service.validate(schoolExternalToolDO);

				expect(commonToolValidationService.checkForDuplicateParameters).toHaveBeenCalledWith(schoolExternalToolDO);
			});

			it('should call commonToolValidationService.checkCustomParameterEntries', async () => {
				const { schoolExternalToolDO } = setup();

				await service.validate(schoolExternalToolDO);

				expect(commonToolValidationService.checkCustomParameterEntries).toHaveBeenCalledWith(
					expect.anything(),
					schoolExternalToolDO
				);
			});
		});

		describe('when version of externalTool and schoolExternalTool are different', () => {
			it('should throw error', async () => {
				const { schoolExternalToolDO } = setup({ version: 8383 }, { toolVersion: 1337 });

				const func = () => service.validate(schoolExternalToolDO);

				await expect(func()).rejects.toThrowError('tool_version_mismatch:');
			});
		});
	});
});
