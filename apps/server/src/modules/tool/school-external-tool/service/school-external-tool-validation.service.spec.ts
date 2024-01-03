import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { externalToolFactory, schoolExternalToolFactory } from '@shared/testing/factory/domainobject/tool';
import { CommonToolValidationService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { SchoolExternalTool } from '../domain';
import { SchoolExternalToolValidationService } from './school-external-tool-validation.service';

describe('SchoolExternalToolValidationService', () => {
	let module: TestingModule;
	let service: SchoolExternalToolValidationService;

	let externalToolService: DeepMocked<ExternalToolService>;
	let commonToolValidationService: DeepMocked<CommonToolValidationService>;
	let toolFeatures: DeepMocked<IToolFeatures>;

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
				{
					provide: ToolFeatures,
					useValue: {
						toolStatusWithoutVersions: false,
					},
				},
			],
		}).compile();

		service = module.get(SchoolExternalToolValidationService);
		externalToolService = module.get(ExternalToolService);
		commonToolValidationService = module.get(CommonToolValidationService);
		toolFeatures = module.get(ToolFeatures);
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

			const schoolExternalToolId = schoolExternalTool.id as string;

			externalToolService.findById.mockResolvedValue(externalTool);
			toolFeatures.toolStatusWithoutVersions = true;

			return {
				schoolExternalTool,
				ExternalTool,
				schoolExternalToolId,
			};
		};

		describe('when schoolExternalTool is given', () => {
			it('should call externalToolService.findExternalToolById', async () => {
				const { schoolExternalTool } = setup();

				await service.validate(schoolExternalTool);

				expect(externalToolService.findById).toHaveBeenCalledWith(schoolExternalTool.toolId);
			});

			it('should call commonToolValidationService.checkCustomParameterEntries', async () => {
				const { schoolExternalTool } = setup();

				await service.validate(schoolExternalTool);

				expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(
					expect.anything(),
					schoolExternalTool
				);
			});

			it('should not throw error', async () => {
				const { schoolExternalTool } = setup({ version: 8383 }, { toolVersion: 1337 });

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).resolves.not.toThrow();
			});
		});
	});

	// TODO N21-1337 refactor after feature flag is removed
	describe('validate with FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED on false', () => {
		describe('when version of externalTool and schoolExternalTool are different', () => {
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

				const schoolExternalToolId = schoolExternalTool.id as string;

				externalToolService.findById.mockResolvedValue(externalTool);
				toolFeatures.toolStatusWithoutVersions = false;

				return {
					schoolExternalTool,
					ExternalTool,
					schoolExternalToolId,
				};
			};

			it('should throw error', async () => {
				const { schoolExternalTool } = setup({ version: 8383 }, { toolVersion: 1337 });

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).rejects.toThrowError('tool_version_mismatch:');
			});
		});
	});
});
