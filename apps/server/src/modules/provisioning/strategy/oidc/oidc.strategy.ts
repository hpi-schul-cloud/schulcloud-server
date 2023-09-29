import { Injectable } from '@nestjs/common';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { OauthDataDto, ProvisioningDto } from '../../dto';
import { ProvisioningStrategy } from '../base.strategy';
import { OidcProvisioningService } from './service/oidc-provisioning.service';

@Injectable()
export abstract class OidcProvisioningStrategy extends ProvisioningStrategy {
	constructor(protected readonly oidcProvisioningService: OidcProvisioningService) {
		super();
	}

	override async apply(data: OauthDataDto): Promise<ProvisioningDto> {
		let school: SchoolDO | undefined;
		if (data.externalSchool) {
			school = await this.oidcProvisioningService.provisionExternalSchool(data.externalSchool, data.system.systemId);
		}

		const user: UserDO = await this.oidcProvisioningService.provisionExternalUser(
			data.externalUser,
			data.system.systemId,
			school?.id
		);

		if (Configuration.get('FEATURE_SANIS_GROUP_PROVISIONING_ENABLED') && data.externalGroups) {
			// TODO: N21-1212 remove user from groups

			await Promise.all(
				data.externalGroups.map((externalGroup) =>
					this.oidcProvisioningService.provisionExternalGroup(externalGroup, data.system.systemId)
				)
			);
		}

		return new ProvisioningDto({ externalUserId: user.externalId || data.externalUser.externalId });
	}
}
