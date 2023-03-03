import { Injectable } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { RoleName, User } from '@shared/domain';
import { UserService } from '@src/modules/user';
import { SchoolService } from '@src/modules/school';
import {
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
	ProvisioningDto,
} from '../../dto';
import { ProvisioningStrategy } from '../base.strategy';
import { IservMapper } from './iserv-do.mapper';
import { RoleDto } from '../../../role/service/dto/role.dto';
import { RoleService } from '../../../role';

@Injectable()
export class IservProvisioningStrategy extends ProvisioningStrategy {
	constructor(
		private readonly roleService: RoleService,
		private readonly schoolService: SchoolService,
		private readonly userService: UserService
	) {
		super();
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.ISERV;
	}

	override async getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto> {
		const idToken: JwtPayload | null = jwt.decode(input.idToken, { json: true });

		let externalUser: ExternalUserDto;

		if (idToken && idToken.uuid) {
			const existingUser: UserDO | null = await this.userService.findByExternalId(
				idToken.uuid as string,
				input.system.systemId
			);

			if (!existingUser) {
				const additionalInfo: string = await this.getAdditionalErrorInfo(idToken.email as string | undefined);
				throw new OAuthSSOError(
					`Failed to find user with Id ${idToken.uuid as string} ${additionalInfo}`,
					'sso_user_notfound'
				);
			}

			if (existingUser) {
				const roleDtos: RoleDto[] = await this.roleService.findByIds(existingUser.roleIds);
				const roleNames: RoleName[] = roleDtos.map((role) => role.name);

				externalUser = IservMapper.mapToExternalUserDto(existingUser, roleNames);
				if (externalUser.schoolId) {
					const school: SchoolDO = await this.schoolService.getSchoolById(externalUser.schoolId);
					const externalSchool: ExternalSchoolDto = IservMapper.mapToExternalSchoolDto(school);
					const oauthData: OauthDataDto = new OauthDataDto({
						system: input.system,
						externalUser,
						externalSchool,
					});

					return oauthData;
				}
			}
		}
		throw new OAuthSSOError('Failed to extract uuid', 'sso_jwt_problem');
	}

	override apply(data: OauthDataDto): Promise<ProvisioningDto> {
		return Promise.resolve(new ProvisioningDto({ externalUserId: data.externalUser?.externalId }));
	}

	async getAdditionalErrorInfo(email: string | undefined): Promise<string> {
		if (email) {
			const usersWithEmail: User[] = await this.userService.findByEmail(email);
			const user = usersWithEmail && usersWithEmail.length > 0 ? usersWithEmail[0] : undefined;
			return ` [schoolId: ${user?.school.id ?? ''}, currentLdapId: ${user?.externalId ?? ''}]`;
		}
		return '';
	}
}
