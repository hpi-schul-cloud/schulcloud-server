import { Group, GroupService } from '@modules/group';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LegacySchoolDo, UserDO } from '@shared/domain/domainobject';
import { ExternalGroupDto, OauthDataDto, ProvisioningDto } from '../../dto';
import { ProvisioningConfig } from '../../provisioning.config';
import { ProvisioningStrategy } from '../base.strategy';
import {
	SchulconnexCourseSyncService,
	SchulconnexGroupProvisioningService,
	SchulconnexLicenseProvisioningService,
	SchulconnexSchoolProvisioningService,
	SchulconnexToolProvisioningService,
	SchulconnexUserProvisioningService,
} from './service';

@Injectable()
export abstract class SchulconnexProvisioningStrategy extends ProvisioningStrategy {
	constructor(
		protected readonly schulconnexSchoolProvisioningService: SchulconnexSchoolProvisioningService,
		protected readonly schulconnexUserProvisioningService: SchulconnexUserProvisioningService,
		protected readonly schulconnexGroupProvisioningService: SchulconnexGroupProvisioningService,
		protected readonly schulconnexCourseSyncService: SchulconnexCourseSyncService,
		protected readonly schulconnexLicenseProvisioningService: SchulconnexLicenseProvisioningService,
		protected readonly schulconnexToolProvisioningService: SchulconnexToolProvisioningService,
		protected readonly groupService: GroupService,
		protected readonly configService: ConfigService<ProvisioningConfig, true>
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

		if (this.configService.get('FEATURE_SANIS_GROUP_PROVISIONING_ENABLED')) {
			await this.provisionGroups(data, school);
		}

		if (this.configService.get('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED') && user.id) {
			await this.schulconnexLicenseProvisioningService.provisionExternalLicenses(user.id, data.externalLicenses);
			await this.schulconnexToolProvisioningService.provisionSchoolExternalTools(
				user.id,
				user.schoolId,
				data.system.systemId
			);
		}

		return new ProvisioningDto({ externalUserId: user.externalId || data.externalUser.externalId });
	}

	private async provisionGroups(data: OauthDataDto, school?: LegacySchoolDo): Promise<void> {
		await this.removeUserFromGroups(data);

		if (data.externalGroups) {
			let groups: ExternalGroupDto[] = data.externalGroups;

			groups = await this.schulconnexGroupProvisioningService.filterExternalGroups(
				groups,
				school?.id,
				data.system.systemId
			);

			const groupProvisioningPromises: Promise<unknown>[] = groups.map(
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

					if (this.configService.get('FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED') && provisionedGroup) {
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

	private async removeUserFromGroups(data: OauthDataDto): Promise<void> {
		const removedFromGroups: Group[] =
			await this.schulconnexGroupProvisioningService.removeExternalGroupsAndAffiliation(
				data.externalUser.externalId,
				data.externalGroups ?? [],
				data.system.systemId
			);

		if (this.configService.get('FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED')) {
			const courseSyncPromises: Promise<unknown>[] = removedFromGroups.map(
				async (removedFromGroup: Group): Promise<void> => {
					await this.schulconnexCourseSyncService.synchronizeCourseWithGroup(removedFromGroup, removedFromGroup);
				}
			);

			await Promise.all(courseSyncPromises);
		}
	}
}
