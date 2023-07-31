import { externalToolDOFactory } from '@shared/testing/factory/domainobject/tool/external-tool.factory';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ValidationError } from '@shared/common';
import { ExternalToolService } from './external-tool.service';
import { ExternalToolValidationService } from './external-tool-validation.service';
import { ExternalToolParameterValidationService } from './external-tool-parameter-validation.service';
import { ExternalTool } from '../domain';

describe('ExternalToolValidationService', () => {
	let module: TestingModule;
	let service: ExternalToolValidationService;

	let externalToolService: DeepMocked<ExternalToolService>;
	let commonToolValidationService: DeepMocked<ExternalToolParameterValidationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ExternalToolValidationService,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: ExternalToolParameterValidationService,
					useValue: createMock<ExternalToolParameterValidationService>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolValidationService);
		externalToolService = module.get(ExternalToolService);
		commonToolValidationService = module.get(ExternalToolParameterValidationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	const externalToolDO: ExternalTool = externalToolDOFactory.buildWithId();

	describe('validateCreate is called', () => {
		it('should call the common validation service', async () => {
			await service.validateCreate(externalToolDO);

			expect(commonToolValidationService.validateCommon).toHaveBeenCalledWith(externalToolDO);
		});

		describe('when external tool config has oauth config', () => {
			describe('when client id is unique', () => {
				describe('when tool with oauth2 config not exists', () => {
					const setup = () => {
						const externalOauthToolDO: ExternalTool = externalToolDOFactory
							.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
							.buildWithId();
						externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(null);

						return { externalOauthToolDO };
					};

					it('should not find a tool with this client id', async () => {
						const { externalOauthToolDO } = setup();

						const result: Promise<void> = service.validateCreate(externalOauthToolDO);

						await expect(result).resolves.not.toThrow();
					});
				});

				describe('when tool with oauth2 config exists', () => {
					const setup = () => {
						const externalOauthToolDO: ExternalTool = externalToolDOFactory
							.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
							.buildWithId();
						externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(externalOauthToolDO);

						return { externalOauthToolDO };
					};

					it('should return without error', async () => {
						const { externalOauthToolDO } = setup();

						const result: Promise<void> = service.validateCreate(externalOauthToolDO);

						await expect(result).resolves.not.toThrow();
					});
				});
			});

			describe('when client id already exists', () => {
				const setup = () => {
					const externalOauthToolDO: ExternalTool = externalToolDOFactory
						.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
						.buildWithId();
					const existingExternalOauthToolDO: ExternalTool = externalToolDOFactory
						.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
						.buildWithId();

					externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(existingExternalOauthToolDO);

					return {
						externalOauthToolDO,
					};
				};

				it('should find a tool with this client id', async () => {
					const { externalOauthToolDO } = setup();

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
					const externalOauthToolDOWithoutSecret: ExternalTool = externalToolDOFactory
						.withOauth2Config({ clientId: 'ClientId' })
						.buildWithId();
					return { externalOauthToolDOWithoutSecret };
				};

				it('should throw validation error', async () => {
					const { externalOauthToolDOWithoutSecret } = setup();

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
					const externalLti11ToolDOWithoutSecret: ExternalTool = externalToolDOFactory
						.withLti11Config({ key: 'lti11Key', secret: undefined })
						.buildWithId();
					return { externalLti11ToolDOWithoutSecret };
				};

				it('should throw validation error', async () => {
					const { externalLti11ToolDOWithoutSecret } = setup();

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

			await service.validateUpdate(externalToolDO.id, externalToolDO);

			expect(commonToolValidationService.validateCommon).toHaveBeenCalledWith(externalToolDO);
		});

		describe('when checking if parameter id matches toolId', () => {
			const setup = () => {
				const externalOauthToolDO: ExternalTool = externalToolDOFactory
					.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
					.buildWithId();

				externalOauthToolDO.id = 'toolId';
				externalToolService.findExternalToolById.mockResolvedValue(externalOauthToolDO);

				return {
					externalOauthToolDO,
					externalOauthToolId: externalOauthToolDO.id,
				};
			};

			it('should throw an error if not matches', async () => {
				const func = () => service.validateUpdate('notMatchToolId', externalToolDO);

				await expect(func).rejects.toThrow(
					new ValidationError(`tool_id_mismatch: The tool has no id or it does not match the path parameter.`)
				);
			});

			it('should return without error if matches', async () => {
				const { externalOauthToolDO, externalOauthToolId } = setup();

				const result: Promise<void> = service.validateUpdate(externalOauthToolId, externalOauthToolDO);

				await expect(result).resolves.not.toThrow();
			});
		});

		describe('when external tool config has oauth config', () => {
			describe('when config type was changed', () => {
				const setup = () => {
					const existingExternalOauthToolDO: ExternalTool = externalToolDOFactory
						.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
						.buildWithId();

					externalToolService.findExternalToolById.mockResolvedValue(existingExternalOauthToolDO);
				};

				it('should throw', async () => {
					setup();

					const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

					await expect(result).rejects.toThrow(
						new ValidationError(`tool_type_immutable: The Config Type of the tool ${externalToolDO.name} is immutable.`)
					);
				});
			});

			describe('when clientId is the same', () => {
				const setup = () => {
					const externalOauthToolDO: ExternalTool = externalToolDOFactory
						.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
						.buildWithId();

					externalToolService.findExternalToolById.mockResolvedValue(externalOauthToolDO);

					return { externalOauthToolDO };
				};

				it('should pass', async () => {
					const { externalOauthToolDO } = setup();

					const result: Promise<void> = service.validateUpdate(externalOauthToolDO.id as string, externalOauthToolDO);

					await expect(result).resolves.not.toThrow();
				});
			});

			describe('when clientID was changed', () => {
				const setup = () => {
					const externalOauthToolDO: ExternalTool = externalToolDOFactory
						.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
						.buildWithId();
					const existingExternalOauthToolDOWithDifferentClientId: ExternalTool = externalToolDOFactory
						.withOauth2Config({ clientId: 'DifferentClientId', clientSecret: 'secret' })
						.buildWithId();
					externalToolService.findExternalToolById.mockResolvedValue(existingExternalOauthToolDOWithDifferentClientId);

					return {
						externalOauthToolDO,
					};
				};

				it('should throw', async () => {
					const { externalOauthToolDO } = setup();

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
			const setup = () => {
				const externalLtiToolDO: ExternalTool = externalToolDOFactory.withLti11Config().buildWithId();
				externalLtiToolDO.id = 'toolId';

				externalToolService.findExternalToolById.mockResolvedValue(externalLtiToolDO);

				return {
					externalLtiToolDO,
					externalLtiToolId: externalLtiToolDO.id,
				};
			};

			it('should validate and returns without throwing an exception', async () => {
				const { externalLtiToolDO, externalLtiToolId } = setup();

				const result: Promise<void> = service.validateUpdate(externalLtiToolId, externalLtiToolDO);

				await expect(result).resolves.not.toThrow();
			});
		});
	});
});
