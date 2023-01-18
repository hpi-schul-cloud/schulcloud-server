import { externalToolDOFactory } from '@shared/testing/factory/domainobject/external-tool.factory';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CustomParameterDO, ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { UnprocessableEntityException } from '@nestjs/common';
import { ExternalToolService } from './external-tool.service';
import { ToolValidationService } from './tool-validation.service';

describe('ToolValidation', () => {
	let module: TestingModule;
	let service: ToolValidationService;

	let externalToolService: DeepMocked<ExternalToolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToolValidationService,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
			],
		}).compile();

		service = module.get(ToolValidationService);
		externalToolService = module.get(ExternalToolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	beforeEach(() => {
		externalToolService.findExternalToolByName.mockResolvedValue(null);
		externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(null);
	});

	describe('validateCreate', () => {
		describe('isNameUnique', () => {
			it('should not find a tool with the same name', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.build();

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should find itself', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();
				externalToolService.findExternalToolByName.mockResolvedValue(externalToolDO);

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should find a tool with the same name', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.build({ name: 'sameName' });
				const existingExternalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId({ name: 'sameName' });
				externalToolService.findExternalToolByName.mockResolvedValue(existingExternalToolDO);

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).rejects.toThrow(
					new UnprocessableEntityException(`The tool name "${externalToolDO.name}" is already used`)
				);
			});
		});

		describe('hasDuplicateAttributes', () => {
			it('should not find duplicate custom parameters', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withCustomParameters(2).build();

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('throw when external tool has duplicate custom parameter keys', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory
					.withCustomParameters(2, { name: 'sameKey' })
					.build();

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).rejects.toThrow(
					new UnprocessableEntityException(
						`The tool: ${externalToolDO.name} contains multiple of the same custom parameters`
					)
				);
			});
		});

		describe('validateByRegex', () => {
			it('should validate the regular expression', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withCustomParameters(1).build();

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('throw when external tools has a faulty regular expression', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withCustomParameters(1, { regex: '[' }).build();

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).rejects.toThrow(
					new UnprocessableEntityException(
						`A custom Parameter of the tool: ${externalToolDO.name} has wrong regex attribute`
					)
				);
			});
		});

		describe('isRegexCommentMandatoryAndFilled', () => {
			it('should throw if regex is set but no comment was provided', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withCustomParameters(1, { regex: '.' }).build();
				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).rejects.toThrow(
					new UnprocessableEntityException(
						`The "${(externalToolDO.parameters as CustomParameterDO[])[0].name}" parameter is missing a regex comment.`
					)
				);
			});

			it('should not throw if regex is not set', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withCustomParameters(1).build();

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should not throw if regex and regexComment is set', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory
					.withCustomParameters(1, { regex: '.', regexComment: 'mockComment' })
					.build();

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});
		});

		describe('isClientIdUnique', () => {
			it('should return true if the config is not of type Oauth2', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.build();

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should not find a tool with this client id', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withOauth2Config().build();

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should find itself', async () => {
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
		describe('when validating an oauth2 tool', () => {
			it('should call the externalToolService.isOauth2Config', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withOauth2Config().buildWithId();
				externalToolService.findExternalToolById.mockResolvedValue(externalToolDO);

				await service.validateUpdate(externalToolDO.id as string, externalToolDO);

				expect(externalToolService.isOauth2Config).toHaveBeenCalledWith(externalToolDO.config);
			});

			describe('the config type', () => {
				describe('has changed', () => {
					it('should throw', async () => {
						const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();
						const existingExternalToolDO: ExternalToolDO = externalToolDOFactory
							.withOauth2Config({ clientId: 'clientId1' })
							.buildWithId();
						externalToolService.findExternalToolById.mockResolvedValue(existingExternalToolDO);

						const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

						await expect(result).rejects.toThrow(
							new UnprocessableEntityException(`The Config Type of the tool ${externalToolDO.name} is immutable`)
						);
					});
				});
			});

			describe('the clientId', () => {
				it('should call the externalToolService.isOauth2Config', () => {});

				describe('has changed', () => {
					it('should throw', async () => {
						const externalToolDO: ExternalToolDO = externalToolDOFactory
							.withOauth2Config({ clientId: 'clientId2' })
							.buildWithId();
						const existingExternalToolDO: ExternalToolDO = externalToolDOFactory
							.withOauth2Config({ clientId: 'clientId1' })
							.buildWithId();
						externalToolService.findExternalToolById.mockResolvedValue(existingExternalToolDO);

						const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

						await expect(result).rejects.toThrow(
							new UnprocessableEntityException(`The Client Id of the tool ${externalToolDO.name} is immutable`)
						);
					});
				});

				describe('is the same', () => {
					it('should pass', async () => {
						const externalToolDO: ExternalToolDO = externalToolDOFactory.withOauth2Config().buildWithId();
						externalToolService.findExternalToolById.mockResolvedValue(externalToolDO);

						const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

						await expect(result).resolves.not.toThrow();
					});
				});
			});
		});

		describe('isNameUnique', () => {
			it('should not return true when no name is given', async () => {
				const externalToolDO: Partial<ExternalToolDO> = externalToolDOFactory.buildWithId();
				externalToolDO.name = undefined;
				externalToolService.findExternalToolById.mockResolvedValue(externalToolDO as ExternalToolDO);

				const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should not find a tool with the same name', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();
				externalToolService.findExternalToolById.mockResolvedValue(externalToolDO);

				const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should not find a tool with the same name', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();
				externalToolService.findExternalToolById.mockResolvedValue(externalToolDO);

				const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should find itself', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();
				externalToolService.findExternalToolByName.mockResolvedValue(externalToolDO);

				const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should find a tool with the same name', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId({ name: 'sameName' });
				const existingExternalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId({ name: 'sameName' });
				externalToolService.findExternalToolByName.mockResolvedValue(existingExternalToolDO);

				const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

				await expect(result).rejects.toThrow(
					new UnprocessableEntityException(`The tool name "${externalToolDO.name}" is already used`)
				);
			});
		});

		describe('hasDuplicateAttributes', () => {
			it('should not find duplicate custom parameters', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withCustomParameters(2).buildWithId();

				const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('throw when external tool has duplicate custom parameter keys', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory
					.withCustomParameters(2, { name: 'sameKey' })
					.buildWithId();

				const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

				await expect(result).rejects.toThrow(
					new UnprocessableEntityException(
						`The tool: ${externalToolDO.name} contains multiple of the same custom parameters`
					)
				);
			});
		});

		describe('validateByRegex', () => {
			it('should validate the regular expression', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withCustomParameters(1).buildWithId();

				const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('throw when external tools has a faulty regular expression', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory
					.withCustomParameters(1, { regex: '[' })
					.buildWithId();

				const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

				await expect(result).rejects.toThrow(
					new UnprocessableEntityException(
						`A custom Parameter of the tool: ${externalToolDO.name} has wrong regex attribute`
					)
				);
			});
		});

		describe('isRegexCommentMandatoryAndFilled', () => {
			it('should throw if regex is set but no comment was provided', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withCustomParameters(1, { regex: '.' }).build();

				const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

				await expect(result).rejects.toThrow(
					new UnprocessableEntityException(
						`The "${(externalToolDO.parameters as CustomParameterDO[])[0].name}" parameter is missing a regex comment.`
					)
				);
			});

			it('should not throw if regex is not set', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withCustomParameters(1).build();

				const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should not throw if regex and regexComment is set', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory
					.withCustomParameters(1, { regex: '.', regexComment: 'mockComment' })
					.build();

				const result: Promise<void> = service.validateUpdate(externalToolDO.id as string, externalToolDO);

				await expect(result).resolves.not.toThrow();
			});
		});

		describe('matches toolId with parameter', () => {
			it('should throw an error when toolId does not match id parameter', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();

				const func = () => service.validateUpdate('notMatchToolId', externalToolDO);

				await expect(func).rejects.toThrow(
					new UnprocessableEntityException(`The tool has no id or it does not match the path parameter.`)
				);
			});

			it('should pass if the tool and id parameter are the same', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();
				externalToolDO.id = 'toolId';

				const result: Promise<void> = service.validateUpdate(externalToolDO.id, externalToolDO);

				await expect(result).resolves.not.toThrow();
			});
		});
	});
});
