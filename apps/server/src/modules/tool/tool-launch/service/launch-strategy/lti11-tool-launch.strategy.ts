import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ObjectId } from '@mikro-orm/mongodb';
import { PseudonymService } from '@modules/pseudonym/service';
import { UserService } from '@modules/user';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { Pseudonym, RoleReference, UserDO } from '@shared/domain/domainobject';
import { RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { UUID } from 'bson';
import { Cache } from 'cache-manager';
import { Authorization } from 'oauth-1.0a';
import { CustomParameterEntry } from '../../../common/domain';
import { LtiMessageType, LtiPrivacyPermission, LtiRole } from '../../../common/enum';
import { LtiDeepLink } from '../../../context-external-tool/domain/lti-deep-link';
import { ExternalTool, Lti11ToolConfig } from '../../../external-tool/domain';
import { LtiRoleMapper } from '../../mapper';
import {
	AuthenticationValues,
	LaunchRequestMethod,
	PropertyData,
	PropertyLocation,
	ToolLaunchRequest,
} from '../../types';
import {
	AutoContextIdStrategy,
	AutoContextNameStrategy,
	AutoMediumIdStrategy,
	AutoSchoolIdStrategy,
	AutoSchoolNumberStrategy,
} from '../auto-parameter-strategy';
import { Lti11EncryptionService } from '../lti11-encryption.service';
import { AbstractLaunchStrategy } from './abstract-launch.strategy';
import { ToolLaunchParams } from './tool-launch-params.interface';

@Injectable()
export class Lti11ToolLaunchStrategy extends AbstractLaunchStrategy {
	constructor(
		private readonly userService: UserService,
		private readonly pseudonymService: PseudonymService,
		private readonly lti11EncryptionService: Lti11EncryptionService,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		autoSchoolIdStrategy: AutoSchoolIdStrategy,
		autoSchoolNumberStrategy: AutoSchoolNumberStrategy,
		autoContextIdStrategy: AutoContextIdStrategy,
		autoContextNameStrategy: AutoContextNameStrategy,
		autoMediumIdStrategy: AutoMediumIdStrategy
	) {
		super(
			autoSchoolIdStrategy,
			autoSchoolNumberStrategy,
			autoContextIdStrategy,
			autoContextNameStrategy,
			autoMediumIdStrategy
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
		if (
			config.lti_message_type === LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST &&
			!data.contextExternalTool.ltiDeepLink
		) {
			properties = await this.buildToolLaunchDataForContentItemSelectionRequest(userId, data, config);
		} else if (
			data.contextExternalTool.ltiDeepLink &&
			data.contextExternalTool.ltiDeepLink.mediaType !== 'application/vnd.ims.lti.v1.ltilink' &&
			data.contextExternalTool.ltiDeepLink.mediaType !== 'application/vnd.ims.lti.v1.ltiassignment'
		) {
			properties = [];
		} else {
			properties = await this.buildToolLaunchDataForLtiLaunch(
				userId,
				data,
				config,
				LtiMessageType.BASIC_LTI_LAUNCH_REQUEST
			);
		}

		return properties;
	}

	private async buildToolLaunchDataForContentItemSelectionRequest(
		userId: EntityId,
		data: ToolLaunchParams,
		config: Lti11ToolConfig
	): Promise<PropertyData[]> {
		if (!data.contextExternalTool.id) {
			throw new Error('Cannot lauch a content selection request with a non-permanent context external tool');
		}

		const additionalProperties: PropertyData[] = await this.buildToolLaunchDataForLtiLaunch(
			userId,
			data,
			config,
			LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST
		);

		const publicBackendUrl = Configuration.get('PUBLIC_BACKEND_URL') as string;
		const callbackUrl = `${publicBackendUrl}/v3/tools/context-external-tools/${data.contextExternalTool.id}/lti11-deep-link-callback`;

		const state = new UUID().toString();
		await this.cacheManager.set(state, userId, 600000);

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
			}),
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
				value: state,
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
		const user: UserDO = await this.userService.findById(userId);

		const roleNames: RoleName[] = user.roles.map((roleRef: RoleReference): RoleName => roleRef.name);
		const ltiRoles: LtiRole[] = LtiRoleMapper.mapRolesToLtiRoles(roleNames);

		const additionalProperties: PropertyData[] = [
			new PropertyData({ name: 'key', value: config.key }),
			new PropertyData({ name: 'secret', value: config.secret }),

			new PropertyData({
				name: 'lti_message_type',
				value: lti_message_type,
				location: PropertyLocation.BODY,
			}),
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
			const displayName: string = await this.userService.getDisplayName(user);

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
			const pseudonym: Pseudonym = await this.pseudonymService.findOrCreatePseudonym(user, data.externalTool);

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

		if (data.contextExternalTool.ltiDeepLink) {
			additionalProperties.push(...this.buildToolLaunchDataFromDeepLink(data.contextExternalTool.ltiDeepLink));
		}

		return additionalProperties;
	}

	private buildToolLaunchDataFromDeepLink(deepLink: LtiDeepLink): PropertyData[] {
		const deepLinkProperties: PropertyData[] = [];

		deepLink.parameters.forEach((parameter: CustomParameterEntry): void => {
			if (parameter.value) {
				deepLinkProperties.push(
					new PropertyData({
						name: parameter.name,
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
		const bodyProperties: PropertyData[] = properties.filter(
			(property: PropertyData) => property.location === PropertyLocation.BODY
		);
		const payload: Record<string, string> = {};

		for (const property of bodyProperties) {
			payload[property.name] = property.value;
		}

		const authentication: AuthenticationValues = this.getAuthenticationValues(properties);

		const signedPayload: Authorization = this.lti11EncryptionService.sign(
			authentication.keyValue,
			authentication.secretValue,
			url,
			payload
		);

		return JSON.stringify(signedPayload);
	}

	private getAuthenticationValues(properties: PropertyData[]): AuthenticationValues {
		const key: PropertyData | undefined = properties.find((property: PropertyData) => property.name === 'key');
		const secret: PropertyData | undefined = properties.find((property: PropertyData) => property.name === 'secret');

		if (!key || !secret) {
			throw new InternalServerErrorException(
				'Unable to build LTI 1.1 launch payload. "key" or "secret" is undefined in PropertyData'
			);
		}

		const authentication: AuthenticationValues = new AuthenticationValues({
			keyValue: key.value,
			secretValue: secret.value,
		});

		return authentication;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public override determineLaunchRequestMethod(properties: PropertyData[]): LaunchRequestMethod {
		return LaunchRequestMethod.POST;
	}

	public override async createLaunchRequest(userId: EntityId, data: ToolLaunchParams): Promise<ToolLaunchRequest> {
		const request: ToolLaunchRequest = await super.createLaunchRequest(userId, data);

		if (
			ExternalTool.isLti11Config(data.externalTool.config) &&
			data.externalTool.config.lti_message_type === LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST &&
			!data.contextExternalTool.ltiDeepLink
		) {
			request.openNewTab = true;
		}

		if (data.contextExternalTool.ltiDeepLink?.url) {
			request.url = data.contextExternalTool.ltiDeepLink.url;
		}

		if (
			data.contextExternalTool.ltiDeepLink &&
			data.contextExternalTool.ltiDeepLink.mediaType !== 'application/vnd.ims.lti.v1.ltilink' &&
			data.contextExternalTool.ltiDeepLink.mediaType !== 'application/vnd.ims.lti.v1.ltiassignment'
		) {
			request.method = LaunchRequestMethod.GET;
		}

		return request;
	}
}
