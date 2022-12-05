import { externalToolDOFactory } from '@shared/testing/factory/domainobject/external-tool.factory';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
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

				await expect(result).rejects.toThrow(UnprocessableEntityException);
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

				await expect(result).rejects.toThrow(UnprocessableEntityException);
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

				await expect(result).rejects.toThrow(UnprocessableEntityException);
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

				await expect(result).rejects.toThrow(UnprocessableEntityException);
			});
		});
	});

	describe('validateUpdate', () => {
		describe('isNameUnique', () => {
			it('should not find a tool with the same name', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();

				const result: Promise<void> = service.validateUpdate(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should find itself', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();
				externalToolService.findExternalToolByName.mockResolvedValue(externalToolDO);

				const result: Promise<void> = service.validateUpdate(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should find a tool with the same name', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId({ name: 'sameName' });
				const existingExternalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId({ name: 'sameName' });
				externalToolService.findExternalToolByName.mockResolvedValue(existingExternalToolDO);

				const result: Promise<void> = service.validateUpdate(externalToolDO);

				await expect(result).rejects.toThrow(UnprocessableEntityException);
			});
		});

		describe('hasDuplicateAttributes', () => {
			it('should not find duplicate custom parameters', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withCustomParameters(2).buildWithId();

				const result: Promise<void> = service.validateUpdate(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('throw when external tool has duplicate custom parameter keys', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory
					.withCustomParameters(2, { name: 'sameKey' })
					.buildWithId();

				const result: Promise<void> = service.validateUpdate(externalToolDO);

				await expect(result).rejects.toThrow(UnprocessableEntityException);
			});
		});

		describe('validateByRegex', () => {
			it('should validate the regular expression', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withCustomParameters(1).buildWithId();

				const result: Promise<void> = service.validateUpdate(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('throw when external tools has a faulty regular expression', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory
					.withCustomParameters(1, { regex: '[' })
					.buildWithId();

				const result: Promise<void> = service.validateUpdate(externalToolDO);

				await expect(result).rejects.toThrow(UnprocessableEntityException);
			});
		});

		describe('has Tool Id', () => {
			it('should pass if the tool has an id', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();

				const result: Promise<void> = service.validateUpdate(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should throw if the tool has no id', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.build();

				const result: Promise<void> = service.validateUpdate(externalToolDO);

				await expect(result).rejects.toThrow(UnprocessableEntityException);
			});
		});

		describe('Oauth2 config', () => {
			it('should pass if tool has the same clientId as before', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withOauth2Config().buildWithId();
				externalToolService.findExternalToolById.mockResolvedValue(externalToolDO);

				const result: Promise<void> = service.validateUpdate(externalToolDO);

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

				const result: Promise<void> = service.validateUpdate(externalToolDO);

				await expect(result).rejects.toThrow(UnprocessableEntityException);
			});
		});
	});
});
