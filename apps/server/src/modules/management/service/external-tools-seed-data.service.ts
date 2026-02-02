import { ErrorLoggable } from '@core/error/loggable';
import { Logger } from '@core/logger';
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
import { Inject, Injectable } from '@nestjs/common';
import { MANAGEMENT_SEED_DATA_CONFIG_TOKEN, ManagementSeedDataConfig } from '../management-seed-data.config';

@Injectable()
export class ExternalToolsSeedDataService {
	constructor(
		@Inject(MANAGEMENT_SEED_DATA_CONFIG_TOKEN) private readonly config: ManagementSeedDataConfig,
		@Inject(DefaultEncryptionService) private readonly encryptionService: EncryptionService,
		private readonly externalToolService: ExternalToolService,
		private readonly oauthProviderService: OauthProviderService,
		private readonly logger: Logger
	) {}

	public async import(): Promise<number> {
		const externalTools: ExternalTool[] = [];

		const nextcloudName: string | undefined = this.config.nextcloudSocialloginOidcInternalName;
		const {
			ctlSeedSecretOnlineDiaDeutsch: onlineDiaDeutschSecret,
			ctlSeedSecretOnlineDiaMathe: onlineDiaMatheSecret,
			ctlSeedSecretMerlin: merlinSecret,
			nextcloudBaseUrl,
			nextcloudClientId,
			nextcloudClientSecret,
			nextcloudScopes,
		} = this.config;
		if (nextcloudBaseUrl && nextcloudClientId && nextcloudClientSecret) {
			externalTools.push(
				new ExternalTool({
					id: '65f958bdd8b35469f14032b1',
					name: nextcloudName || 'SchulcloudNextcloud',
					config: new Oauth2ToolConfig({
						baseUrl: nextcloudBaseUrl,
						clientId: nextcloudClientId,
						clientSecret: nextcloudClientSecret,
						skipConsent: true,
						scope: nextcloudScopes || 'openid offline profile email groups',
						redirectUris: [`${nextcloudBaseUrl}/apps/user_oidc/code`],
						frontchannelLogoutUri: `${nextcloudBaseUrl}/apps/schulcloud/logout`,
						tokenEndpointAuthMethod: TokenEndpointAuthMethod.CLIENT_SECRET_POST,
					}),
					openNewTab: true,
					isHidden: true,
					isDeactivated: false,
					isPreferred: false,
				})
			);
		}

		if (onlineDiaDeutschSecret) {
			externalTools.push(
				new ExternalTool({
					id: '65fc1488e519d4a3b71193e4',
					name: 'Product Test Onlinediagnose Grundschule - Deutsch',
					url: 'https://onlinediagnose.westermann.de/',
					config: new Lti11ToolConfig({
						baseUrl:
							'https://route-resolver.test.services.bildungslogin.de/api/v1/lti11/launch/7ce9a5aa-e603-4abc-9c45-7bc454cc093a',
						key: 'https://route-resolver.test.services.bildungslogin.de/api/v1/lti11/launch/7ce9a5aa-e603-4abc-9c45-7bc454cc093a',
						secret: this.encryptionService.encrypt(onlineDiaDeutschSecret),
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
		}

		if (onlineDiaMatheSecret) {
			externalTools.push(
				new ExternalTool({
					id: '65fc15b5e519d4a3b71193e5',
					name: 'Product Test Onlinediagnose Grundschule - Mathematik',
					url: 'https://onlinediagnose.westermann.de/',
					config: new Lti11ToolConfig({
						baseUrl:
							'https://route-resolver.test.services.bildungslogin.de/api/v1/lti11/launch/7ce9a5aa-e603-4abc-9c45-7bc454cc093a',
						key: '7ce9a5aa-e603-4abc-9c45-7bc454cc093a',
						secret: this.encryptionService.encrypt(onlineDiaMatheSecret),
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
		}

		if (merlinSecret) {
			externalTools.push(
				new ExternalTool({
					id: '667e52a4162707ce02b9ac06',
					name: 'Merlin Bibliothek',
					url: 'https://nds.edupool.de',
					config: new Lti11ToolConfig({
						baseUrl: 'https://nds.edupool.de',
						key: 'xvD0eMHxEPsKI198',
						secret: this.encryptionService.encrypt(merlinSecret),
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
		}

		if (externalTools.length > 0) {
			await Promise.all(
				externalTools.map(async (externalTool: ExternalTool): Promise<void> => {
					if (ExternalTool.isOauth2Config(externalTool.config)) {
						try {
							await this.oauthProviderService.deleteOAuth2Client(externalTool.config.clientId);
						} catch (e) {
							this.logger.debug(new ErrorLoggable(e));
						}
					}

					await this.externalToolService.createExternalTool(externalTool);
				})
			);
		}

		return externalTools.length;
	}
}
