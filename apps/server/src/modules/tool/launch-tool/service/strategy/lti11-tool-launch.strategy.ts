import { Injectable, InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { EntityId, LtiPrivacyPermission, PseudonymDO, RoleName, UserDO } from '@shared/domain';
import { RoleReference } from '@shared/domain/domainobject/role-reference';
import { PseudonymService } from '@src/modules/pseudonym/service/pseudonym.service';
import { UserService } from '@src/modules/user';
import CryptoJS from 'crypto-js';
import OAuth, { Authorization, RequestOptions } from 'oauth-1.0a';
import { LtiRole } from '../../../interface';
import { ExternalToolService } from '../../../service';
import { LtiRoleMapper } from '../../mapper';
import { LaunchRequestMethod, PropertyData, PropertyLocation } from '../../types';
import { AbstractLaunchStrategy } from './abstract-launch.strategy';
import { IToolLaunchParams } from './tool-launch-params.interface';

@Injectable()
export class Lti11ToolLaunchStrategy extends AbstractLaunchStrategy {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly userService: UserService,
		private readonly pseudonymService: PseudonymService
	) {
		super();
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public override async buildToolLaunchDataFromConcreteConfig(
		userId: EntityId,
		data: IToolLaunchParams
	): Promise<PropertyData[]> {
		const { config } = data.externalToolDO;
		const { contextId } = data.contextExternalToolDO;

		const toolId: EntityId = data.externalToolDO.id as EntityId;

		if (!this.externalToolService.isLti11Config(config)) {
			throw new UnprocessableEntityException(
				`Unable to build LTI 1.1 launch data. Tool configuration is of type ${config.type}. Expected "lti11"`
			);
		}

		const user: UserDO = await this.userService.findById(userId);

		const roleNames: RoleName[] = user.roles.map((roleRef: RoleReference): RoleName => roleRef.name);
		const ltiRoles: LtiRole[] = LtiRoleMapper.mapRolesToLtiRoles(roleNames);

		const additionalProperties: PropertyData[] = [
			new PropertyData({ name: 'key', value: config.key }),
			new PropertyData({ name: 'secret', value: config.secret }),

			new PropertyData({ name: 'lti_message_type', value: config.lti_message_type, location: PropertyLocation.BODY }),
			new PropertyData({ name: 'lti_version', value: 'LTI-1p0', location: PropertyLocation.BODY }),
			new PropertyData({
				name: 'resource_link_id',
				value: config.resource_link_id || contextId,
				location: PropertyLocation.BODY,
			}),
			new PropertyData({
				name: 'launch_presentation_document_target',
				value: 'window',
				location: PropertyLocation.BODY,
			}),
			new PropertyData({
				name: 'launch_presentation_locale',
				value: 'en',
				location: PropertyLocation.BODY,
			}),
			new PropertyData({
				name: 'roles',
				value: ltiRoles.join(','),
				location: PropertyLocation.BODY,
			}),
		];

		if (config.privacy_permission === LtiPrivacyPermission.NAME) {
			const displayName: string = await this.userService.getDisplayName(user);

			additionalProperties.push(
				new PropertyData({
					name: 'lis_person_name_full',
					value: displayName,
					location: PropertyLocation.BODY,
				})
			);
		}

		if (config.privacy_permission === LtiPrivacyPermission.EMAIL) {
			additionalProperties.push(
				new PropertyData({
					name: 'lis_person_contact_email_primary',
					value: user.email,
					location: PropertyLocation.BODY,
				})
			);
		}

		if (config.privacy_permission === LtiPrivacyPermission.PSEUDONYMOUS) {
			const pseudonym: PseudonymDO = await this.pseudonymService.findByUserIdAndToolId(userId, toolId);

			additionalProperties.push(
				new PropertyData({
					name: 'user_id',
					value: pseudonym.pseudonym,
					location: PropertyLocation.BODY,
				})
			);
		} else {
			additionalProperties.push(
				new PropertyData({
					name: 'user_id',
					value: userId,
					location: PropertyLocation.BODY,
				})
			);
		}

		return additionalProperties;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public override buildToolLaunchRequestPayload(url: string, properties: PropertyData[]): string {
		const bodyProperties: PropertyData[] = properties.filter(
			(property: PropertyData) => property.location === PropertyLocation.BODY
		);
		const payload: Record<string, string> = {};

		for (const property of bodyProperties) {
			payload[property.name] = property.value;
		}

		const key: PropertyData | undefined = properties.find((property: PropertyData) => property.name === 'key');
		const secret: PropertyData | undefined = properties.find((property: PropertyData) => property.name === 'secret');

		if (!key || !secret) {
			throw new InternalServerErrorException(
				'Unable to build LTI 1.1 launch payload. "key" or "secret" is undefined in PropertyData'
			);
		}

		const encryptedPayload: Authorization = this.encryptWithOAuth1(key.value, secret.value, url, payload);

		return JSON.stringify(encryptedPayload);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public override determineLaunchRequestMethod(properties: PropertyData[]): LaunchRequestMethod {
		return LaunchRequestMethod.POST;
	}

	private encryptWithOAuth1(key: string, secret: string, url: string, payload: Record<string, string>): Authorization {
		const requestData: RequestOptions = {
			url,
			method: 'POST',
			data: payload,
		};

		const consumer: OAuth = this.createConsumer(key, secret);

		const authorization: Authorization = consumer.authorize(requestData);

		return authorization;
	}

	private createConsumer(ltiKey: string, ltiSecret: string): OAuth {
		const oauth: OAuth = new OAuth({
			consumer: {
				key: ltiKey,
				secret: ltiSecret,
			},
			signature_method: 'HMAC-SHA1',
			hash_function: (base_string: string, key: string) =>
				CryptoJS.HmacSHA1(base_string, key).toString(CryptoJS.enc.Base64),
		});
		return oauth;
	}
}
