import { LegacyLogger } from '@infra/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { Group, GroupService } from '@modules/group';
import { GroupLicenseType, MediaGroupLicense, MediaGroupLicenseService } from '@modules/group-license';
import { LegacySchoolService } from '@modules/legacy-school';
import { MediaSource } from '@modules/media-source';
import { MediaSourceService } from '@modules/media-source/service';
import { MediaSchoolLicense, MediaSchoolLicenseService, SchoolLicenseType } from '@modules/school-license';
import { MediaUserLicense, MediaUserLicenseService, UserLicenseType } from '@modules/user-license';
import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ExternalLicenseDto } from '../../../dto';
import { PROVISIONING_CONFIG_TOKEN, ProvisioningConfig } from '../../../provisioning.config';

@Injectable()
export class SchulconnexLicenseProvisioningService {
	constructor(
		private readonly mediaUserLicenseService: MediaUserLicenseService,
		private readonly mediaSourceService: MediaSourceService,
		private readonly mediaSchoolLicenseService: MediaSchoolLicenseService,
		private readonly mediaGroupLicenseService: MediaGroupLicenseService,
		private readonly groupService: GroupService,
		private readonly schoolService: LegacySchoolService,
		private readonly logger: LegacyLogger,
		@Inject(PROVISIONING_CONFIG_TOKEN) private readonly config: ProvisioningConfig
	) {}

	private getLicenseIdentifier(mediumId: string, mediaSourceId?: string): string {
		return `${mediumId} ${mediaSourceId || ''}`;
	}

	public async provisionExternalLicenses(
		userId: EntityId,
		externalLicenses?: ExternalLicenseDto[],
		schoolId?: EntityId,
		systemId?: EntityId
	): Promise<void> {
		if (!externalLicenses) {
			return;
		}

		const userLicenses = externalLicenses.filter((license: ExternalLicenseDto) => license.scope === 'USER');
		const schoolLicenses = externalLicenses.filter((license: ExternalLicenseDto) => license.scope === 'SCHOOL');
		const groupLicenses = externalLicenses.filter((license: ExternalLicenseDto) => license.scope === 'GROUP');
		this.logger.log(
			`Schulconnex media licenses for user ${userId}: user=${userLicenses.length}, school=${schoolLicenses.length}, group=${groupLicenses.length}.`
		);

		const mediaSourceMap: Map<string, MediaSource> = await this.provisionMediaSources(externalLicenses);

		const existingMediaUserLicenses: MediaUserLicense[] =
			await this.mediaUserLicenseService.getMediaUserLicensesForUser(userId);

		await this.provisionNewLicenses(userLicenses, existingMediaUserLicenses, userId, mediaSourceMap);

		await this.deleteExpiredLicenses(userLicenses, existingMediaUserLicenses);

		if (!this.config.featureSchulconnexGroupSchoolMediaLicenseEnabled) {
			this.logger.debug(`Skipping school and group media licenses for user ${userId}: feature is disabled.`);
			return;
		}

		if (schoolId) {
			await this.provisionSchoolLicenses(schoolLicenses, schoolId, mediaSourceMap);
		}

		if (systemId) {
			await this.provisionGroupLicenses(groupLicenses, systemId, mediaSourceMap);
		}
	}

	private async provisionNewLicenses(
		externalLicenses: ExternalLicenseDto[],
		existingMediaUserLicenses: MediaUserLicense[],
		userId: EntityId,
		mediaSourceMap: Map<string, MediaSource>
	): Promise<void> {
		const existingMediaUserLicenseIdentifiers: Set<string> = new Set(
			existingMediaUserLicenses.map((license: MediaUserLicense): string =>
				this.getLicenseIdentifier(license.mediumId, license.mediaSource?.sourceId)
			)
		);

		const newLicenses: ExternalLicenseDto[] = externalLicenses.filter(
			(externalLicense: ExternalLicenseDto): boolean => {
				const identifier: string = this.getLicenseIdentifier(externalLicense.mediumId, externalLicense.mediaSourceId);

				const hasLicense: boolean = existingMediaUserLicenseIdentifiers.has(identifier);

				return !hasLicense;
			}
		);

		const newLicense: MediaUserLicense[] = newLicenses.map((externalLicense: ExternalLicenseDto): MediaUserLicense => {
			let mediaSource: MediaSource | undefined;

			if (externalLicense.mediaSourceId) {
				mediaSource = mediaSourceMap.get(externalLicense.mediaSourceId);
			}

			const mediaUserLicense: MediaUserLicense = new MediaUserLicense({
				id: new ObjectId().toHexString(),
				type: UserLicenseType.MEDIA_LICENSE,
				userId,
				mediaSource,
				mediumId: externalLicense.mediumId,
			});

			return mediaUserLicense;
		});

		await this.mediaUserLicenseService.saveAll(newLicense);
	}

