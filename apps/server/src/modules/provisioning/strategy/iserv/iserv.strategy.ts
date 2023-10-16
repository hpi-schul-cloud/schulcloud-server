import { Injectable } from '@nestjs/common';
import { LegacySchoolDo, RoleName, RoleReference, User, UserDO } from '@shared/domain';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { LegacySchoolService } from '@src/modules/legacy-school';
import { UserService } from '@src/modules/user';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { OAuthSSOError } from '@src/modules/oauth/loggable';
import {
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
	ProvisioningDto,
} from '../../dto';
import { ProvisioningStrategy } from '../base.strategy';
import { IservMapper } from './iserv-do.mapper';

@Injectable()
export class IservProvisioningStrategy extends ProvisioningStrategy {
	constructor(private readonly schoolService: LegacySchoolService, private readonly userService: UserService) {
		super();
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.ISERV;
	}

	override async getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto> {
		const idToken: JwtPayload | null = jwt.decode(input.idToken, { json: true });

		if (!idToken || !idToken.uuid) {
			throw new OAuthSSOError('Failed to extract uuid', 'sso_jwt_problem');
		}

		const ldapUser: UserDO | null = await this.userService.findByExternalId(
			idToken.uuid as string,
			input.system.systemId
		);
		if (!ldapUser) {
			const additionalInfo: string = await this.getAdditionalErrorInfo(idToken.email as string | undefined);
			throw new OAuthSSOError(
				`Failed to find user with Id ${idToken.uuid as string}${additionalInfo}`,
				'sso_user_notfound'
			);
		}

		const ldapSchool: LegacySchoolDo = await this.schoolService.getSchoolById(ldapUser.schoolId);
		const roleNames: RoleName[] = ldapUser.roles.map((roleRef: RoleReference): RoleName => roleRef.name);

		const externalUser: ExternalUserDto = IservMapper.mapToExternalUserDto(ldapUser, roleNames);
		const externalSchool: ExternalSchoolDto = IservMapper.mapToExternalSchoolDto(ldapSchool);

		const oauthData: OauthDataDto = new OauthDataDto({
			system: input.system,
			externalUser,
			externalSchool,
		});
		return oauthData;
	}

	override apply(data: OauthDataDto): Promise<ProvisioningDto> {
		return Promise.resolve(new ProvisioningDto({ externalUserId: data.externalUser?.externalId }));
	}

	async getAdditionalErrorInfo(email: string | undefined): Promise<string> {
		if (email) {
			const usersWithEmail: User[] = await this.userService.findByEmail(email);
			if (usersWithEmail.length > 0) {
				const user: User = usersWithEmail[0];
				return ` [schoolId: ${user.school.id}, currentLdapId: ${user.externalId ?? ''}]`;
			}
		}
		return '';
	}
}
