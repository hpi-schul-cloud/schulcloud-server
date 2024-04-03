import { PseudonymService } from '@modules/pseudonym/service';
import { UserService } from '@modules/user';
import { Injectable, InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { Pseudonym, RoleReference, UserDO } from '@shared/domain/domainobject';
import { RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Authorization } from 'oauth-1.0a';
import { LtiPrivacyPermission, LtiRole } from '../../../common/enum';
import { ExternalTool } from '../../../external-tool/domain';
import { LtiRoleMapper } from '../../mapper';
import { AuthenticationValues, LaunchRequestMethod, PropertyData, PropertyLocation } from '../../types';
import {
	AutoContextIdStrategy,
	AutoContextNameStrategy,
	AutoSchoolIdStrategy,
	AutoSchoolNumberStrategy,
	AutoMediumIdStrategy,
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

		if (!data.contextExternalTool.id) {
			throw new InternalServerErrorException();
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
				value: data.contextExternalTool.id,
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

		return additionalProperties;
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
}
