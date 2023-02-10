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

	const setup = () => {
		const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();
		const externalOauthToolDO: ExternalToolDO = externalToolDOFactory
			.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
			.buildWithId();
		const existingExternalOauthToolDO: ExternalToolDO = externalToolDOFactory
			.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
			.buildWithId();
		const existingExternalOauthToolDOWithDifferentClientId: ExternalToolDO = externalToolDOFactory
			.withOauth2Config({ clientId: 'DifferentClientId', clientSecret: 'secret' })
			.buildWithId();
		const externalOauthToolDOWithoutSecret: ExternalToolDO = externalToolDOFactory
			.withOauth2Config({ clientId: 'ClientId' })
			.buildWithId();
		return {
			externalToolDO,
			externalOauthToolDO,
			externalOauthToolDOWithoutSecret,
			existingExternalOauthToolDO,
			existingExternalOauthToolDOWithDifferentClientId,
		};
	};

	describe('validateCreate is called', () => {
		it('should call the common validation service', async () => {
			const { externalToolDO } = setup();
			externalToolService.isOauth2Config.mockReturnValue(false);

			await service.validateCreate(externalToolDO);

			expect(commonToolValidationService.validateCommon).toHaveBeenCalledWith(externalToolDO);
		});

		describe('when external tool config has oauth config', () => {
			it('should not find a tool with this unique client id', async () => {
				const { externalOauthToolDO } = setup();
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(null);

				const result: Promise<void> = service.validateCreate(externalOauthToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should return when clientId is unique', async () => {
				const { externalOauthToolDO } = setup();
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(externalOauthToolDO);

				const result: Promise<void> = service.validateCreate(externalOauthToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should find a tool with this duplicate client id', async () => {
				const { externalOauthToolDO } = setup();
				const { existingExternalOauthToolDO } = setup();
				externalToolService.isOauth2Config.mockReturnValue(true);
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(existingExternalOauthToolDO);

				const result: Promise<void> = service.validateCreate(externalOauthToolDO);

				await expect(result).rejects.toThrow(
					new ValidationError(`The Client Id of the tool ${externalOauthToolDO.name} is already used.`)
				);
			});
		});

		describe('when there is no client secret', () => {
			it('should throw validation error', async () => {
				const { externalOauthToolDOWithoutSecret } = setup();
				externalToolService.isOauth2Config.mockReturnValue(true);

				const result: Promise<void> = service.validateCreate(externalOauthToolDOWithoutSecret);

				await expect(result).rejects.toThrow(
					new ValidationError(`The Client Secret of the tool ${externalOauthToolDOWithoutSecret.name} is missing.`)
				);
			});
		});
	});

	describe('validateUpdate is called', () => {
		beforeEach(() => {
			externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(null);
		});

		it('should call the common validation service', async () => {
			const { externalToolDO } = setup();
			externalToolDO.id = 'toolId';
			externalToolService.isOauth2Config.mockReturnValue(false);

			await service.validateUpdate(externalToolDO.id, externalToolDO);

			expect(commonToolValidationService.validateCommon).toHaveBeenCalledWith(externalToolDO);
		});

		describe('when checking if parameter id matches toolId', () => {
			it('should throw an error if not matches', async () => {
				const { externalToolDO } = setup();
				externalToolService.isOauth2Config.mockReturnValue(true);

				const func = () => service.validateUpdate('notMatchToolId', externalToolDO);

				await expect(func).rejects.toThrow(
					new ValidationError(`The tool has no id or it does not match the path parameter.`)
				);
			});

			it('should return without error if matches', async () => {
				const { externalOauthToolDO } = setup();
				externalOauthToolDO.id = 'toolId';
				externalToolService.isOauth2Config.mockReturnValue(true);
				externalToolService.findExternalToolById.mockResolvedValue(externalOauthToolDO);

				const result: Promise<void> = service.validateUpdate(externalOauthToolDO.id, externalOauthToolDO);

				await expect(result).resolves.not.toThrow();
			});
		});

		describe('when external tool config has oauth config', () => {
			it('should throw if config type was changed', async () => {
				const { externalToolDO } = setup();
				const { existingExternalOauthToolDO } = setup();
				externalToolService.findExternalToolById.mockResolvedValue(existingExternalOauthToolDO);
				externalToolService.isOauth2Config.mockReturnValue(true);

				const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

				await expect(result).rejects.toThrow(
					new ValidationError(`The Config Type of the tool ${externalToolDO.name} is immutable.`)
				);
			});

			it('should pass if tool has the same clientId as before', async () => {
				const { externalOauthToolDO } = setup();
				externalToolService.findExternalToolById.mockResolvedValue(externalOauthToolDO);
				externalToolService.isOauth2Config.mockReturnValue(true);

				const result: Promise<void> = service.validateUpdate(externalOauthToolDO.id as string, externalOauthToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should throw if clientId was changed', async () => {
				const { externalOauthToolDO } = setup();
				const { existingExternalOauthToolDOWithDifferentClientId } = setup();
				externalToolService.findExternalToolById.mockResolvedValue(existingExternalOauthToolDOWithDifferentClientId);
				externalToolService.isOauth2Config.mockReturnValue(true);

				const result: Promise<void> = service.validateUpdate(externalOauthToolDO.id as string, externalOauthToolDO);

				await expect(result).rejects.toThrow(
					new ValidationError(`The Client Id of the tool ${externalOauthToolDO.name} is immutable.`)
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
