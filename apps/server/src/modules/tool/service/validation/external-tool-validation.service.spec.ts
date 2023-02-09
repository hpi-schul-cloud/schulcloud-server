import { externalToolDOFactory } from '@shared/testing/factory/domainobject/external-tool.factory';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { ValidationError } from '@shared/common';
import { ExternalToolService } from '../external-tool.service';
import { ExternalToolValidationService } from './external-tool-validation.service';
import { CommonToolValidationService } from './common-tool-validation.service';

describe('ExternalToolValidation', () => {
	let module: TestingModule;
	let service: ExternalToolValidationService;

	let externalToolService: DeepMocked<ExternalToolService>;
	let commonToolValidationService: DeepMocked<CommonToolValidationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ExternalToolValidationService,
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

		service = module.get(ExternalToolValidationService);
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
			externalToolService.isOauth2Config.mockReturnValue(false);

			await service.validateCreate(externalToolDO);

			expect(commonToolValidationService.validateCommon).toHaveBeenCalledWith(externalToolDO);
		});

		describe('when external tool config has oauth config', () => {
			it('should not find a tool with this unique client id', async () => {
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

			it('should find a tool with this duplicate client id', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory
					.withOauth2Config({ clientId: 'sameClientId', clientSecret: 'someSecret' })
					.build();
				const existingExternalToolDO: ExternalToolDO = externalToolDOFactory
					.withOauth2Config({ clientId: 'sameClientId' })
					.buildWithId();
				externalToolService.isOauth2Config.mockReturnValue(true);
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(existingExternalToolDO);

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).rejects.toThrow(
					new ValidationError(`The Client Id of the tool ${externalToolDO.name} is already used.`)
				);
			});
		});

		describe('when there is no client secret', () => {
			it('should throw validation error', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory
					.withOauth2Config({ clientId: 'sameClientId' })
					.build();
				externalToolService.isOauth2Config.mockReturnValue(true);

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).rejects.toThrow(
					new ValidationError(`The Client Secret of the tool ${externalToolDO.name} is missing.`)
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
			externalToolService.isOauth2Config.mockReturnValue(false);

			await service.validateUpdate(externalToolDO.id, externalToolDO);

			expect(commonToolValidationService.validateCommon).toHaveBeenCalledWith(externalToolDO);
		});

		describe('when checking if parameter id matches toolId', () => {
			it('should throw an error if not matches', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();
				externalToolService.isOauth2Config.mockReturnValue(true);

				const func = () => service.validateUpdate('notMatchToolId', externalToolDO);

				await expect(func).rejects.toThrow(
					new ValidationError(`The tool has no id or it does not match the path parameter.`)
				);
			});

			it('should return without error if matches', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withOauth2Config().buildWithId();
				externalToolDO.id = 'toolId';
				externalToolService.isOauth2Config.mockReturnValue(true);
				externalToolService.findExternalToolById.mockResolvedValue(externalToolDO);

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
				externalToolService.isOauth2Config.mockReturnValue(true);

				const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

				await expect(result).rejects.toThrow(
					new ValidationError(`The Config Type of the tool ${externalToolDO.name} is immutable.`)
				);
			});

			it('should pass if tool has the same clientId as before', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withOauth2Config().buildWithId();
				externalToolService.findExternalToolById.mockResolvedValue(externalToolDO);
				externalToolService.isOauth2Config.mockReturnValue(true);

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
				externalToolService.isOauth2Config.mockReturnValue(true);

				const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

				await expect(result).rejects.toThrow(
					new ValidationError(`The Client Id of the tool ${externalToolDO.name} is immutable.`)
				);
			});
		});

		describe('when external tool has another config type then oauth', () => {
			it('should validate and returns without throwing an exception', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withLti11Config().buildWithId();
				externalToolDO.id = 'toolId';
				externalToolService.isOauth2Config.mockReturnValue(false);

				const result: Promise<void> = service.validateUpdate(externalToolDO.id, externalToolDO);

				await expect(result).resolves.not.toThrow();
			});
		});
	});
});
