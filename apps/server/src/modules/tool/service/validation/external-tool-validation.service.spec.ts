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

	const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();

	describe('validateCreate is called', () => {
		it('should call the common validation service', async () => {
			externalToolService.isOauth2Config.mockReturnValue(false);
			externalToolService.isLti11Config.mockReturnValue(false);

			await service.validateCreate(externalToolDO);

			expect(commonToolValidationService.validateCommon).toHaveBeenCalledWith(externalToolDO);
		});

		describe('when external tool config has oauth config', () => {
			describe('when client id is unique', () => {
				const setup = () => {
					const externalOauthToolDO: ExternalToolDO = externalToolDOFactory
						.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
						.buildWithId();
					return { externalOauthToolDO };
				};

				it('should not find a tool with this client id', async () => {
					const { externalOauthToolDO } = setup();
					externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(null);
					externalToolService.isLti11Config.mockReturnValue(false);

					const result: Promise<void> = service.validateCreate(externalOauthToolDO);

					await expect(result).resolves.not.toThrow();
				});

				it('should return without error', async () => {
					const { externalOauthToolDO } = setup();
					externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(externalOauthToolDO);
					externalToolService.isLti11Config.mockReturnValue(false);

					const result: Promise<void> = service.validateCreate(externalOauthToolDO);

					await expect(result).resolves.not.toThrow();
				});
			});

			describe('when client id already exists', () => {
				const setup = () => {
					const externalOauthToolDO: ExternalToolDO = externalToolDOFactory
						.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
						.buildWithId();
					const existingExternalOauthToolDO: ExternalToolDO = externalToolDOFactory
						.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
						.buildWithId();
					return {
						externalOauthToolDO,
						existingExternalOauthToolDO,
					};
				};

				it('should find a tool with this client id', async () => {
					const { externalOauthToolDO } = setup();
					const { existingExternalOauthToolDO } = setup();
					externalToolService.isOauth2Config.mockReturnValue(true);
					externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(existingExternalOauthToolDO);

					const result: Promise<void> = service.validateCreate(externalOauthToolDO);

					await expect(result).rejects.toThrow(
						new ValidationError(
							`tool_clientId_duplicate: The Client Id of the tool ${externalOauthToolDO.name} is already used.`
						)
					);
				});
			});

			describe('when there is no client secret', () => {
				const setup = () => {
					const externalOauthToolDOWithoutSecret: ExternalToolDO = externalToolDOFactory
						.withOauth2Config({ clientId: 'ClientId' })
						.buildWithId();
					return { externalOauthToolDOWithoutSecret };
				};

				it('should throw validation error', async () => {
					const { externalOauthToolDOWithoutSecret } = setup();
					externalToolService.isOauth2Config.mockReturnValue(true);

					const result: Promise<void> = service.validateCreate(externalOauthToolDOWithoutSecret);

					await expect(result).rejects.toThrow(
						new ValidationError(
							`tool_clientSecret_missing: The Client Secret of the tool ${externalOauthToolDOWithoutSecret.name} is missing.`
						)
					);
				});
			});
		});

		describe('when external tool config is lti11Config', () => {
			describe('when there is no secret', () => {
				const setup = () => {
					const externalLti11ToolDOWithoutSecret: ExternalToolDO = externalToolDOFactory
						.withLti11Config({ key: 'lti11Key', secret: undefined })
						.buildWithId();
					return { externalLti11ToolDOWithoutSecret };
				};

				it('should throw validation error', async () => {
					const { externalLti11ToolDOWithoutSecret } = setup();
					externalToolService.isLti11Config.mockReturnValue(true);
					externalToolService.isOauth2Config.mockReturnValue(false);

					const result: Promise<void> = service.validateCreate(externalLti11ToolDOWithoutSecret);

					await expect(result).rejects.toThrow(
						new ValidationError(
							`tool_secret_missing: The secret of the LTI tool ${
								externalLti11ToolDOWithoutSecret.name || ''
							} is missing.`
						)
					);
				});
			});
		});
	});

	describe('validateUpdate is called', () => {
		beforeEach(() => {
			externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(null);
		});

		it('should call the common validation service', async () => {
			externalToolDO.id = 'toolId';
			externalToolService.isOauth2Config.mockReturnValue(false);

			await service.validateUpdate(externalToolDO.id, externalToolDO);

			expect(commonToolValidationService.validateCommon).toHaveBeenCalledWith(externalToolDO);
		});

		describe('when checking if parameter id matches toolId', () => {
			const setup = () => {
				const externalOauthToolDO: ExternalToolDO = externalToolDOFactory
					.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
					.buildWithId();
				return { externalOauthToolDO };
			};

			it('should throw an error if not matches', async () => {
				externalToolService.isOauth2Config.mockReturnValue(true);

				const func = () => service.validateUpdate('notMatchToolId', externalToolDO);

				await expect(func).rejects.toThrow(
					new ValidationError(`tool_id_mismatch: The tool has no id or it does not match the path parameter.`)
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
			describe('when config type was changed', () => {
				const setup = () => {
					const existingExternalOauthToolDO: ExternalToolDO = externalToolDOFactory
						.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
						.buildWithId();
					return { existingExternalOauthToolDO };
				};

				it('should throw', async () => {
					const { existingExternalOauthToolDO } = setup();
					externalToolService.findExternalToolById.mockResolvedValue(existingExternalOauthToolDO);
					externalToolService.isOauth2Config.mockReturnValue(true);

					const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

					await expect(result).rejects.toThrow(
						new ValidationError(`tool_type_immutable: The Config Type of the tool ${externalToolDO.name} is immutable.`)
					);
				});
			});

			describe('when clientId is the same', () => {
				const setup = () => {
					const externalOauthToolDO: ExternalToolDO = externalToolDOFactory
						.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
						.buildWithId();
					return { externalOauthToolDO };
				};

				it('should pass', async () => {
					const { externalOauthToolDO } = setup();
					externalToolService.findExternalToolById.mockResolvedValue(externalOauthToolDO);
					externalToolService.isOauth2Config.mockReturnValue(true);

					const result: Promise<void> = service.validateUpdate(externalOauthToolDO.id as string, externalOauthToolDO);

					await expect(result).resolves.not.toThrow();
				});
			});

			describe('when clientID was changed', () => {
				const setup = () => {
					const externalOauthToolDO: ExternalToolDO = externalToolDOFactory
						.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
						.buildWithId();
					const existingExternalOauthToolDOWithDifferentClientId: ExternalToolDO = externalToolDOFactory
						.withOauth2Config({ clientId: 'DifferentClientId', clientSecret: 'secret' })
						.buildWithId();
					return {
						externalOauthToolDO,
						existingExternalOauthToolDOWithDifferentClientId,
					};
				};

				it('should throw', async () => {
					const { externalOauthToolDO } = setup();
					const { existingExternalOauthToolDOWithDifferentClientId } = setup();
					externalToolService.findExternalToolById.mockResolvedValue(existingExternalOauthToolDOWithDifferentClientId);
					externalToolService.isOauth2Config.mockReturnValue(true);

					const result: Promise<void> = service.validateUpdate(externalOauthToolDO.id as string, externalOauthToolDO);

					await expect(result).rejects.toThrow(
						new ValidationError(
							`tool_clientId_immutable: The Client Id of the tool ${externalOauthToolDO.name} is immutable.`
						)
					);
				});
			});
		});

		describe('when external tool has another config type then oauth', () => {
			it('should validate and returns without throwing an exception', async () => {
				const externalLtiToolDO: ExternalToolDO = externalToolDOFactory.withLti11Config().buildWithId();
				externalLtiToolDO.id = 'toolId';
				externalToolService.isOauth2Config.mockReturnValue(false);

				const result: Promise<void> = service.validateUpdate(externalLtiToolDO.id, externalLtiToolDO);

				await expect(result).resolves.not.toThrow();
			});
		});
	});
});
