import { Injectable, InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { EntityId, LtiPrivacyPermission, Pseudonym, RoleName, UserDO } from '@shared/domain';
import { RoleReference } from '@shared/domain/domainobject';
import { CourseRepo } from '@shared/repo';
import { PseudonymService } from '@src/modules/pseudonym';
import { SchoolService } from '@src/modules/school';
import { UserService } from '@src/modules/user';
import { Authorization } from 'oauth-1.0a';
import { LtiRoleMapper } from '../../mapper';
import { LaunchRequestMethod, PropertyData, PropertyLocation } from '../../types';
import { Lti11EncryptionService } from '../lti11-encryption.service';
import { AbstractLaunchStrategy } from './abstract-launch.strategy';
import { IToolLaunchParams } from './tool-launch-params.interface';
import { ExternalToolDO } from '../../../external-tool/domainobject';
import { LtiRole } from '../../../common/enum';

@Injectable()
export class Lti11ToolLaunchStrategy extends AbstractLaunchStrategy {
	constructor(
		private readonly userService: UserService,
		private readonly pseudonymService: PseudonymService,
		private readonly lti11EncryptionService: Lti11EncryptionService,
		schoolService: SchoolService,
		courseRepo: CourseRepo
	) {
		super(schoolService, courseRepo);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public override async buildToolLaunchDataFromConcreteConfig(
		userId: EntityId,
		data: IToolLaunchParams
	): Promise<PropertyData[]> {
		const { config } = data.externalToolDO;
		const contextId: EntityId = data.contextExternalToolDO.contextRef.id;

		if (!ExternalToolDO.isLti11Config(config)) {
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
				value: 'de-DE',
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
			const pseudonym: Pseudonym = await this.pseudonymService.findOrCreatePseudonym(user, data.externalToolDO);

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
	public override buildToolLaunchRequestPayload(url: string, properties: PropertyData[]): string | null {
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

		const signedPayload: Authorization = this.lti11EncryptionService.sign(key.value, secret.value, url, payload);

		return JSON.stringify(signedPayload);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public override determineLaunchRequestMethod(properties: PropertyData[]): LaunchRequestMethod {
		return LaunchRequestMethod.POST;
	}
}