	// School and group licenses are only added here. One user's response is not authoritative for the
	// whole school or group (members may get different license lists), so revocation is not done on login.
	private async provisionSchoolLicenses(
		schoolLicenses: ExternalLicenseDto[],
		schoolId: EntityId,
		mediaSourceMap: Map<string, MediaSource>
	): Promise<void> {
		if (schoolLicenses.length === 0) {
			return;
		}

		const school = await this.schoolService.getSchoolById(schoolId);
		if (!school.externalId) {
			this.logger.warn(
				`Skipping ${schoolLicenses.length} school media licenses for school ${schoolId}: school has no external ID.`
			);
			return;
		}

		// Only the user's own school is known, so licenses for any other organisation are ignored
		const licensesForOwnSchool: ExternalLicenseDto[] = schoolLicenses.filter(
			(license: ExternalLicenseDto): boolean => license.scopeId === school.externalId
		);

		if (licensesForOwnSchool.length === 0) {
			this.logger.warn(
				`Skipping ${schoolLicenses.length} school media licenses for school ${schoolId}: no license scope matches external ID ${school.externalId}.`
			);
			return;
		}

		const existingLicenses: MediaSchoolLicense[] =
			await this.mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId(schoolId);

		const newLicenses: MediaSchoolLicense[] = this.buildNewSchoolLicenses(
			schoolId,
			licensesForOwnSchool,
			existingLicenses,
			mediaSourceMap
		);

		if (newLicenses.length > 0) {
			await this.mediaSchoolLicenseService.saveAllMediaSchoolLicenses(newLicenses);
			this.logger.log(`Persisted ${newLicenses.length} school media licenses for school ${schoolId}.`);
		}
	}

	private buildNewSchoolLicenses(
		schoolId: EntityId,
		licenses: ExternalLicenseDto[],
		existingLicenses: MediaSchoolLicense[],
		mediaSourceMap: Map<string, MediaSource>
	): MediaSchoolLicense[] {
		const existingIdentifiers: Set<string> = new Set(
			existingLicenses.map((license: MediaSchoolLicense): string =>
				this.getLicenseIdentifier(license.mediumId, license.mediaSource?.sourceId)
			)
		);

		return licenses
			.filter(
				(license: ExternalLicenseDto): boolean =>
					!existingIdentifiers.has(this.getLicenseIdentifier(license.mediumId, license.mediaSourceId))
			)
			.map(
				(license: ExternalLicenseDto): MediaSchoolLicense =>
					new MediaSchoolLicense({
						id: new ObjectId().toHexString(),
						type: SchoolLicenseType.MEDIA_LICENSE,
						schoolId,
						mediaSource: license.mediaSourceId ? mediaSourceMap.get(license.mediaSourceId) : undefined,
						mediumId: license.mediumId,
					})
			);
	}

	private groupLicensesByScopeId(scopedLicenses: ExternalLicenseDto[]): Map<string, ExternalLicenseDto[]> {
		const licensesByScopeId = new Map<string, ExternalLicenseDto[]>();
		for (const license of scopedLicenses) {
			if (license.scopeId) {
				const groupList = licensesByScopeId.get(license.scopeId) ?? [];
				groupList.push(license);
				licensesByScopeId.set(license.scopeId, groupList);
			}
		}
		return licensesByScopeId;
	}

	private async resolveExternalGroups(
		licensesByScopeId: Map<string, ExternalLicenseDto[]>,
		systemId: EntityId
	): Promise<Array<{ group: Group; licenses: ExternalLicenseDto[] }>> {
		const entries = Array.from(licensesByScopeId.entries());
		const resolved = await Promise.all(
			entries.map(async ([externalGroupId, licenses]) => {
				const group: Group | null = await this.groupService.findByExternalSource(externalGroupId, systemId);
				if (!group) {
					this.logger.warn(
						`Skipping ${licenses.length} group media licenses: group ${externalGroupId} is not provisioned for system ${systemId}.`
					);
				}
				return group ? { group, licenses } : null;
			})
		);
		return resolved.filter((entry): entry is { group: Group; licenses: ExternalLicenseDto[] } => entry !== null);
	}

