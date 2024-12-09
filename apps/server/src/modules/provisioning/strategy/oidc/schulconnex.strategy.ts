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
			console.time('ProvisionierungDerSchule');

			school = await this.schulconnexSchoolProvisioningService.provisionExternalSchool(
				data.externalSchool,
				data.system.systemId
			);

			console.timeEnd('ProvisionierungDerSchule');
		}
		console.time('ProvisionierungDesNutzers');

		const user: UserDO = await this.schulconnexUserProvisioningService.provisionExternalUser(
			data.externalUser,
			data.system.systemId,
			school?.id
		);

		console.timeEnd('ProvisionierungDesNutzers');

		if (this.configService.get('FEATURE_SANIS_GROUP_PROVISIONING_ENABLED')) {
			await this.provisionGroups(data, school);
		}

		if (this.configService.get('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED') && user.id) {
			console.time('Medienlizenzen');
			await this.schulconnexLicenseProvisioningService.provisionExternalLicenses(user.id, data.externalLicenses);
			await this.schulconnexToolProvisioningService.provisionSchoolExternalTools(
				user.id,
				user.schoolId,
				data.system.systemId
			);

			console.timeEnd('Medienlizenzen');
		}

		return new ProvisioningDto({ externalUserId: user.externalId || data.externalUser.externalId });
	}

	private async provisionGroups(data: OauthDataDto, school?: LegacySchoolDo): Promise<void> {
		const deleteUserFromGroupStart = performance.now();

		await this.removeUserFromGroups(data);

		console.log('DeleteUserFromGroup');
		const deleteUserFromGroup = performance.now() - deleteUserFromGroupStart;
		console.log(deleteUserFromGroup);

		if (data.externalGroups) {
			let groups: ExternalGroupDto[] = data.externalGroups;
			console.time('GruppeFiltern');

			groups = await this.schulconnexGroupProvisioningService.filterExternalGroups(
				groups,
				school?.id,
				data.system.systemId
			);

			console.timeEnd('GruppeFiltern');

			/* console.time('FirstGroup');
			await this.groupService.findByExternalSource(groups[0].externalId, data.system.systemId);
			console.timeEnd('FirstGroup');
			console.time('Group2');
			await this.groupService.findByExternalSource(groups[1].externalId, data.system.systemId);
			console.timeEnd('Group2');
			console.time('Group3');
			await this.groupService.findByExternalSource(groups[2].externalId, data.system.systemId);
			console.timeEnd('Group3');
			console.time('Group4');
			await this.groupService.findByExternalSource(groups[3].externalId, data.system.systemId);
			console.timeEnd('Group4'); */

			console.log(groups.length, 'Ursprüngliche Gruppen gefunden');
			const numberOfGroups = Number(school?.previousExternalId?.split(',')[0]) || 1;
			let i = 0;
			const groupsTemp = [];
			while (i < numberOfGroups) {
				// @ts-ignore
				groupsTemp.push(groups[i % groups.length]);
				i += 1;
			}
			groups = groupsTemp;
			groups.forEach((group) => {
				const groupUsers = Number(school?.previousExternalId?.split(',')[1]) || 10;
				let n = 0;
				const otherGroupUsers = [];
				while (n < groupUsers) {
					// @ts-ignore
					otherGroupUsers.push(group.otherUsers[n % group.otherUsers.length]);
					n += 1;
				}
				group.otherUsers = otherGroupUsers;
			});

			console.log(
				'Für diese Messung werden ',
				groups.length,
				' Gruppen provisioniert. Die erste hat ',
				groups[0].otherUsers?.length,
				' Gruppenzugehörige.'
			);
			// console.log(groups);
			const groupProvisioningStart = performance.now();
			const groupProvisioningPromises: Promise<unknown>[] = groups.map(
				async (externalGroup: ExternalGroupDto): Promise<void> => {
					// const findGroupsStart = performance.now();
					const existingGroup: Group | null = await this.groupService.findByExternalSource(
						externalGroup.externalId,
						data.system.systemId
					);
					// const findGroups = performance.now() - findGroupsStart;
					// console.log('find group: ', findGroups);

					// const provisionGroupsStart = performance.now();
					const provisionedGroup: Group | null = await this.schulconnexGroupProvisioningService.provisionExternalGroup(
						externalGroup,
						data.externalSchool,
						data.system.systemId
					);
					// const provisionGroups = performance.now() - provisionGroupsStart;
					// console.log('provision group: ', provisionGroups);

					// const courseSyncStart = performance.now();
					if (this.configService.get('FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED') && provisionedGroup) {
						await this.schulconnexCourseSyncService.synchronizeCourseWithGroup(
							provisionedGroup,
							existingGroup ?? undefined
						);
					}
					// const courseSync = performance.now() - courseSyncStart;
					// console.log('course sync: ', courseSync);
					/* const allLogs = {
						foundGroups: groups.length,
						findGroup: findGroups,
						provisionAllGroups: provisionGroups,
						syncCourse: courseSync,
					};
					console.log(allLogs); */
				}
			);

			await Promise.all(groupProvisioningPromises);
			console.log('Gruppenprovisionierung');
			const newAllGroups = performance.now() - groupProvisioningStart;
			console.log(newAllGroups);
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
