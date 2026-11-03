import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, type EncryptionService } from '@infra/encryption';
import { Logger } from '@infra/logger';
import { OauthProviderService } from '@modules/oauth-provider/domain';
import { ExternalTool, ExternalToolService, Lti11ToolConfig } from '@modules/tool';
import { CustomParameter } from '@modules/tool/common/domain';
import { ExternalToolMediumStatus } from '@modules/tool/external-tool/enum';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	LtiMessageType,
	LtiPrivacyPermission,
	ToolContextType,
} from '@modules/tool/common/enum';
import { Test, type TestingModule } from '@nestjs/testing';
import { MANAGEMENT_SEED_DATA_CONFIG_TOKEN, type ManagementSeedDataConfig } from '../management-seed-data.config';
import { ExternalToolsSeedDataService } from './external-tools-seed-data.service';

describe(ExternalToolsSeedDataService.name, () => {
	let module: TestingModule;
	let service: ExternalToolsSeedDataService;

	let config: ManagementSeedDataConfig;
	let encryptionService: DeepMocked<EncryptionService>;
	let externalToolService: DeepMocked<ExternalToolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ExternalToolsSeedDataService,
				{
					provide: MANAGEMENT_SEED_DATA_CONFIG_TOKEN,
					useValue: {},
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: OauthProviderService,
					useValue: createMock<OauthProviderService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolsSeedDataService);
		config = module.get(MANAGEMENT_SEED_DATA_CONFIG_TOKEN);
		encryptionService = module.get(DefaultEncryptionService);
		externalToolService = module.get(ExternalToolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('import', () => {
		describe('when the bilo variables are defined', () => {
			const setup = () => {
				config.ctlSeedSecretOnlineDiaDeutsch = 'deutsch_secret';
				config.ctlSeedSecretOnlineDiaMathe = 'mathe_secret';
				config.ctlSeedSecretMerlin = 'merlin_secret';
				config.ctlSeedBiloLtiKey = 'bilo_lti_key';
				config.ctlSeedBiloLtiSecret = 'bilo_lti_secret';

				encryptionService.encrypt.mockReturnValueOnce('encrypted_bilo_lti_secret');
				encryptionService.encrypt.mockReturnValueOnce('encrypted_deutsch_secret');
				encryptionService.encrypt.mockReturnValueOnce('encrypted_mathe_secret');
				encryptionService.encrypt.mockReturnValueOnce('encrypted_merlin_secret');

				return {};
			};

			it('should import the Bildungslogin template', async () => {
				setup();

				await service.import();

				expect(externalToolService.createExternalTool).toHaveBeenCalledWith<[ExternalTool]>(
					new ExternalTool({
						id: '6859557bb36d9e807dfeeb87',
						name: 'BiLo - Template',
						config: new Lti11ToolConfig({
							baseUrl: 'https://route-resolver.test.services.bildungslogin.de/api/v1/lti11/launch/bilo_lti_key',
							key: 'bilo_lti_key',
							secret: 'encrypted_bilo_lti_secret',
							lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
							privacy_permission: LtiPrivacyPermission.ANONYMOUS,
							launch_presentation_locale: 'de-DE',
						}),
						openNewTab: true,
						isHidden: false,
						isDeactivated: false,
						isPreferred: false,
						parameters: [
							new CustomParameter({
								name: 'custom_product_id',
								displayName: 'BiLo Produktkennung / Produktcode',
								scope: CustomParameterScope.GLOBAL,
								location: CustomParameterLocation.BODY,
								type: CustomParameterType.AUTO_MEDIUMID,
								isOptional: false,
								isProtected: false,
							}),
							new CustomParameter({
								name: 'custom_publisher_identifier',
								displayName: 'Verlagskürzel',
								scope: CustomParameterScope.GLOBAL,
								location: CustomParameterLocation.BODY,
								type: CustomParameterType.AUTO_PUBLISHER,
								isOptional: false,
								isProtected: false,
							}),
						],
						medium: {
							status: ExternalToolMediumStatus.TEMPLATE,
							mediaSourceId: 'urn:bilo:medium',
						},
					})
				);
			});

			it('should import Product Test Onlinediagnose Grundschule - Deutsch', async () => {
				setup();

				await service.import();

				expect(externalToolService.createExternalTool).toHaveBeenCalledWith<[ExternalTool]>(
					new ExternalTool({
						id: '65fc1488e519d4a3b71193e4',
						name: 'Product Test Onlinediagnose Grundschule - Deutsch',
						url: 'https://onlinediagnose.westermann.de/',
						config: new Lti11ToolConfig({
							baseUrl:
								'https://route-resolver.test.services.bildungslogin.de/api/v1/lti11/launch/7ce9a5aa-e603-4abc-9c45-7bc454cc093a',
							key: 'https://route-resolver.test.services.bildungslogin.de/api/v1/lti11/launch/7ce9a5aa-e603-4abc-9c45-7bc454cc093a',
							secret: 'encrypted_deutsch_secret',
							lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
							privacy_permission: LtiPrivacyPermission.ANONYMOUS,
							launch_presentation_locale: 'de-DE',
						}),
						openNewTab: true,
						isHidden: false,
						isDeactivated: false,
						isPreferred: false,
						parameters: [
							new CustomParameter({
								name: 'context_id',
								displayName: 'Kontext Id',
								scope: CustomParameterScope.GLOBAL,
								location: CustomParameterLocation.BODY,
								type: CustomParameterType.AUTO_CONTEXTID,
								isOptional: false,
								isProtected: false,
							}),
							new CustomParameter({
								name: 'context_title',
								displayName: 'Kontext Name',
								scope: CustomParameterScope.GLOBAL,
								location: CustomParameterLocation.BODY,
								type: CustomParameterType.AUTO_CONTEXTNAME,
								isOptional: false,
								isProtected: false,
							}),
							new CustomParameter({
								name: 'context_type',
								displayName: 'Kontext Typ',
								default: 'Group',
								scope: CustomParameterScope.GLOBAL,
								location: CustomParameterLocation.BODY,
								type: CustomParameterType.STRING,
								isOptional: false,
								isProtected: false,
							}),
							new CustomParameter({
								name: 'custom_product_id',
								displayName: 'Produkt Id',
								default: 'urn:bilo:medium:WEB-507-08040',
								scope: CustomParameterScope.GLOBAL,
								location: CustomParameterLocation.BODY,
								type: CustomParameterType.STRING,
								isOptional: false,
								isProtected: false,
							}),
						],
					})
				);
			});

			it('should import Product Test Onlinediagnose Grundschule - Mathematik', async () => {
				setup();

				await service.import();

				expect(externalToolService.createExternalTool).toHaveBeenCalledWith<[ExternalTool]>(
					new ExternalTool({
						id: '65fc15b5e519d4a3b71193e5',
						name: 'Product Test Onlinediagnose Grundschule - Mathematik',
						url: 'https://onlinediagnose.westermann.de/',
						config: new Lti11ToolConfig({
							baseUrl:
								'https://route-resolver.test.services.bildungslogin.de/api/v1/lti11/launch/7ce9a5aa-e603-4abc-9c45-7bc454cc093a',
							key: '7ce9a5aa-e603-4abc-9c45-7bc454cc093a',
							secret: 'encrypted_mathe_secret',
							lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
							privacy_permission: LtiPrivacyPermission.ANONYMOUS,
							launch_presentation_locale: 'de-DE',
						}),
						openNewTab: true,
						isHidden: false,
						isDeactivated: false,
						isPreferred: false,
						parameters: [
							new CustomParameter({
								name: 'context_id',
								displayName: 'Kontext Id',
								scope: CustomParameterScope.GLOBAL,
								location: CustomParameterLocation.BODY,
								type: CustomParameterType.AUTO_CONTEXTID,
								isOptional: false,
								isProtected: false,
							}),
							new CustomParameter({
								name: 'context_title',
								displayName: 'Kontext Name',
								scope: CustomParameterScope.GLOBAL,
								location: CustomParameterLocation.BODY,
								type: CustomParameterType.AUTO_CONTEXTNAME,
								isOptional: false,
								isProtected: false,
							}),
							new CustomParameter({
								name: 'context_type',
								displayName: 'Kontext Typ',
								default: 'Group',
								scope: CustomParameterScope.GLOBAL,
								location: CustomParameterLocation.BODY,
								type: CustomParameterType.STRING,
								isOptional: false,
								isProtected: false,
							}),
							new CustomParameter({
								name: 'custom_product_id',
								displayName: 'Produkt Id',
								default: 'urn:bilo:medium:WEB-507-08041',
								scope: CustomParameterScope.GLOBAL,
								location: CustomParameterLocation.BODY,
								type: CustomParameterType.STRING,
								isOptional: false,
								isProtected: false,
							}),
						],
					})
				);
			});

			it('should import Merlin Bibliothek', async () => {
				setup();

				await service.import();

				expect(externalToolService.createExternalTool).toHaveBeenCalledWith<[ExternalTool]>(
					new ExternalTool({
						id: '667e52a4162707ce02b9ac06',
						name: 'Merlin Bibliothek',
						url: 'https://nds.edupool.de',
						config: new Lti11ToolConfig({
							baseUrl: 'https://nds.edupool.de',
							key: 'xvD0eMHxEPsKI198',
							secret: 'encrypted_merlin_secret',
							lti_message_type: LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST,
							privacy_permission: LtiPrivacyPermission.ANONYMOUS,
							launch_presentation_locale: 'de-DE',
						}),
						restrictToContexts: [ToolContextType.BOARD_ELEMENT, ToolContextType.COURSE],
						openNewTab: true,
						isHidden: false,
						isDeactivated: false,
						isPreferred: true,
						iconName: 'mdiMovieRoll',
					})
				);
			});

			it('should return 4', async () => {
				setup();

				const result = await service.import();

				expect(result).toEqual(4);
			});
		});
	});
});
