import { ErrorLoggable } from '@core/error/loggable';
import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { OauthProviderService } from '@modules/oauth-provider/domain';
import { ExternalTool, ExternalToolService, Lti11ToolConfig, Oauth2ToolConfig } from '@modules/tool';
import { CustomParameter } from '@modules/tool/common/domain';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	LtiMessageType,
	LtiPrivacyPermission,
	TokenEndpointAuthMethod,
	ToolContextType,
} from '@modules/tool/common/enum';
import { Test, TestingModule } from '@nestjs/testing';
import { MANAGEMENT_SEED_DATA_CONFIG_TOKEN, ManagementSeedDataConfig } from '../management-seed-data.config';
import { ExternalToolsSeedDataService } from './external-tools-seed-data.service';

describe(ExternalToolsSeedDataService.name, () => {
	let module: TestingModule;
	let service: ExternalToolsSeedDataService;

	let config: ManagementSeedDataConfig;
	let encryptionService: DeepMocked<EncryptionService>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let oauthProviderService: DeepMocked<OauthProviderService>;
	let logger: DeepMocked<Logger>;

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
		oauthProviderService = module.get(OauthProviderService);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('import', () => {
		describe('when the nextcloud variables are defined', () => {
			const setup = () => {
				const clientId = 'Nextcloud_id';
				config.nextcloudSocialloginOidcInternalName = 'SchulcloudNextcloud';
				config.nextcloudBaseUrl = 'https://nextcloud.localhost:9090';
				config.nextcloudClientId = clientId;
				config.nextcloudClientSecret = 'Nextcloud_secret';
				config.nextcloudScopes = 'openid';
				config.ctlSeedSecretOnlineDiaDeutsch = 'deutsch_secret';
				config.ctlSeedSecretOnlineDiaMathe = 'mathe_secret';
				config.ctlSeedSecretMerlin = 'merlin_secret';

				const error = new Error('Client not found');
				oauthProviderService.deleteOAuth2Client.mockRejectedValueOnce(error);
				encryptionService.encrypt.mockReturnValueOnce('encrypted_deutsch_secret');
				encryptionService.encrypt.mockReturnValueOnce('encrypted_mathe_secret');
				encryptionService.encrypt.mockReturnValueOnce('encrypted_merlin_secret');

				return {
					clientId,
					error,
				};
			};

			it('should should delete any remaining oauth2 nextcloud clients', async () => {
				const { clientId } = setup();

				await service.import();

				expect(oauthProviderService.deleteOAuth2Client).toHaveBeenCalledWith(clientId);
			});

			it('should should log an error if no client had to be deleted', async () => {
				const { error } = setup();

				await service.import();

				expect(logger.debug).toHaveBeenCalledWith(new ErrorLoggable(error));
			});

			it('should import nextcloud', async () => {
				setup();

				await service.import();

				expect(externalToolService.createExternalTool).toHaveBeenCalledWith<[ExternalTool]>(
					new ExternalTool({
						id: '65f958bdd8b35469f14032b1',
						name: 'SchulcloudNextcloud',
						config: new Oauth2ToolConfig({
							baseUrl: 'https://nextcloud.localhost:9090',
							clientId: 'Nextcloud_id',
							clientSecret: 'Nextcloud_secret',
							skipConsent: true,
							scope: 'openid',
							redirectUris: ['https://nextcloud.localhost:9090/apps/user_oidc/code'],
							frontchannelLogoutUri: 'https://nextcloud.localhost:9090/apps/schulcloud/logout',
							tokenEndpointAuthMethod: TokenEndpointAuthMethod.CLIENT_SECRET_POST,
						}),
						openNewTab: true,
						isHidden: true,
						isDeactivated: false,
						isPreferred: false,
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
