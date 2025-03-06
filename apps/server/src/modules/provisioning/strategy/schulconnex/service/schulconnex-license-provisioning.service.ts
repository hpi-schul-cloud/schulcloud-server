import { ObjectId } from '@mikro-orm/mongodb';
import { MediaSource } from '@modules/media-source';
import { MediaSourceService } from '@modules/media-source/service';
import { MediaUserLicense, MediaUserLicenseService, UserLicenseType } from '@modules/user-license';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ExternalLicenseDto } from '../../../dto';

@Injectable()
export class SchulconnexLicenseProvisioningService {
	constructor(
		private readonly mediaUserLicenseService: MediaUserLicenseService,
		private readonly mediaSourceService: MediaSourceService
	) {}

	private getLicenseIdentifier(mediumId: string, mediaSourceId?: string): string {
		return `${mediumId} ${mediaSourceId || ''}`;
	}

	public async provisionExternalLicenses(userId: EntityId, externalLicenses?: ExternalLicenseDto[]): Promise<void> {
		if (!externalLicenses) {
			return;
		}

		const existingMediaUserLicenses: MediaUserLicense[] =
			await this.mediaUserLicenseService.getMediaUserLicensesForUser(userId);

		await this.provisionNewLicenses(externalLicenses, existingMediaUserLicenses, userId);

		await this.deleteExpiredLicenses(externalLicenses, existingMediaUserLicenses);
	}

	private async provisionNewLicenses(
		externalLicenses: ExternalLicenseDto[],
		existingMediaUserLicenses: MediaUserLicense[],
		userId: EntityId
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

		const mediaSourceMap: Map<string, MediaSource> = await this.provisionMediaSources(newLicenses);

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
