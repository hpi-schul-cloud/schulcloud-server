import { LegacySchoolService } from '@modules/legacy-school';
import {
	IdTokenExtractionFailureLoggableException,
	IdTokenUserNotFoundLoggableException,
} from '@modules/oauth/loggable';
import { RoleName } from '@modules/role';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { RoleReference } from '@shared/domain/domainobject';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import jwt from 'jsonwebtoken';
import { OauthDataDto, OauthDataStrategyInputDto, ProvisioningDto } from '../../dto';
import { ProvisioningStrategy } from '../base.strategy';
import { IservMapper } from './iserv-do.mapper';

@Injectable()
export class IservProvisioningStrategy extends ProvisioningStrategy {
	constructor(private readonly schoolService: LegacySchoolService, private readonly userService: UserService) {
		super();
	}

	public getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.ISERV;
	}

	public override async getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto> {
		const idToken = jwt.decode(input.idToken, { json: true });

		if (!idToken || !idToken.uuid) {
			throw new IdTokenExtractionFailureLoggableException('uuid');
		}

		const ldapUser = await this.userService.findByExternalId(idToken.uuid as string, input.system.systemId);
		if (!ldapUser) {
			const additionalInfo = await this.getAdditionalErrorInfo(idToken.email as string | undefined);
			throw new IdTokenUserNotFoundLoggableException(idToken?.uuid as string, additionalInfo);
		}

		const ldapSchool = await this.schoolService.getSchoolById(ldapUser.schoolId);
		const roleNames = ldapUser.roles.map((roleRef: RoleReference): RoleName => roleRef.name);

		const externalUser = IservMapper.mapToExternalUserDto(ldapUser, roleNames);
		const externalSchool = IservMapper.mapToExternalSchoolDto(ldapSchool);

		const oauthData = new OauthDataDto({
			system: input.system,
			externalUser,
			externalSchool,
		});
		return oauthData;
	}

	public override apply(data: OauthDataDto): Promise<ProvisioningDto> {
		return Promise.resolve(new ProvisioningDto({ externalUserId: data.externalUser?.externalId }));
	}

	public async getAdditionalErrorInfo(email: string | undefined): Promise<string> {
		if (email) {
			const usersWithEmail = await this.userService.findByEmail(email);
			if (usersWithEmail.length > 0) {
				const user = usersWithEmail[0];
				return ` [schoolId: ${user.schoolId}, currentLdapId: ${user.externalId ?? ''}]`;
			}
		}
		return '';
	}
}
