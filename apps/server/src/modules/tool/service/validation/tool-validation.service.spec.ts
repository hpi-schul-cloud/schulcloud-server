import { externalToolDOFactory } from '@shared/testing/factory/domainobject/external-tool.factory';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { UnprocessableEntityException } from '@nestjs/common';
import { ExternalToolService } from '../external-tool.service';
import { ToolValidationService } from './tool-validation.service';
import { CommonToolValidationService } from './common-tool-validation.service';

describe('ToolValidation', () => {
	let module: TestingModule;
	let service: ToolValidationService;

	let externalToolService: DeepMocked<ExternalToolService>;
	let commonToolValidationService: DeepMocked<CommonToolValidationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToolValidationService,
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

		service = module.get(ToolValidationService);
		externalToolService = module.get(ExternalToolService);
		commonToolValidationService = module.get(CommonToolValidationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('validateCreate is called', () => {
		it('should call the common validation service', async () => {
			const externalToolDO: ExternalToolDO = externalToolDOFactory.build();

			await service.validateCreate(externalToolDO);

			expect(commonToolValidationService.validateCommon).toHaveBeenCalledWith(externalToolDO);
		});

		describe('when external tool config has oauth config', () => {
			it('should not find a tool with this client id', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withOauth2Config().build();
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(null);

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should return when clientId is unique', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withOauth2Config().buildWithId();
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(externalToolDO);

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should find a tool with this client id', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory
					.withOauth2Config({ clientId: 'sameClientId' })
					.build();
				const existingExternalToolDO: ExternalToolDO = externalToolDOFactory
					.withOauth2Config({ clientId: 'sameClientId' })
					.buildWithId();
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(existingExternalToolDO);

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).rejects.toThrow(
					new UnprocessableEntityException(`The Client Id of the tool: ${externalToolDO.name} is already used`)
				);
			});
		});
	});

	describe('validateUpdate is called', () => {
		beforeEach(() => {
			externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(null);
		});

		it('should call the common validation service', async () => {
			const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();
			externalToolDO.id = 'toolId';

			await service.validateUpdate(externalToolDO.id, externalToolDO);

			expect(commonToolValidationService.validateCommon).toHaveBeenCalledWith(externalToolDO);
		});

		describe('when checking if parameter id matches toolId', () => {
			it('should throw an error if not matches', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();

				const func = () => service.validateUpdate('notMatchToolId', externalToolDO);

				await expect(func).rejects.toThrow(
					new UnprocessableEntityException(`The tool has no id or it does not match the path parameter.`)
				);
			});

			it('should return without error if matches', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();
				externalToolDO.id = 'toolId';

				const result: Promise<void> = service.validateUpdate(externalToolDO.id, externalToolDO);

				await expect(result).resolves.not.toThrow();
			});
		});

		describe('when external tool config has oauth config', () => {
			it('should throw if config type was changed', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();
				const existingExternalToolDO: ExternalToolDO = externalToolDOFactory
					.withOauth2Config({ clientId: 'clientId1' })
					.buildWithId();
				externalToolService.findExternalToolById.mockResolvedValue(existingExternalToolDO);

				const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

				await expect(result).rejects.toThrow(
					new UnprocessableEntityException(`The Config Type of the tool ${externalToolDO.name} is immutable.`)
				);
			});

			it('should pass if tool has the same clientId as before', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withOauth2Config().buildWithId();
				externalToolService.findExternalToolById.mockResolvedValue(externalToolDO);

				const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should throw if clientId was changed', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory
					.withOauth2Config({ clientId: 'clientId2' })
					.buildWithId();
				const existingExternalToolDO: ExternalToolDO = externalToolDOFactory
					.withOauth2Config({ clientId: 'clientId1' })
					.buildWithId();
				externalToolService.findExternalToolById.mockResolvedValue(existingExternalToolDO);

				const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

				await expect(result).rejects.toThrow(
					new UnprocessableEntityException(`The Client Id of the tool ${externalToolDO.name} is immutable.`)
				);
			});
		});
	});
});
