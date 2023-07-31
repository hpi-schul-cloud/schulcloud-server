import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalToolDO, SchoolExternalToolDO } from '@shared/domain';
import { externalToolFactory, schoolExternalToolDOFactory } from '@shared/testing/factory/domainobject/tool';
import { CommonToolValidationService } from '../../common/service';
import { ExternalToolService } from '../../external-tool/service';
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
			externalToolDoMock?: Partial<ExternalToolDO>,
			schoolExternalToolDoMock?: Partial<SchoolExternalToolDO>
		) => {
			const schoolExternalToolDO: SchoolExternalToolDO = schoolExternalToolDOFactory.build({
				...schoolExternalToolDOFactory.buildWithId(),
				...schoolExternalToolDoMock,
			});
			const externalToolDO: ExternalToolDO = new ExternalToolDO({
				...externalToolFactory.buildWithId(),
				...externalToolDoMock,
			});
			externalToolService.findExternalToolById.mockResolvedValue(externalToolDO);
			const schoolExternalToolId = schoolExternalToolDO.id as string;
			return {
				schoolExternalToolDO,
				externalToolDO,
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
