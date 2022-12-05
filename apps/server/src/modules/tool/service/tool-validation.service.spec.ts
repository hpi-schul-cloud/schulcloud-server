import {
	externalToolDOFactory,
	lti11ToolConfigDOFactory,
	oauth2ToolConfigDOFactory,
} from '@shared/testing/factory/domainobject/external-tool.factory';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ExternalToolDO, Lti11ToolConfigDO, Oauth2ToolConfigDO } from '@shared/domain/domainobject/external-tool';
import { ProviderOauthClient } from '@shared/infra/oauth-provider/dto';
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

	describe('validateCreate', () => {
		describe('isNameUnique', () => {
			it('should not find a tool with the same name', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();
				externalToolService.findExternalToolByName.mockResolvedValue(null);

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should find a tool with the same name', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();
				externalToolService.findExternalToolByName.mockResolvedValue(externalToolDO);

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).rejects.toThrow(UnprocessableEntityException);
			});
		});

		describe('isClientIdUnique', () => {
			it('should not find a tool with this client id', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withOauth2Config().buildWithId();
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(null);

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should find a tool with this client id', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withOauth2Config().buildWithId();
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(externalToolDO);

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).rejects.toThrow(UnprocessableEntityException);
			});
		});

		describe('hasDuplicateAttributes', () => {
			it('should not find duplicate custom parameters', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withCustomParameters(2).buildWithId();

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('throw when external tool has duplicate custom parameter keys', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory
					.withCustomParameters(2, { name: 'sameKey' })
					.buildWithId();

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).rejects.toThrow(UnprocessableEntityException);
			});
		});

		describe('validateByRegex', () => {
			it('should validate the regular expression', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withCustomParameters(1).buildWithId();

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('throw when external tools has a faulty regular expression', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory
					.withCustomParameters(1, { regex: '[' })
					.buildWithId();

				const result: Promise<void> = service.validateCreate(externalToolDO);

				await expect(result).rejects.toThrow(UnprocessableEntityException);
			});
		});
	});

	describe('validateUpdate', () => {});
});