	private async buildNewGroupLicenses(
		resolvedGroups: Array<{ group: Group; licenses: ExternalLicenseDto[] }>,
		mediaSourceMap: Map<string, MediaSource>
	): Promise<MediaGroupLicense[]> {
		const existingLicensesPerGroup: MediaGroupLicense[][] = await Promise.all(
			resolvedGroups.map(({ group }) => this.mediaGroupLicenseService.findMediaGroupLicensesByGroupId(group.id))
		);

		const newLicenses: MediaGroupLicense[] = [];

		for (let i = 0; i < resolvedGroups.length; i++) {
			const { group, licenses } = resolvedGroups[i];
			const existingForGroup = existingLicensesPerGroup[i];

			const existingIdentifiers: Set<string> = new Set(
				existingForGroup.map((license: MediaGroupLicense): string =>
					this.getLicenseIdentifier(license.mediumId, license.mediaSource?.sourceId)
				)
			);

			// Add new
			for (const license of licenses) {
				const identifier = this.getLicenseIdentifier(license.mediumId, license.mediaSourceId);
				if (!existingIdentifiers.has(identifier)) {
					existingIdentifiers.add(identifier);
					const mediaSource: MediaSource | undefined = license.mediaSourceId
						? mediaSourceMap.get(license.mediaSourceId)
						: undefined;
					newLicenses.push(
						new MediaGroupLicense({
							id: new ObjectId().toHexString(),
							type: GroupLicenseType.MEDIA_LICENSE,
							groupId: group.id,
							mediaSource,
							mediumId: license.mediumId,
						})
					);
				}
			}
		}

		return newLicenses;
	}

	private async provisionGroupLicenses(
		groupLicenses: ExternalLicenseDto[],
		systemId: EntityId,
		mediaSourceMap: Map<string, MediaSource>
	): Promise<void> {
		const licensesByScopeId: Map<string, ExternalLicenseDto[]> = this.groupLicensesByScopeId(groupLicenses);
		const resolvedGroups = await this.resolveExternalGroups(licensesByScopeId, systemId);
		const newLicenses: MediaGroupLicense[] = await this.buildNewGroupLicenses(resolvedGroups, mediaSourceMap);

		if (newLicenses.length > 0) {
			await this.mediaGroupLicenseService.saveAll(newLicenses);
			this.logger.log(`Persisted ${newLicenses.length} group media licenses for system ${systemId}.`);
		}
	}

	private async provisionMediaSources(licenses: ExternalLicenseDto[]): Promise<Map<string, MediaSource>> {
		const mediaSourceIds: string[] = licenses
			.map((externalLicense: ExternalLicenseDto): string | undefined => externalLicense.mediaSourceId)
			.filter((mediaSourceId: string | undefined): mediaSourceId is string => !!mediaSourceId);

		const mediaSourceIdSet: Set<string> = new Set(mediaSourceIds);

		const mediaSourceMap: Map<string, MediaSource> = new Map();

		const mediaSourcePromises: Promise<MediaSource | null>[] = Array.from(mediaSourceIdSet).map(
			async (mediaSourceId: string): Promise<MediaSource | null> => {
				const mediaSource: MediaSource | null = await this.mediaSourceService.findBySourceId(mediaSourceId);

				if (mediaSource) {
					mediaSourceMap.set(mediaSourceId, mediaSource);
				} else {
					const newMediaSource: MediaSource = new MediaSource({
						id: new ObjectId().toHexString(),
						sourceId: mediaSourceId,
					});

					mediaSourceMap.set(mediaSourceId, newMediaSource);

					return newMediaSource;
				}

				return null;
			}
		);

		const newMediaSources: (MediaSource | null)[] = await Promise.all(mediaSourcePromises);

		await this.mediaSourceService.saveAll(
			newMediaSources.filter((mediaSource: MediaSource | null): mediaSource is MediaSource => !!mediaSource)
		);

		return mediaSourceMap;
	}

	private async deleteExpiredLicenses(
		externalLicenses: ExternalLicenseDto[],
		existingMediaUserLicenses: MediaUserLicense[]
	): Promise<void> {
		const externalUserLicenseIdentifiers: Set<string> = new Set(
			externalLicenses.map((license: ExternalLicenseDto): string =>
				this.getLicenseIdentifier(license.mediumId, license.mediaSourceId)
			)
		);

		const oldLicenses: MediaUserLicense[] = existingMediaUserLicenses.filter(
			(mediaUserLicense: MediaUserLicense): boolean => {
				const identifier: string = this.getLicenseIdentifier(
					mediaUserLicense.mediumId,
					mediaUserLicense.mediaSource?.sourceId
				);

				const hasLicense: boolean = externalUserLicenseIdentifiers.has(identifier);

				return !hasLicense;
			}
		);

		await this.mediaUserLicenseService.delete(oldLicenses);
	}
}
