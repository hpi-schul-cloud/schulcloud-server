import { Logger } from '@core/logger';
import { SchulconnexRestClient } from '@infra/schulconnex-client';
import { Group, GroupService } from '@modules/group';
import { LegacySchoolDo } from '@modules/legacy-school/domain';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ExternalGroupDto, OauthDataDto, ProvisioningDto } from '../../dto';
import { GroupProvisioningInfoLoggable } from '../../loggable';
import { ProvisioningConfig } from '../../provisioning.config';
import { SchulconnexBaseProvisioningStrategy } from './schulconnex-base-provisioning.strategy';
import { SchulconnexResponseMapper } from './schulconnex-response-mapper';
import {
	SchulconnexCourseSyncService,
	SchulconnexGroupProvisioningService,
	SchulconnexLicenseProvisioningService,
	SchulconnexSchoolProvisioningService,
	SchulconnexToolProvisioningService,
	SchulconnexUserProvisioningService,
} from './service';

@Injectable()
export class SchulconnexSyncProvisioningStrategy extends SchulconnexBaseProvisioningStrategy {
	constructor(
		private readonly schulconnexSchoolProvisioningService: SchulconnexSchoolProvisioningService,
		private readonly schulconnexUserProvisioningService: SchulconnexUserProvisioningService,
		private readonly schulconnexGroupProvisioningService: SchulconnexGroupProvisioningService,
		private readonly schulconnexCourseSyncService: SchulconnexCourseSyncService,
		private readonly schulconnexLicenseProvisioningService: SchulconnexLicenseProvisioningService,
		private readonly schulconnexToolProvisioningService: SchulconnexToolProvisioningService,
		private readonly groupService: GroupService,
		protected readonly responseMapper: SchulconnexResponseMapper,
		protected readonly schulconnexRestClient: SchulconnexRestClient,
		protected readonly configService: ConfigService<ProvisioningConfig, true>,
		protected readonly logger: Logger
	) {
		super(responseMapper, schulconnexRestClient, configService, logger);
	}

	public override getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.SCHULCONNEX_LEGACY;
	}

	public override async apply(data: OauthDataDto): Promise<ProvisioningDto> {
		let school: LegacySchoolDo | undefined;
		if (data.externalSchool) {
			school = await this.schulconnexSchoolProvisioningService.provisionExternalSchool(
				data.externalSchool,
				data.system.systemId
			);
		}

		const user = await this.schulconnexUserProvisioningService.provisionExternalUser(
			data.externalUser,
			data.system.systemId,
			school?.id
		);

		if (this.configService.get('FEATURE_SCHULCONNEX_GROUP_PROVISIONING_ENABLED')) {
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
		const startTime = performance.now();

		await this.removeUserFromGroups(data);

		if (data.externalGroups) {
			let groups = data.externalGroups;

			groups = await this.schulconnexGroupProvisioningService.filterExternalGroups(
				groups,
				school?.id,
				data.system.systemId
			);

			const groupProvisioningPromises = groups.map(async (externalGroup: ExternalGroupDto): Promise<void> => {
				const existingGroup = await this.groupService.findByExternalSource(
					externalGroup.externalId,
					data.system.systemId
				);

				const provisionedGroup = await this.schulconnexGroupProvisioningService.provisionExternalGroup(
					externalGroup,
					data.externalSchool,
					data.system.systemId
				);

				if (this.configService.get('FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED') && provisionedGroup) {
					await this.schulconnexCourseSyncService.synchronizeCourseWithGroup(
						provisionedGroup,
						existingGroup ?? undefined
					);

					if (!existingGroup) {
						await this.schulconnexCourseSyncService.synchronizeCoursesFromHistory(provisionedGroup);
					}
				}
			});

			await Promise.all(groupProvisioningPromises);
		}

		const endTime = performance.now();
		this.logger.warning(
			new GroupProvisioningInfoLoggable(data.externalGroups ?? [], endTime - startTime, data.externalUser.externalId)
		);
	}

	private async removeUserFromGroups(data: OauthDataDto): Promise<void> {
		const removedFromGroups = await this.schulconnexGroupProvisioningService.removeExternalGroupsAndAffiliation(
			data.externalUser.externalId,
			data.externalGroups ?? [],
			data.system.systemId
		);

		if (this.configService.get('FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED')) {
			const courseSyncPromises = removedFromGroups.map(async (removedFromGroup: Group): Promise<void> => {
				await this.schulconnexCourseSyncService.synchronizeCourseWithGroup(removedFromGroup, removedFromGroup);
			});

			await Promise.all(courseSyncPromises);
		}
	}
}
