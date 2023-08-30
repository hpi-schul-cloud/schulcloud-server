import { Injectable } from '@nestjs/common';
import { LegacySchoolDo } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { OauthDataDto, ProvisioningDto } from '../../dto';
import { ProvisioningStrategy } from '../base.strategy';
import { OidcProvisioningService } from './service/oidc-provisioning.service';

@Injectable()
export abstract class OidcProvisioningStrategy extends ProvisioningStrategy {
	constructor(protected readonly oidcProvisioningService: OidcProvisioningService) {
		super();
	}

	override async apply(data: OauthDataDto): Promise<ProvisioningDto> {
		let school: LegacySchoolDo | undefined;
		if (data.externalSchool) {
			school = await this.oidcProvisioningService.provisionExternalSchool(data.externalSchool, data.system.systemId);
		}

		const user: UserDO = await this.oidcProvisioningService.provisionExternalUser(
			data.externalUser,
			data.system.systemId,
			school?.id
		);
		return new ProvisioningDto({ externalUserId: user.externalId || data.externalUser.externalId });
	}
}
