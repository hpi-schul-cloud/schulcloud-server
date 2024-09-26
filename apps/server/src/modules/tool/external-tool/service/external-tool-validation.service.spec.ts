import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common';
import { Page } from '@shared/domain/domainobject';
import { ToolConfig } from '../../tool-config';
import { ExternalTool } from '../domain';
import { externalToolFactory } from '../testing';
import { ExternalToolLogoService } from './external-tool-logo.service';
import { ExternalToolParameterValidationService } from './external-tool-parameter-validation.service';
import { ExternalToolValidationService } from './external-tool-validation.service';
import { ExternalToolService } from './external-tool.service';

describe(ExternalToolValidationService.name, () => {
	let module: TestingModule;
	let service: ExternalToolValidationService;

	let externalToolService: DeepMocked<ExternalToolService>;
	let commonToolValidationService: DeepMocked<ExternalToolParameterValidationService>;
	let configService: DeepMocked<ConfigService<ToolConfig, true>>;
	let logoService: DeepMocked<ExternalToolLogoService>;

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
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<ToolConfig, true>>(),
				},
				{
					provide: ExternalToolLogoService,
					useValue: createMock<ExternalToolLogoService>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolValidationService);
		externalToolService = module.get(ExternalToolService);
		commonToolValidationService = module.get(ExternalToolParameterValidationService);
		configService = module.get(ConfigService);
		logoService = module.get(ExternalToolLogoService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('validateCreate', () => {
		describe('when external tool is given', () => {
			it('should call the common validation service', async () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				await service.validateCreate(externalTool);

				expect(commonToolValidationService.validateCommon).toHaveBeenCalledWith(externalTool);
			});
		});

		describe('when external tool config has oauth config', () => {
			describe('when client id is unique', () => {
				describe('when tool with oauth2 config not exists', () => {
					const setup = () => {
						const externalOauthTool: ExternalTool = externalToolFactory
							.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
							.buildWithId();
						externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(null);

						return { externalOauthTool };
					};

					it('should not find a tool with this client id', async () => {
						const { externalOauthTool } = setup();

						const result: Promise<void> = service.validateCreate(externalOauthTool);

						await expect(result).resolves.not.toThrow();
					});
				});

				describe('when tool with oauth2 config exists', () => {
					const setup = () => {
						const externalOauthTool: ExternalTool = externalToolFactory
							.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
							.buildWithId();
						externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(externalOauthTool);

						return { externalOauthTool };
					};

					it('should return without error', async () => {
						const { externalOauthTool } = setup();

						const result: Promise<void> = service.validateCreate(externalOauthTool);

						await expect(result).resolves.not.toThrow();
					});
				});
			});

			describe('when client id already exists', () => {
				const setup = () => {
					const externalOauthTool: ExternalTool = externalToolFactory
						.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
						.buildWithId();
					const existingExternalOauthToolDO: ExternalTool = externalToolFactory
						.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
						.buildWithId();

					externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(existingExternalOauthToolDO);

					return {
						externalOauthTool,
					};
				};

				it('should find a tool with this client id', async () => {
					const { externalOauthTool } = setup();

					const result: Promise<void> = service.validateCreate(externalOauthTool);

					await expect(result).rejects.toThrow(
						new ValidationError(
							`tool_clientId_duplicate: The Client Id of the tool ${externalOauthTool.name} is already used.`
						)
					);
				});
			});

			describe('when there is no client secret', () => {
				const setup = () => {
					const externalOauthToolDOWithoutSecret: ExternalTool = externalToolFactory
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
					const externalLti11ToolDOWithoutSecret: ExternalTool = externalToolFactory
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

		describe('when external tool has a given base64 logo', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.withBase64Logo().build();
				configService.get.mockReturnValue(30000);

				return { externalTool };
			};

			it('should call externalToolLogoService', async () => {
				const { externalTool } = setup();

				await service.validateCreate(externalTool);

				expect(logoService.validateLogoSize).toHaveBeenCalledWith(externalTool);
			});
		});

		describe('when the external tool is set to be a preferred tool', () => {
			describe('when the preferred tool has an icon name', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory.build({
						isPreferred: true,
						iconName: 'mdiAlert',
					});

					configService.get.mockReturnValue(10);

					return {
						externalTool,
					};
				};

				it('should not throw an validation error', async () => {
					const { externalTool } = setup();

					const result: Promise<void> = service.validateCreate(externalTool);

					await expect(result).resolves.not.toThrow();
				});
			});

			describe('when the preferred tool has undefined icon name', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory.build({
						isPreferred: true,
						iconName: undefined,
					});

					const mockedPreferredToolsPage: Page<ExternalTool> = new Page<ExternalTool>([], 0);

					externalToolService.findExternalTools.mockResolvedValue(mockedPreferredToolsPage);
					configService.get.mockReturnValue(10);

					const expectedError = new ValidationError(
						`tool_preferred_tools_missing_icon_name: The icon name of the preferred tool ${externalTool.name} is missing.`
					);

					return {
						externalTool,
						expectedError,
					};
				};

				it('should throw an validation error', async () => {
					const { externalTool, expectedError } = setup();

					const result: Promise<void> = service.validateCreate(externalTool);

					await expect(result).rejects.toThrow(expectedError);
				});
			});

			describe('when the preferred tool has a blank icon name', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory.build({
						isPreferred: true,
						iconName: '',
					});

					const mockedPreferredToolsPage: Page<ExternalTool> = new Page<ExternalTool>([], 0);

					externalToolService.findExternalTools.mockResolvedValue(mockedPreferredToolsPage);
					configService.get.mockReturnValue(10);

					const expectedError = new ValidationError(
						`tool_preferred_tools_missing_icon_name: The icon name of the preferred tool ${externalTool.name} is missing.`
					);

					return {
						externalTool,
						expectedError,
					};
				};

				it('should throw an validation error', async () => {
					const { externalTool, expectedError } = setup();

					const result: Promise<void> = service.validateCreate(externalTool);

					await expect(result).rejects.toThrow(expectedError);
				});
			});

			describe('when the preferred tool limits had already been reached', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory.build({
						isPreferred: true,
						iconName: '',
					});

					const mockedPreferredToolsPage: Page<ExternalTool> = new Page<ExternalTool>(
						externalToolFactory.buildList(3),
						3
					);

					externalToolService.findExternalTools.mockResolvedValue(mockedPreferredToolsPage);
					configService.get.mockReturnValue(3);

					const expectedError = new ValidationError(
						`tool_preferred_tools_limit_reached: Unable to add a new preferred tool, the total limit had been reached.`
					);

					return {
						externalTool,
						expectedError,
					};
				};

				it('should throw an validation error', async () => {
					const { externalTool, expectedError } = setup();

					const result: Promise<void> = service.validateCreate(externalTool);

					await expect(result).rejects.toThrow(expectedError);
				});
			});

			describe('when the preferred tool limits had already been exceeded', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory.build({
						isPreferred: true,
						iconName: '',
					});

					const mockedPreferredToolsPage: Page<ExternalTool> = new Page<ExternalTool>(
						externalToolFactory.buildList(5),
						3
					);

					externalToolService.findExternalTools.mockResolvedValue(mockedPreferredToolsPage);
					configService.get.mockReturnValue(3);

					const expectedError = new ValidationError(
						`tool_preferred_tools_limit_reached: Unable to add a new preferred tool, the total limit had been reached.`
					);

					return {
						externalTool,
						expectedError,
					};
				};

				it('should throw an validation error', async () => {
					const { externalTool, expectedError } = setup();

					const result: Promise<void> = service.validateCreate(externalTool);

					await expect(result).rejects.toThrow(expectedError);
				});
			});
		});
	});

	describe('validateUpdate', () => {
		describe('when external tool is given', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build({ id: 'toolId' });
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(null);

				return {
					externalTool,
					externalToolId: externalTool.id,
				};
			};

			it('should call the common validation service', async () => {
				const { externalTool, externalToolId } = setup();

				await service.validateUpdate(externalToolId, externalTool);

				expect(commonToolValidationService.validateCommon).toHaveBeenCalledWith(externalTool);
			});
		});

		describe('when checking if parameter id matches toolId', () => {
			const setup = () => {
				const externalOauthTool: ExternalTool = externalToolFactory
					.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
					.buildWithId();

				externalToolService.findById.mockResolvedValue(externalOauthTool);

				return {
					externalOauthTool,
					externalOauthToolId: externalOauthTool.id,
				};
			};

			it('should throw an error if not matches', async () => {
				const { externalOauthTool } = setup();

				const func = () => service.validateUpdate('notMatchToolId', externalOauthTool);

				await expect(func).rejects.toThrow(
					new ValidationError(`tool_id_mismatch: The tool has no id or it does not match the path parameter.`)
				);
			});

			it('should return without error if matches', async () => {
				const { externalOauthTool, externalOauthToolId } = setup();

				const result: Promise<void> = service.validateUpdate(externalOauthToolId, externalOauthTool);

				await expect(result).resolves.not.toThrow();
			});
		});

		describe('when external tool config has oauth config', () => {
			describe('when config type was changed', () => {
				const setup = () => {
					const existingExternalOauthTool: ExternalTool = externalToolFactory
						.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
						.buildWithId();

					externalToolService.findById.mockResolvedValue(existingExternalOauthTool);

					const newExternalTool: ExternalTool = externalToolFactory.buildWithId();

					return {
						existingExternalOauthTool,
						newExternalTool,
						newExternalToolId: newExternalTool.id,
					};
				};

				it('should throw', async () => {
					const { newExternalToolId, newExternalTool } = setup();

					const result: Promise<void> = service.validateUpdate(newExternalToolId, newExternalTool);

					await expect(result).rejects.toThrow(
						new ValidationError(
							`tool_type_immutable: The Config Type of the tool ${newExternalTool.name} is immutable.`
						)
					);
				});
			});

			describe('when clientId is the same', () => {
				const setup = () => {
					const externalOauthTool: ExternalTool = externalToolFactory
						.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
						.buildWithId();

					externalToolService.findById.mockResolvedValue(externalOauthTool);

					return { externalOauthTool };
				};

				it('should pass', async () => {
					const { externalOauthTool } = setup();

					const result: Promise<void> = service.validateUpdate(externalOauthTool.id, externalOauthTool);

					await expect(result).resolves.not.toThrow();
				});
			});

			describe('when clientID was changed', () => {
				const setup = () => {
					const externalOauthTool: ExternalTool = externalToolFactory
						.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
						.buildWithId();
					const existingExternalOauthToolDOWithDifferentClientId: ExternalTool = externalToolFactory
						.withOauth2Config({ clientId: 'DifferentClientId', clientSecret: 'secret' })
						.buildWithId();
					externalToolService.findById.mockResolvedValue(existingExternalOauthToolDOWithDifferentClientId);

					return {
						externalOauthTool,
					};
				};

				it('should throw', async () => {
					const { externalOauthTool } = setup();

					const result: Promise<void> = service.validateUpdate(externalOauthTool.id, externalOauthTool);

					await expect(result).rejects.toThrow(
						new ValidationError(
							`tool_clientId_immutable: The Client Id of the tool ${externalOauthTool.name} is immutable.`
						)
					);
				});
			});
		});

		describe('when external tool has another config type then oauth', () => {
			const setup = () => {
				const externalLtiToolDO: ExternalTool = externalToolFactory.withLti11Config().buildWithId();

				externalToolService.findById.mockResolvedValue(externalLtiToolDO);

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

		describe('when external tool has a given base64 logo', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.withBase64Logo().build();
				configService.get.mockReturnValue(30000);

				return { externalTool };
			};

			it('should call externalToolLogoService', async () => {
				const { externalTool } = setup();

				await service.validateCreate(externalTool);

				expect(logoService.validateLogoSize).toHaveBeenCalledWith(externalTool);
			});
		});

		describe('when the external tool is set to be a preferred tool', () => {
			describe('when the preferred tool has an icon name', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory.build({
						isPreferred: true,
						iconName: 'mdiAlert',
					});

					configService.get.mockReturnValue(10);

					return {
						externalTool,
					};
				};

				it('should not throw an validation error', async () => {
					const { externalTool } = setup();

					const result: Promise<void> = service.validateCreate(externalTool);

					await expect(result).resolves.not.toThrow();
				});
			});

			describe('when the preferred tool has undefined icon name', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory.build({
						isPreferred: true,
						iconName: undefined,
					});

					const mockedPreferredToolsPage: Page<ExternalTool> = new Page<ExternalTool>([], 0);

					externalToolService.findExternalTools.mockResolvedValue(mockedPreferredToolsPage);
					configService.get.mockReturnValue(10);

					const expectedError = new ValidationError(
						`tool_preferred_tools_missing_icon_name: The icon name of the preferred tool ${externalTool.name} is missing.`
					);

					return {
						externalTool,
						expectedError,
					};
				};

				it('should throw an validation error', async () => {
					const { externalTool, expectedError } = setup();

					const result: Promise<void> = service.validateCreate(externalTool);

					await expect(result).rejects.toThrow(expectedError);
				});
			});

			describe('when the preferred tool has a blank icon name', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory.build({
						isPreferred: true,
						iconName: '',
					});

					const mockedPreferredToolsPage: Page<ExternalTool> = new Page<ExternalTool>([], 0);

					externalToolService.findExternalTools.mockResolvedValue(mockedPreferredToolsPage);
					configService.get.mockReturnValue(10);

					const expectedError = new ValidationError(
						`tool_preferred_tools_missing_icon_name: The icon name of the preferred tool ${externalTool.name} is missing.`
					);

					return {
						externalTool,
						expectedError,
					};
				};

				it('should throw an validation error', async () => {
					const { externalTool, expectedError } = setup();

					const result: Promise<void> = service.validateCreate(externalTool);

					await expect(result).rejects.toThrow(expectedError);
				});
			});

			describe('when the preferred tool limits had already been reached', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory.build({
						isPreferred: true,
						iconName: '',
					});

					const mockedPreferredToolsPage: Page<ExternalTool> = new Page<ExternalTool>(
						externalToolFactory.buildList(3),
						3
					);

					externalToolService.findExternalTools.mockResolvedValue(mockedPreferredToolsPage);
					configService.get.mockReturnValue(3);

					const expectedError = new ValidationError(
						`tool_preferred_tools_limit_reached: Unable to add a new preferred tool, the total limit had been reached.`
					);

					return {
						externalTool,
						expectedError,
					};
				};

				it('should throw an validation error', async () => {
					const { externalTool, expectedError } = setup();

					const result: Promise<void> = service.validateCreate(externalTool);

					await expect(result).rejects.toThrow(expectedError);
				});
			});

			describe('when the preferred tool limits had already been exceeded', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory.build({
						isPreferred: true,
						iconName: '',
					});

					const mockedPreferredToolsPage: Page<ExternalTool> = new Page<ExternalTool>(
						externalToolFactory.buildList(5),
						3
					);

					externalToolService.findExternalTools.mockResolvedValue(mockedPreferredToolsPage);
					configService.get.mockReturnValue(3);

					const expectedError = new ValidationError(
						`tool_preferred_tools_limit_reached: Unable to add a new preferred tool, the total limit had been reached.`
					);

					return {
						externalTool,
						expectedError,
					};
				};

				it('should throw an validation error', async () => {
					const { externalTool, expectedError } = setup();

					const result: Promise<void> = service.validateCreate(externalTool);

					await expect(result).rejects.toThrow(expectedError);
				});
			});
		});
	});
});
