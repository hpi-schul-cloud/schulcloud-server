import { LegacySchoolService } from '@modules/legacy-school';
import {
	IdTokenExtractionFailureLoggableException,
	IdTokenUserNotFoundLoggableException,
} from '@modules/oauth/loggable';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { LegacySchoolDo, RoleReference, UserDO } from '@shared/domain/domainobject';
import { RoleName } from '@shared/domain/interface';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import jwt, { JwtPayload } from 'jsonwebtoken';
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
			throw new IdTokenExtractionFailureLoggableException('uuid');
		}

		const ldapUser: UserDO | null = await this.userService.findByExternalId(
			idToken.uuid as string,
			input.system.systemId
		);
		if (!ldapUser) {
			const additionalInfo: string = await this.getAdditionalErrorInfo(idToken.email as string | undefined);
			throw new IdTokenUserNotFoundLoggableException(idToken?.uuid as string, additionalInfo);
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
			const usersWithEmail: UserDO[] = await this.userService.findByEmail(email);
			if (usersWithEmail.length > 0) {
				const user: UserDO = usersWithEmail[0];
				return ` [schoolId: ${user.schoolId}, currentLdapId: ${user.externalId ?? ''}]`;
			}
		}
		return '';
	}
}
