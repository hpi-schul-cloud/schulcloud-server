import { Group, GroupService } from '@modules/group';
import { Inject, Injectable } from '@nestjs/common';
import { LegacySchoolDo, UserDO } from '@shared/domain/domainobject';
import { IProvisioningFeatures, ProvisioningFeatures } from '../../config';
import { ExternalGroupDto, OauthDataDto, ProvisioningDto } from '../../dto';
import { ProvisioningStrategy } from '../base.strategy';
import {
	SchulconnexCourseSyncService,
	SchulconnexGroupProvisioningService,
	SchulconnexSchoolProvisioningService,
	SchulconnexUserProvisioningService,
} from './service';

@Injectable()
export abstract class SchulconnexProvisioningStrategy extends ProvisioningStrategy {
	constructor(
		@Inject(ProvisioningFeatures) protected readonly provisioningFeatures: IProvisioningFeatures,
		protected readonly schulconnexSchoolProvisioningService: SchulconnexSchoolProvisioningService,
		protected readonly schulconnexUserProvisioningService: SchulconnexUserProvisioningService,
		protected readonly schulconnexGroupProvisioningService: SchulconnexGroupProvisioningService,
		protected readonly schulconnexCourseSyncService: SchulconnexCourseSyncService,
		protected readonly groupService: GroupService
	) {
		super();
	}

	override async apply(data: OauthDataDto): Promise<ProvisioningDto> {
		let school: LegacySchoolDo | undefined;
		if (data.externalSchool) {
			school = await this.schulconnexSchoolProvisioningService.provisionExternalSchool(
				data.externalSchool,
				data.system.systemId
			);
		}

		const user: UserDO = await this.schulconnexUserProvisioningService.provisionExternalUser(
			data.externalUser,
			data.system.systemId,
			school?.id
		);

		if (this.provisioningFeatures.schulconnexGroupProvisioningEnabled) {
			await this.provisionGroups(data, school);
		}

		return new ProvisioningDto({ externalUserId: user.externalId || data.externalUser.externalId });
	}

	private async provisionGroups(data: OauthDataDto, school?: LegacySchoolDo): Promise<void> {
		await this.schulconnexGroupProvisioningService.removeExternalGroupsAndAffiliation(
			data.externalUser.externalId,
			data.externalGroups ?? [],
			data.system.systemId
		);

		if (data.externalGroups) {
			let groups: ExternalGroupDto[] = data.externalGroups;

			groups = await this.schulconnexGroupProvisioningService.filterExternalGroups(
				groups,
				school?.id,
				data.system.systemId
			);

			const groupProvisioningPromises: Promise<void>[] = groups.map(
				async (externalGroup: ExternalGroupDto): Promise<void> => {
					const existingGroup: Group | null = await this.groupService.findByExternalSource(
						externalGroup.externalId,
						data.system.systemId
					);

					const provisionedGroup: Group | null = await this.schulconnexGroupProvisioningService.provisionExternalGroup(
						externalGroup,
						data.externalSchool,
						data.system.systemId
					);

					if (this.provisioningFeatures.schulconnexCourseSyncEnabled && provisionedGroup) {
						await this.schulconnexCourseSyncService.synchronizeCourseWithGroup(
							provisionedGroup,
							existingGroup ?? undefined
						);
					}
				}
			);

			await Promise.all(groupProvisioningPromises);
		}
	}
}
