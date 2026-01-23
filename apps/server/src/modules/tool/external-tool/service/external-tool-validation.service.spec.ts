import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common/error';
import { Page } from '@shared/domain/domainobject';
import { TOOL_CONFIG_TOKEN, ToolConfig } from '../../tool-config';
import { ExternalTool } from '../domain';
import { ExternalToolMediumStatus } from '../enum';
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
	let config: ToolConfig;
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
					provide: TOOL_CONFIG_TOKEN,
					useValue: {},
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
		config = module.get(TOOL_CONFIG_TOKEN);
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
			describe('when external tool is a template', () => {
				const setup = () => {
					const externalOauthToolTemplate: ExternalTool = externalToolFactory
						.withMedium({ status: ExternalToolMediumStatus.TEMPLATE })
						.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
						.buildWithId();
					externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(null);

					return { externalOauthToolTemplate };
				};

				it('should throw validation error', async () => {
					const { externalOauthToolTemplate } = setup();

					const result: Promise<void> = service.validateCreate(externalOauthToolTemplate);

					await expect(result).rejects.toThrow(
						new ValidationError(
							'tool_template_oauth2_invalid: No templates for tools with OAuth2 configuration allowed.'
						)
					);
				});
			});

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
				config.ctlToolsExternalToolMaxLogoSizeInBytes = 30000;

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
					const mockedPreferredToolsPage: Page<ExternalTool> = new Page<ExternalTool>([], 0);

					externalToolService.findExternalTools.mockResolvedValue(mockedPreferredToolsPage);
					config.ctlToolsPreferredToolsLimit = 10;

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
					config.ctlToolsPreferredToolsLimit = 10;

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
					config.ctlToolsPreferredToolsLimit = 10;

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
						iconName: 'mdiAlert',
					});

					const mockedPreferredToolsPage: Page<ExternalTool> = new Page<ExternalTool>(
						externalToolFactory.buildList(3),
						3
					);

					externalToolService.findExternalTools.mockResolvedValue(mockedPreferredToolsPage);
					config.ctlToolsPreferredToolsLimit = 3;

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
						iconName: 'mdiAlert',
					});

					const mockedPreferredToolsPage: Page<ExternalTool> = new Page<ExternalTool>(
						externalToolFactory.buildList(5),
						3
					);

					externalToolService.findExternalTools.mockResolvedValue(mockedPreferredToolsPage);
					config.ctlToolsPreferredToolsLimit = 3;

					const expectedError = new ValidationError(
						`tool_preferred_tools_limit_reached: Unable to add a new preferred tool, the total limit had been reached.`
					);

					return {
						externalTool,
						expectedError,
					};
				};

				it('should throw a validation error', async () => {
					const { externalTool, expectedError } = setup();

					const result: Promise<void> = service.validateCreate(externalTool);

					await expect(result).rejects.toThrow(expectedError);
				});
			});
		});

		describe('when the external tool has no medium', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build();

				const mockedPreferredToolsPage: Page<ExternalTool> = new Page<ExternalTool>([], 0);

				externalToolService.findExternalTools.mockResolvedValue(mockedPreferredToolsPage);
				config.ctlToolsPreferredToolsLimit = 10;

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
		describe('when the external tool has medium', () => {
			describe('when the medium has no status', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory.withMedium({ status: undefined }).build();

					const mockedPreferredToolsPage: Page<ExternalTool> = new Page<ExternalTool>([], 0);

					externalToolService.findExternalTools.mockResolvedValue(mockedPreferredToolsPage);
					config.ctlToolsPreferredToolsLimit = 10;

					const expectedError = new ValidationError(
						`tool_medium_status: This medium status must be one of: active, draft or template.`
					);

					return {
						externalTool,
						expectedError,
					};
				};

				it('should throw a validation error', async () => {
					const { externalTool, expectedError } = setup();

					const result: Promise<void> = service.validateCreate(externalTool);

					await expect(result).rejects.toThrow(expectedError);
				});
			});

			describe('when the medium is in status active', () => {
				describe('when the medium is valid', () => {
					const setup = () => {
						const externalTool: ExternalTool = externalToolFactory.withMedium().build();
						const mockedPreferredToolsPage: Page<ExternalTool> = new Page<ExternalTool>([], 0);

						externalToolService.findExternalTools.mockResolvedValue(mockedPreferredToolsPage);
						config.ctlToolsPreferredToolsLimit = 10;

						return {
							externalTool,
						};
					};

					it('should not throw a validation error', async () => {
						const { externalTool } = setup();

						const result: Promise<void> = service.validateCreate(externalTool);

						await expect(result).resolves.not.toThrow();
					});
				});

				describe('when medium the has no mediumId', () => {
					const setup = () => {
						const externalTool: ExternalTool = externalToolFactory.withMedium({ mediumId: undefined }).build();

						const mockedPreferredToolsPage: Page<ExternalTool> = new Page<ExternalTool>([], 0);

						externalToolService.findExternalTools.mockResolvedValue(mockedPreferredToolsPage);
						config.ctlToolsPreferredToolsLimit = 10;

						const expectedError = new ValidationError(
							`tool_medium_status_active: This medium is active but is not linked to an external medium.`
						);

						return {
							externalTool,
							expectedError,
						};
					};

					it('should throw a validation error', async () => {
						const { externalTool, expectedError } = setup();

						const result: Promise<void> = service.validateCreate(externalTool);

						await expect(result).rejects.toThrow(expectedError);
					});
				});
			});

			describe('when the medium is in status draft', () => {
				describe('when the medium draft is valid', () => {
					const setup = () => {
						const externalTool: ExternalTool = externalToolFactory
							.withMedium({ status: ExternalToolMediumStatus.DRAFT })
							.build();
						const mockedPreferredToolsPage: Page<ExternalTool> = new Page<ExternalTool>([], 0);

						externalToolService.findExternalTools.mockResolvedValue(mockedPreferredToolsPage);
						config.ctlToolsPreferredToolsLimit = 10;

						return {
							externalTool,
						};
					};

					it('should not throw a validation error', async () => {
						const { externalTool } = setup();

						const result: Promise<void> = service.validateCreate(externalTool);

						await expect(result).resolves.not.toThrow();
					});
				});

				describe('when the medium draft has no mediumId', () => {
					const setup = () => {
						const externalTool: ExternalTool = externalToolFactory
							.withMedium({ status: ExternalToolMediumStatus.DRAFT, mediumId: undefined })
							.build();

						const mockedPreferredToolsPage: Page<ExternalTool> = new Page<ExternalTool>([], 0);

						externalToolService.findExternalTools.mockResolvedValue(mockedPreferredToolsPage);
						config.ctlToolsPreferredToolsLimit = 10;

						const expectedError = new ValidationError(
							`tool_medium_status_draft: This medium is draft but is not linked to an external medium.`
						);

						return {
							externalTool,
							expectedError,
						};
					};

					it('should throw a validation error', async () => {
						const { externalTool, expectedError } = setup();

						const result: Promise<void> = service.validateCreate(externalTool);

						await expect(result).rejects.toThrow(expectedError);
					});
				});
			});

			describe('when the medium is in status template', () => {
				describe('when the medium template is valid', () => {
					const setup = () => {
						const externalTool: ExternalTool = externalToolFactory
							.withMedium({ status: ExternalToolMediumStatus.TEMPLATE, mediumId: undefined })
							.build();
						const mockedPreferredToolsPage: Page<ExternalTool> = new Page<ExternalTool>([], 0);

						externalToolService.findExternalTools.mockResolvedValue(mockedPreferredToolsPage);
						config.ctlToolsPreferredToolsLimit = 10;

						return {
							externalTool,
						};
					};

					it('should not throw a validation error', async () => {
						const { externalTool } = setup();

						const result: Promise<void> = service.validateCreate(externalTool);

						await expect(result).resolves.not.toThrow();
					});
				});
				describe('when the medium tempalte has mediumId', () => {
					const setup = () => {
						const externalTool: ExternalTool = externalToolFactory
							.withMedium({ status: ExternalToolMediumStatus.TEMPLATE })
							.build();

						const mockedPreferredToolsPage: Page<ExternalTool> = new Page<ExternalTool>([], 0);

						externalToolService.findExternalTools.mockResolvedValue(mockedPreferredToolsPage);
						config.ctlToolsPreferredToolsLimit = 10;

						const expectedError = new ValidationError(
							`tool_medium_status_template: This template cannot be linked to a specific medium.`
						);

						return {
							externalTool,
							expectedError,
						};
					};

					it('should throw a validation error', async () => {
						const { externalTool, expectedError } = setup();

						const result: Promise<void> = service.validateCreate(externalTool);

						await expect(result).rejects.toThrow(expectedError);
					});
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
			describe('when external tool is a template', () => {
				const setup = () => {
					const externalOauthToolTemplate: ExternalTool = externalToolFactory
						.withMedium({ status: ExternalToolMediumStatus.TEMPLATE })
						.withOauth2Config({ clientId: 'ClientId', clientSecret: 'secret' })
						.buildWithId();
					externalToolService.findById.mockResolvedValue(externalOauthToolTemplate);

					return { externalOauthToolTemplate };
				};

				it('should throw validation error', async () => {
					const { externalOauthToolTemplate } = setup();

					const result: Promise<void> = service.validateUpdate(externalOauthToolTemplate.id, externalOauthToolTemplate);

					await expect(result).rejects.toThrow(
						new ValidationError(
							'tool_template_oauth2_invalid: No templates for tools with OAuth2 configuration allowed.'
						)
					);
				});
			});

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
				config.ctlToolsExternalToolMaxLogoSizeInBytes = 30000;

				return { externalTool };
			};

			it('should call externalToolLogoService', async () => {
				const { externalTool } = setup();

				await service.validateCreate(externalTool);

				expect(logoService.validateLogoSize).toHaveBeenCalledWith(externalTool);
			});
		});

		describe('when the external tool is not an preferred tool', () => {
			describe('when the external tool is set to be a preferred tool', () => {
				describe('when the preferred tool has an icon name', () => {
					const setup = () => {
						const existingToolToUpdate = externalToolFactory.buildWithId({
							isPreferred: false,
						});

						const toolWithNewParams = externalToolFactory.build({
							...existingToolToUpdate.getProps(),
							id: existingToolToUpdate.id,
							isPreferred: true,
							iconName: 'mdiAlert',
						});

						const existingPreferredTools: Page<ExternalTool> = new Page<ExternalTool>([], 0);

						externalToolService.findExternalTools.mockResolvedValue(existingPreferredTools);
						config.ctlToolsPreferredToolsLimit = 10;

						return {
							existingToolToUpdateId: existingToolToUpdate.id,
							toolWithNewParams,
						};
					};

					it('should not throw an validation error', async () => {
						const { existingToolToUpdateId, toolWithNewParams } = setup();

						const result: Promise<void> = service.validateUpdate(existingToolToUpdateId, toolWithNewParams);

						await expect(result).resolves.not.toThrow();
					});
				});

				describe('when the preferred tool has undefined icon name', () => {
					const setup = () => {
						const existingToolToUpdate = externalToolFactory.buildWithId({
							isPreferred: false,
						});

						const toolWithNewParams = externalToolFactory.build({
							...existingToolToUpdate.getProps(),
							id: existingToolToUpdate.id,
							isPreferred: true,
							iconName: undefined,
						});

						const existingPreferredTools: Page<ExternalTool> = new Page<ExternalTool>([], 0);

						externalToolService.findExternalTools.mockResolvedValue(existingPreferredTools);
						config.ctlToolsPreferredToolsLimit = 10;

						const expectedError = new ValidationError(
							`tool_preferred_tools_missing_icon_name: The icon name of the preferred tool ${toolWithNewParams.name} is missing.`
						);

						return {
							existingToolToUpdateId: existingToolToUpdate.id,
							toolWithNewParams,
							expectedError,
						};
					};

					it('should throw an validation error', async () => {
						const { existingToolToUpdateId, toolWithNewParams, expectedError } = setup();

						const result: Promise<void> = service.validateUpdate(existingToolToUpdateId, toolWithNewParams);

						await expect(result).rejects.toThrow(expectedError);
					});
				});

				describe('when the preferred tool has a blank icon name', () => {
					const setup = () => {
						const existingToolToUpdate = externalToolFactory.buildWithId({
							isPreferred: false,
						});

						const toolWithNewParams = externalToolFactory.build({
							...existingToolToUpdate.getProps(),
							id: existingToolToUpdate.id,
							isPreferred: true,
							iconName: '',
						});

						const existingPreferredTools: Page<ExternalTool> = new Page<ExternalTool>([], 0);

						externalToolService.findExternalTools.mockResolvedValue(existingPreferredTools);
						config.ctlToolsPreferredToolsLimit = 10;

						const expectedError = new ValidationError(
							`tool_preferred_tools_missing_icon_name: The icon name of the preferred tool ${toolWithNewParams.name} is missing.`
						);

						return {
							existingToolToUpdateId: existingToolToUpdate.id,
							toolWithNewParams,
							expectedError,
						};
					};

					it('should throw an validation error', async () => {
						const { existingToolToUpdateId, toolWithNewParams, expectedError } = setup();

						const result: Promise<void> = service.validateUpdate(existingToolToUpdateId, toolWithNewParams);

						await expect(result).rejects.toThrow(expectedError);
					});
				});

				describe('when the preferred tool limits had already been reached', () => {
					const setup = () => {
						const existingToolToUpdate = externalToolFactory.buildWithId({
							isPreferred: false,
						});

						const toolWithNewParams = externalToolFactory.build({
							...existingToolToUpdate.getProps(),
							id: existingToolToUpdate.id,
							isPreferred: true,
							iconName: 'mdiAlert',
						});

						const existingPreferredTools: Page<ExternalTool> = new Page<ExternalTool>(
							externalToolFactory.buildListWithId(3, {
								isPreferred: true,
								iconName: 'mdiFlag',
							}),
							3
						);

						externalToolService.findExternalTools.mockResolvedValue(existingPreferredTools);
						config.ctlToolsPreferredToolsLimit = 3;

						const expectedError = new ValidationError(
							`tool_preferred_tools_limit_reached: Unable to add a new preferred tool, the total limit had been reached.`
						);

						return {
							existingToolToUpdateId: existingToolToUpdate.id,
							toolWithNewParams,
							expectedError,
						};
					};

					it('should throw an validation error', async () => {
						const { existingToolToUpdateId, toolWithNewParams, expectedError } = setup();

						const result: Promise<void> = service.validateUpdate(existingToolToUpdateId, toolWithNewParams);

						await expect(result).rejects.toThrow(expectedError);
						expect(externalToolService.findExternalTools).toBeCalledWith({ isPreferred: true });
					});
				});

				describe('when the preferred tool limits had already been exceeded', () => {
					const setup = () => {
						const existingToolToUpdate = externalToolFactory.buildWithId({
							isPreferred: false,
						});

						const toolWithNewParams = externalToolFactory.build({
							...existingToolToUpdate.getProps(),
							id: existingToolToUpdate.id,
							isPreferred: true,
							iconName: 'mdiAlert',
						});

						const existingPreferredTools: Page<ExternalTool> = new Page<ExternalTool>(
							externalToolFactory.buildListWithId(3, {
								isPreferred: true,
								iconName: 'mdiFlag',
							}),
							5
						);

						externalToolService.findExternalTools.mockResolvedValue(existingPreferredTools);
						config.ctlToolsPreferredToolsLimit = 3;

						const expectedError = new ValidationError(
							`tool_preferred_tools_limit_reached: Unable to add a new preferred tool, the total limit had been reached.`
						);

						return {
							existingToolToUpdateId: existingToolToUpdate.id,
							toolWithNewParams,
							expectedError,
						};
					};

					it('should throw an validation error', async () => {
						const { existingToolToUpdateId, toolWithNewParams, expectedError } = setup();

						const result: Promise<void> = service.validateUpdate(existingToolToUpdateId, toolWithNewParams);

						await expect(result).rejects.toThrow(expectedError);
						expect(externalToolService.findExternalTools).toBeCalledWith({ isPreferred: true });
					});
				});
			});
		});

		describe('when the external tool is already an preferred tool', () => {
			describe('when the preferred tool limit is reached', () => {
				const setup = () => {
					const existingToolToUpdate = externalToolFactory.buildWithId({
						isPreferred: true,
						iconName: 'mdiAlert',
					});

					const toolWithNewParams = externalToolFactory.build({
						...existingToolToUpdate.getProps(),
						id: existingToolToUpdate.id,
						name: 'new-name-tool',
					});

					const existingOtherPreferredTools = externalToolFactory.buildListWithId(3, {
						isPreferred: true,
						iconName: 'mdiFlag',
					});

					const existingTools: Page<ExternalTool> = new Page<ExternalTool>(
						[existingToolToUpdate, ...existingOtherPreferredTools],
						4
					);

					externalToolService.findExternalTools.mockResolvedValue(existingTools);
					config.ctlToolsPreferredToolsLimit = 4;

					return {
						existingToolToUpdateId: existingToolToUpdate.id,
						toolWithNewParams,
					};
				};

				it('should not throw any error', async () => {
					const { existingToolToUpdateId, toolWithNewParams } = setup();

					const result: Promise<void> = service.validateUpdate(existingToolToUpdateId, toolWithNewParams);

					await expect(result).resolves.not.toThrow();
					expect(externalToolService.findExternalTools).toBeCalledWith({ isPreferred: true });
				});
			});

			describe('when the preferred tool limits had already been exceeded', () => {
				const setup = () => {
					const existingToolToUpdate = externalToolFactory.buildWithId({
						isPreferred: true,
						iconName: 'mdiAlert',
					});

					const toolWithNewParams = externalToolFactory.build({
						...existingToolToUpdate.getProps(),
						id: existingToolToUpdate.id,
						name: 'new-name-tool',
					});

					const existingOtherPreferredTools = externalToolFactory.buildListWithId(3, {
						isPreferred: true,
						iconName: 'mdiFlag',
					});

					const existingTools: Page<ExternalTool> = new Page<ExternalTool>(
						[existingToolToUpdate, ...existingOtherPreferredTools],
						4
					);

					externalToolService.findExternalTools.mockResolvedValue(existingTools);
					config.ctlToolsPreferredToolsLimit = 2;

					const expectedError = new ValidationError(
						`tool_preferred_tools_limit_reached: Unable to add a new preferred tool, the total limit had been reached.`
					);

					return {
						existingToolToUpdateId: existingToolToUpdate.id,
						toolWithNewParams,
						expectedError,
					};
				};

				it('should not throw any error', async () => {
					const { existingToolToUpdateId, toolWithNewParams } = setup();

					const result: Promise<void> = service.validateUpdate(existingToolToUpdateId, toolWithNewParams);

					await expect(result).resolves.not.toThrow();
					expect(externalToolService.findExternalTools).toBeCalledWith({ isPreferred: true });
				});
			});
		});

		describe('when the external tool has medium', () => {
			describe('when the medium has no status', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory.withMedium({ status: undefined }).buildWithId();

					externalToolService.findById.mockResolvedValue(externalTool);
					const expectedError = new ValidationError(
						`tool_medium_status: This medium status must be one of: active, draft or template.`
					);
					return {
						externalTool,
						externalToolId: externalTool.id,
						expectedError,
					};
				};

				it('should throw a validation error', async () => {
					const { externalToolId, externalTool, expectedError } = setup();

					const result: Promise<void> = service.validateUpdate(externalToolId, externalTool);

					await expect(result).rejects.toThrow(expectedError);
				});
			});
			describe('when the medium is in status active', () => {
				describe('when the medium is valid', () => {
					const setup = () => {
						const externalTool: ExternalTool = externalToolFactory.withMedium({}).buildWithId();

						externalToolService.findById.mockResolvedValue(externalTool);

						return {
							externalTool,
							externalToolId: externalTool.id,
						};
					};

					it('should not throw a validation error', async () => {
						const { externalToolId, externalTool } = setup();

						const result: Promise<void> = service.validateUpdate(externalToolId, externalTool);

						await expect(result).resolves.not.toThrow();
					});
				});

				describe('when medium has no mediumId', () => {
					const setup = () => {
						const externalTool: ExternalTool = externalToolFactory.withMedium({ mediumId: undefined }).buildWithId();

						externalToolService.findById.mockResolvedValue(externalTool);
						const expectedError = new ValidationError(
							`tool_medium_status_active: This medium is active but is not linked to an external medium.`
						);
						return {
							externalTool,
							externalToolId: externalTool.id,
							expectedError,
						};
					};

					it('should throw a validation error', async () => {
						const { externalToolId, externalTool, expectedError } = setup();

						const result: Promise<void> = service.validateUpdate(externalToolId, externalTool);
						await expect(result).rejects.toThrow(expectedError);
					});
				});
			});

			describe('when the medium is in status draft', () => {
				describe('when the medium draft is valid', () => {
					const setup = () => {
						const externalTool: ExternalTool = externalToolFactory
							.withMedium({ status: ExternalToolMediumStatus.DRAFT })
							.buildWithId();

						externalToolService.findById.mockResolvedValue(externalTool);

						return {
							externalTool,
							externalToolId: externalTool.id,
						};
					};

					it('should not throw a validation error', async () => {
						const { externalToolId, externalTool } = setup();

						const result: Promise<void> = service.validateUpdate(externalToolId, externalTool);

						await expect(result).resolves.not.toThrow();
					});
				});

				describe('when the medium draft has no mediumId', () => {
					const setup = () => {
						const externalTool: ExternalTool = externalToolFactory
							.withMedium({ status: ExternalToolMediumStatus.DRAFT, mediumId: undefined })
							.buildWithId();

						externalToolService.findById.mockResolvedValue(externalTool);

						const expectedError = new ValidationError(
							`tool_medium_status_draft: This medium is draft but is not linked to an external medium.`
						);

						return {
							externalTool,
							externalToolId: externalTool.id,
							expectedError,
						};
					};

					it('should throw a validation error', async () => {
						const { externalToolId, externalTool, expectedError } = setup();

						const result: Promise<void> = service.validateUpdate(externalToolId, externalTool);

						await expect(result).rejects.toThrow(expectedError);
					});
				});
			});

			describe('when the medium is in status template', () => {
				describe('when the medium template is valid', () => {
					const setup = () => {
						const externalTool: ExternalTool = externalToolFactory
							.withMedium({ status: ExternalToolMediumStatus.TEMPLATE, mediumId: undefined })
							.buildWithId();

						externalToolService.findById.mockResolvedValue(externalTool);

						return {
							externalTool,
							externalToolId: externalTool.id,
						};
					};
					it('should not throw a validation error', async () => {
						const { externalToolId, externalTool } = setup();

						const result: Promise<void> = service.validateUpdate(externalToolId, externalTool);

						await expect(result).resolves.not.toThrow();
					});
				});
				describe('when the medium tempalte has mediumId', () => {
					const setup = () => {
						const externalTool: ExternalTool = externalToolFactory
							.withMedium({ status: ExternalToolMediumStatus.TEMPLATE })
							.buildWithId();

						externalToolService.findById.mockResolvedValue(externalTool);

						const expectedError = new ValidationError(
							`tool_medium_status_template: This template cannot be linked to a specific medium.`
						);

						return {
							externalTool,
							externalToolId: externalTool.id,
							expectedError,
						};
					};

					it('should throw a validation error', async () => {
						const { externalToolId, externalTool, expectedError } = setup();

						const result: Promise<void> = service.validateUpdate(externalToolId, externalTool);

						await expect(result).rejects.toThrow(expectedError);
					});
				});
			});
		});
	});
});
