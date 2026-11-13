import { LegacyLogger } from '@infra/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { MediaSource, MediaSourceService } from '@modules/media-source';
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
		private readonly logger: LegacyLogger,
		@Inject(PROVISIONING_CONFIG_TOKEN) private readonly config: ProvisioningConfig
	) {}

	private getLicenseIdentifier(mediumId: string, mediaSourceId?: string): string {
		return `${mediumId} ${mediaSourceId || ''}`;
	}

	public async provisionExternalLicenses(userId: EntityId, externalLicenses?: ExternalLicenseDto[]): Promise<void> {
		if (!externalLicenses) {
			return;
		}

		const licensesForUser = externalLicenses.filter(
			(license: ExternalLicenseDto) =>
				license.scope === 'USER' ||
				license.scope === undefined ||
				(this.config.featureSchulconnexGroupSchoolMediaLicenseEnabled &&
					(license.scope === 'SCHOOL' || license.scope === 'GROUP'))
		);
		this.logger.log(
			`Schulconnex media licenses for user ${userId}: received=${externalLicenses.length}, provisioned=${licensesForUser.length}.`
		);

		const mediaSourceMap: Map<string, MediaSource> = await this.provisionMediaSources(licensesForUser);
		const existingLicenses: MediaUserLicense[] = await this.mediaUserLicenseService.getMediaUserLicensesForUser(userId);

		await this.provisionNewLicenses(licensesForUser, existingLicenses, userId, mediaSourceMap);
		await this.deleteExpiredLicenses(licensesForUser, existingLicenses);
	}

	private async provisionNewLicenses(
		licensesForUser: ExternalLicenseDto[],
		existingLicenses: MediaUserLicense[],
		userId: EntityId,
		mediaSourceMap: Map<string, MediaSource>
	): Promise<void> {
		const existingIdentifiers: Set<string> = new Set(
			existingLicenses.map((license: MediaUserLicense) =>
				this.getLicenseIdentifier(license.mediumId, license.mediaSource?.sourceId)
			)
		);

		const newLicenses: MediaUserLicense[] = licensesForUser
			.filter((license: ExternalLicenseDto) => {
				const identifier = this.getLicenseIdentifier(license.mediumId, license.mediaSourceId);
				if (existingIdentifiers.has(identifier)) {
					return false;
				}
				existingIdentifiers.add(identifier);
				return true;
			})
			.map(
				(license: ExternalLicenseDto) =>
					new MediaUserLicense({
						id: new ObjectId().toHexString(),
						type: UserLicenseType.MEDIA_LICENSE,
						userId,
						mediaSource: license.mediaSourceId ? mediaSourceMap.get(license.mediaSourceId) : undefined,
						mediumId: license.mediumId,
					})
			);

		await this.mediaUserLicenseService.saveAll(newLicenses);
	}

	private async deleteExpiredLicenses(
		licensesForUser: ExternalLicenseDto[],
		existingLicenses: MediaUserLicense[]
	): Promise<void> {
		const activeIdentifiers: Set<string> = new Set(
			licensesForUser.map((license: ExternalLicenseDto) =>
				this.getLicenseIdentifier(license.mediumId, license.mediaSourceId)
			)
		);

		const expiredLicenses = existingLicenses.filter(
			(license: MediaUserLicense) =>
				!activeIdentifiers.has(this.getLicenseIdentifier(license.mediumId, license.mediaSource?.sourceId))
		);

		await this.mediaUserLicenseService.delete(expiredLicenses);
	}

	private async provisionMediaSources(licenses: ExternalLicenseDto[]): Promise<Map<string, MediaSource>> {
		const mediaSourceIds: Set<string> = new Set(
			licenses
				.map((license: ExternalLicenseDto) => license.mediaSourceId)
				.filter((sourceId: string | undefined): sourceId is string => !!sourceId)
		);
		const mediaSourceMap: Map<string, MediaSource> = new Map();

		const newMediaSources = await Promise.all(
			Array.from(mediaSourceIds).map(async (sourceId: string): Promise<MediaSource | undefined> => {
				const existing = await this.mediaSourceService.findBySourceId(sourceId);
				if (existing) {
					mediaSourceMap.set(sourceId, existing);
					return undefined;
				}

				const created = new MediaSource({ id: new ObjectId().toHexString(), sourceId });
				mediaSourceMap.set(sourceId, created);
				return created;
			})
		);

		await this.mediaSourceService.saveAll(newMediaSources.filter((source): source is MediaSource => !!source));
		return mediaSourceMap;
	}
}
