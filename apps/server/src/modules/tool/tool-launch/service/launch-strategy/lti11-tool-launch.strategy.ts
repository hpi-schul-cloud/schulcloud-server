import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { ObjectId } from '@mikro-orm/mongodb';
import { PseudonymService } from '@modules/pseudonym/service';
import { RoleName } from '@modules/role';
import { UserService } from '@modules/user';
import { Inject, Injectable, InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { RoleReference } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { CustomParameterEntry } from '../../../common/domain';
import { LtiMessageType, LtiPrivacyPermission } from '../../../common/enum';
import { Lti11EncryptionService } from '../../../common/service';
import { LtiDeepLink, LtiMessageTypeNotImplementedLoggableException } from '../../../context-external-tool/domain';
import { LtiDeepLinkingService, LtiDeepLinkTokenService } from '../../../context-external-tool/service';
import { ExternalTool, Lti11ToolConfig } from '../../../external-tool/domain';
import { LtiRoleMapper } from '../../mapper';
import {
	AuthenticationValues,
	LaunchRequestMethod,
	LaunchType,
	PropertyData,
	PropertyLocation,
	ToolLaunchData,
	ToolLaunchRequest,
} from '../../types';
import {
	AutoContextIdStrategy,
	AutoContextNameStrategy,
	AutoGroupExternalUuidStrategy,
	AutoMediumIdStrategy,
	AutoSchoolIdStrategy,
	AutoSchoolNumberStrategy,
} from '../auto-parameter-strategy';
import { AbstractLaunchStrategy } from './abstract-launch.strategy';
import { ToolLaunchParams } from './tool-launch-params.interface';

@Injectable()
export class Lti11ToolLaunchStrategy extends AbstractLaunchStrategy {
	constructor(
		private readonly userService: UserService,
		private readonly pseudonymService: PseudonymService,
		private readonly lti11EncryptionService: Lti11EncryptionService,
		private readonly ltiDeepLinkTokenService: LtiDeepLinkTokenService,
		private readonly ltiDeepLinkingService: LtiDeepLinkingService,
		@Inject(DefaultEncryptionService) private readonly encryptionService: EncryptionService,
		autoSchoolIdStrategy: AutoSchoolIdStrategy,
		autoSchoolNumberStrategy: AutoSchoolNumberStrategy,
		autoContextIdStrategy: AutoContextIdStrategy,
		autoContextNameStrategy: AutoContextNameStrategy,
		autoMediumIdStrategy: AutoMediumIdStrategy,
		autoGroupExternalUuidStrategy: AutoGroupExternalUuidStrategy
	) {
		super(
			autoSchoolIdStrategy,
			autoSchoolNumberStrategy,
			autoContextIdStrategy,
			autoContextNameStrategy,
			autoMediumIdStrategy,
			autoGroupExternalUuidStrategy
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public override async buildToolLaunchDataFromConcreteConfig(
		userId: EntityId,
		data: ToolLaunchParams
	): Promise<PropertyData[]> {
		const { config } = data.externalTool;

		if (!ExternalTool.isLti11Config(config)) {
			throw new UnprocessableEntityException(
				`Unable to build LTI 1.1 launch data. Tool configuration is of type ${config.type}. Expected "lti11"`
			);
		}

		let properties: PropertyData[];
		switch (config.lti_message_type) {
			case LtiMessageType.BASIC_LTI_LAUNCH_REQUEST: {
				properties = await this.buildToolLaunchDataForLtiLaunch(
					userId,
					data,
					config,
					LtiMessageType.BASIC_LTI_LAUNCH_REQUEST
				);
				break;
			}
			case LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST: {
				if (!data.contextExternalTool.ltiDeepLink) {
					properties = await this.buildToolLaunchDataForContentItemSelectionRequest(userId, data, config);
				} else if (
					data.contextExternalTool.ltiDeepLink.mediaType === 'application/vnd.ims.lti.v1.ltilink' ||
					data.contextExternalTool.ltiDeepLink.mediaType === 'application/vnd.ims.lti.v1.ltiassignment'
				) {
					properties = await this.buildToolLaunchDataForLtiLaunch(
						userId,
						data,
						config,
						LtiMessageType.BASIC_LTI_LAUNCH_REQUEST
					);

					properties.push(...this.buildToolLaunchDataFromDeepLink(data.contextExternalTool.ltiDeepLink));
				} else {
					properties = [];
				}
				break;
			}
			default:
				throw new LtiMessageTypeNotImplementedLoggableException(config.lti_message_type);
		}

		return properties;
	}

	private async buildToolLaunchDataForContentItemSelectionRequest(
		userId: EntityId,
		data: ToolLaunchParams,
		config: Lti11ToolConfig
	): Promise<PropertyData[]> {
		if (!data.contextExternalTool.id) {
			throw new UnprocessableEntityException(
				'Cannot lauch a content selection request with a non-permanent context external tool'
			);
		}

		const additionalProperties = await this.buildToolLaunchDataForLtiLaunch(
			userId,
			data,
			config,
			LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST
		);

		const callbackUrl = this.ltiDeepLinkingService.getCallbackUrl(data.contextExternalTool.id);

		const ltiDeepLinkToken = await this.ltiDeepLinkTokenService.generateToken(userId);

		additionalProperties.push(
			new PropertyData({
				name: 'content_item_return_url',
				value: callbackUrl,
				location: PropertyLocation.BODY,
			}),
			new PropertyData({
				name: 'accept_media_types',
				value: '*/*',
				location: PropertyLocation.BODY,
			}),
			new PropertyData({
				name: 'accept_presentation_document_targets',
				value: 'window',
				location: PropertyLocation.BODY,
			}),
			new PropertyData({
				name: 'accept_unsigned',
				value: 'false',
				location: PropertyLocation.BODY,
			})
		);
		additionalProperties.push(
			new PropertyData({
				name: 'accept_multiple',
				value: 'false',
				location: PropertyLocation.BODY,
			}),
			new PropertyData({
				name: 'accept_copy_advice',
				value: 'false',
				location: PropertyLocation.BODY,
			}),
			new PropertyData({
				name: 'auto_create',
				value: 'true',
				location: PropertyLocation.BODY,
			}),
			new PropertyData({
				name: 'data',
				value: ltiDeepLinkToken.state,
				location: PropertyLocation.BODY,
			})
		);

		return additionalProperties;
	}

	private async buildToolLaunchDataForLtiLaunch(
		userId: EntityId,
		data: ToolLaunchParams,
		config: Lti11ToolConfig,
		lti_message_type: LtiMessageType
	): Promise<PropertyData[]> {
		const user = await this.userService.findById(userId);

		const roleNames = user.roles.map((roleRef: RoleReference): RoleName => roleRef.name);
		const ltiRoles = LtiRoleMapper.mapRolesToLtiRoles(roleNames);

		const decrypted = this.encryptionService.decrypt(config.secret);

		const additionalProperties = [
			new PropertyData({ name: 'key', value: config.key }),
			new PropertyData({ name: 'secret', value: decrypted }),

			new PropertyData({ name: 'lti_message_type', value: lti_message_type, location: PropertyLocation.BODY }),
			new PropertyData({ name: 'lti_version', value: 'LTI-1p0', location: PropertyLocation.BODY }),
			// When there is no persistent link to a resource, then generate a new one every time
			new PropertyData({
				name: 'resource_link_id',
				value: data.contextExternalTool.id || new ObjectId().toHexString(),
				location: PropertyLocation.BODY,
			}),
			new PropertyData({
				name: 'launch_presentation_document_target',
				value: 'window',
				location: PropertyLocation.BODY,
			}),
			new PropertyData({
				name: 'launch_presentation_locale',
				value: config.launch_presentation_locale,
				location: PropertyLocation.BODY,
			}),
		];

		if (config.privacy_permission !== LtiPrivacyPermission.ANONYMOUS) {
			additionalProperties.push(
				new PropertyData({
					name: 'roles',
					value: ltiRoles.join(','),
					location: PropertyLocation.BODY,
				})
			);
		}

		if (
			config.privacy_permission === LtiPrivacyPermission.NAME ||
			config.privacy_permission === LtiPrivacyPermission.PUBLIC
		) {
			const displayName = await this.userService.getDisplayName(user);

			additionalProperties.push(
				new PropertyData({
					name: 'lis_person_name_full',
					value: displayName,
					location: PropertyLocation.BODY,
				})
			);
		}

		if (
			config.privacy_permission === LtiPrivacyPermission.EMAIL ||
			config.privacy_permission === LtiPrivacyPermission.PUBLIC
		) {
			additionalProperties.push(
				new PropertyData({
					name: 'lis_person_contact_email_primary',
					value: user.email,
					location: PropertyLocation.BODY,
				})
			);
		}

		if (config.privacy_permission === LtiPrivacyPermission.PSEUDONYMOUS) {
			const pseudonym = await this.pseudonymService.findOrCreatePseudonym(user, data.externalTool);

			additionalProperties.push(
				new PropertyData({
					name: 'user_id',
					value: pseudonym.pseudonym,
					location: PropertyLocation.BODY,
				})
			);
		} else if (config.privacy_permission !== LtiPrivacyPermission.ANONYMOUS) {
			additionalProperties.push(
				new PropertyData({
					name: 'user_id',
					value: userId,
					location: PropertyLocation.BODY,
				})
			);
		} else {
			// Don't add a user_id, when the privacy is anonymous
		}

		return additionalProperties;
	}

	private buildToolLaunchDataFromDeepLink(deepLink: LtiDeepLink): PropertyData[] {
		const deepLinkProperties: PropertyData[] = [];

		deepLink.parameters.forEach((parameter: CustomParameterEntry): void => {
			if (parameter.value) {
				deepLinkProperties.push(
					new PropertyData({
						name: `custom_${parameter.name}`,
						value: parameter.value,
						location: PropertyLocation.BODY,
					})
				);
			}
		});

		return deepLinkProperties;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public override buildToolLaunchRequestPayload(url: string, properties: PropertyData[]): string | null {
		const bodyProperties = properties.filter((property: PropertyData) => property.location === PropertyLocation.BODY);
		const payload: Record<string, string> = {};

		for (const property of bodyProperties) {
			payload[property.name] = property.value;
		}

		const authentication = this.getAuthenticationValues(properties);

		const signedPayload = this.lti11EncryptionService.sign(
			authentication.keyValue,
			authentication.secretValue,
			url,
			payload
		);

		return JSON.stringify(signedPayload);
	}

	private getAuthenticationValues(properties: PropertyData[]): AuthenticationValues {
		const key = properties.find((property: PropertyData) => property.name === 'key');
		const secret = properties.find((property: PropertyData) => property.name === 'secret');

		if (!key || !secret) {
			throw new InternalServerErrorException(
				'Unable to build LTI 1.1 launch payload. "key" or "secret" is undefined in PropertyData'
			);
		}

		const authentication = new AuthenticationValues({
			keyValue: key.value,
			secretValue: secret.value,
		});

		return authentication;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public override determineLaunchRequestMethod(properties: PropertyData[]): LaunchRequestMethod {
		return LaunchRequestMethod.POST;
	}

	public override determineLaunchType(): LaunchType {
		return LaunchType.LTI11_BASIC_LAUNCH;
	}

	public override async createLaunchRequest(userId: EntityId, data: ToolLaunchParams): Promise<ToolLaunchRequest> {
		const launchData: ToolLaunchData = await this.createLaunchData(userId, data);
		const { ltiDeepLink } = data.contextExternalTool;

		let method: LaunchRequestMethod;
		let url: string;
		let payload: string | null;
		let launchType: LaunchType;
		let { openNewTab } = launchData;

		if (ltiDeepLink?.url) {
			url = ltiDeepLink?.url;
		} else {
			url = this.buildUrl(launchData);
		}

		const isLtiLaunch =
			!ltiDeepLink ||
			ltiDeepLink.mediaType === 'application/vnd.ims.lti.v1.ltilink' ||
			ltiDeepLink.mediaType === 'application/vnd.ims.lti.v1.ltiassignment';
		if (isLtiLaunch) {
			method = this.determineLaunchRequestMethod(launchData.properties);
			payload = this.buildToolLaunchRequestPayload(url, launchData.properties);
			launchType = this.determineLaunchType();
		} else {
			method = LaunchRequestMethod.GET;
			payload = null;
			launchType = LaunchType.BASIC;
		}

		const isContentItemSelectionRequest: boolean = data.externalTool.isLtiDeepLinkingTool() && !ltiDeepLink;
		if (isContentItemSelectionRequest) {
			openNewTab = true;
			launchType = LaunchType.LTI11_CONTENT_ITEM_SELECTION;
		}

		const toolLaunchRequest = new ToolLaunchRequest({
			method,
			url,
			payload: payload ?? undefined,
			openNewTab,
			launchType,
		});

		return toolLaunchRequest;
	}
}
