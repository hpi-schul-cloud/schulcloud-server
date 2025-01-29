import { Logger } from '@core/logger';
import { SchulconnexRestClient } from '@infra/schulconnex-client';
import { Group, GroupService } from '@modules/group';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { LegacySchoolDo, Page, UserDO } from '@shared/domain/domainobject';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SchulconnexGroupProvisioningProducer, SchulconnexLicenseProvisioningProducer } from '../../amqp';
import { ExternalGroupDto, OauthDataDto, ProvisioningDto } from '../../dto';
import { ProvisioningConfig } from '../../provisioning.config';
import { SchulconnexFetchStrategy } from './schulconnex-fetch.strategy';
import { SchulconnexResponseMapper } from './schulconnex-response-mapper';
import {
	SchulconnexGroupProvisioningService,
	SchulconnexSchoolProvisioningService,
	SchulconnexUserProvisioningService,
} from './service';

@Injectable()
export class SchulconnexAsyncProvisioningStrategy extends SchulconnexFetchStrategy {
	constructor(
		private readonly schulconnexSchoolProvisioningService: SchulconnexSchoolProvisioningService,
		private readonly schulconnexUserProvisioningService: SchulconnexUserProvisioningService,
		private readonly schulconnexGroupProvisioningProducer: SchulconnexGroupProvisioningProducer,
		private readonly schulconnexLicenseProvisioningProducer: SchulconnexLicenseProvisioningProducer,
		private readonly schulconnexGroupProvisioningService: SchulconnexGroupProvisioningService,
		private readonly groupService: GroupService,
		protected readonly responseMapper: SchulconnexResponseMapper,
		protected readonly schulconnexRestClient: SchulconnexRestClient,
		protected readonly configService: ConfigService<ProvisioningConfig, true>,
		protected readonly logger: Logger
	) {
		super(responseMapper, schulconnexRestClient, configService, logger);
	}

	public getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.SCHULCONNEX_ASYNC;
	}

	public override async apply(data: OauthDataDto): Promise<ProvisioningDto> {
		const { systemId } = data.system;
		let school: LegacySchoolDo | undefined;
		if (data.externalSchool) {
			school = await this.schulconnexSchoolProvisioningService.provisionExternalSchool(data.externalSchool, systemId);
		}

		const user: UserDO = await this.schulconnexUserProvisioningService.provisionExternalUser(
			data.externalUser,
			systemId,
			school?.id
		);

		if (this.configService.get('FEATURE_SANIS_GROUP_PROVISIONING_ENABLED')) {
			await this.provisionGroups(data, user, school);
		}

		if (this.configService.get('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED') && user.id) {
			await this.schulconnexLicenseProvisioningProducer.provisonLicenses({
				userId: user.id,
				schoolId: user.schoolId,
				systemId,
				externalLicenses: data.externalLicenses ?? [],
			});
		}

		return new ProvisioningDto({ externalUserId: user.externalId || data.externalUser.externalId });
	}

	private async provisionGroups(data: OauthDataDto, user: UserDO, school?: LegacySchoolDo): Promise<void> {
		if (!user?.id) {
			throw new NotFoundLoggableException(UserDO.name, { externalId: data.externalUser.externalId });
		}
		const userId: string = user.id;
		const { systemId } = data.system;

		let externalGroups: ExternalGroupDto[] = [];
		if (data.externalGroups) {
			externalGroups = await this.schulconnexGroupProvisioningService.filterExternalGroups(
				data.externalGroups,
				school?.id,
				data.system.systemId
			);
		}

		const existingGroupsOfUser: Page<Group> = await this.groupService.findGroups({ userId, systemId });
		const groupsWithoutUser: Group[] = existingGroupsOfUser.data.filter((existingGroupFromSystem: Group) => {
			const isUserInGroup: boolean = externalGroups.some(
				(externalGroup: ExternalGroupDto) =>
					externalGroup.externalId === existingGroupFromSystem.externalSource?.externalId
			);

			return !isUserInGroup;
		});

		const removalPromises: Promise<void>[] = groupsWithoutUser.map(async (group: Group): Promise<void> => {
			await this.schulconnexGroupProvisioningProducer.removeUserFromGroup({
				userId,
				groupId: group.id,
			});
		});
		const provisioningPromises: Promise<void>[] = externalGroups.map(
			async (externalGroup: ExternalGroupDto): Promise<void> => {
				await this.schulconnexGroupProvisioningProducer.provisonGroup({
					systemId,
					externalGroup,
					externalSchool: data.externalSchool,
				});
			}
		);

		await Promise.all(removalPromises);
		await Promise.all(provisioningPromises);
	}
}
