import { Inject, Injectable } from '@nestjs/common';
import { LegacySchoolDo, UserDO } from '@shared/domain/domainobject';
import { IProvisioningFeatures, ProvisioningFeatures } from '../../config';
import { ExternalGroupDto, OauthDataDto, ProvisioningDto } from '../../dto';
import { ProvisioningStrategy } from '../base.strategy';
import { OidcProvisioningService } from './service/oidc-provisioning.service';

@Injectable()
export abstract class OidcProvisioningStrategy extends ProvisioningStrategy {
	constructor(
		@Inject(ProvisioningFeatures) protected readonly provisioningFeatures: IProvisioningFeatures,
		protected readonly oidcProvisioningService: OidcProvisioningService
	) {
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

		if (this.provisioningFeatures.schulconnexGroupProvisioningEnabled) {
			await this.oidcProvisioningService.removeExternalGroupsAndAffiliation(
				data.externalUser.externalId,
				data.externalGroups ?? [],
				data.system.systemId
			);

			if (data.externalGroups) {
				let groups: ExternalGroupDto[] = data.externalGroups;

				groups = await this.oidcProvisioningService.filterExternalGroups(groups, school?.id, data.system.systemId);

				await Promise.all(
					groups.map((group: ExternalGroupDto) =>
						this.oidcProvisioningService.provisionExternalGroup(group, data.externalSchool, data.system.systemId)
					)
				);
			}
		}

		return new ProvisioningDto({ externalUserId: user.externalId || data.externalUser.externalId });
	}
}
