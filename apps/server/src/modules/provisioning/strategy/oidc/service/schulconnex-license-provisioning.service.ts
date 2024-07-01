import { ObjectId } from '@mikro-orm/mongodb';
import {
	MediaSource,
	MediaSourceService,
	MediaUserLicense,
	MediaUserLicenseService,
	UserLicenseType,
} from '@modules/user-license';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ExternalLicenseDto } from '../../../dto';

@Injectable()
export class SchulconnexLicenseProvisioningService {
	constructor(
		private readonly mediaUserLicenseService: MediaUserLicenseService,
		private readonly mediaSourceService: MediaSourceService
	) {}

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
		mediaUserLicenses: MediaUserLicense[],
		userId: EntityId
	): Promise<void> {
		await Promise.all(
			externalLicenses.map(async (externalLicense: ExternalLicenseDto): Promise<void> => {
				const existingLicense: MediaUserLicense | undefined = mediaUserLicenses.find(
					(license: MediaUserLicense) =>
						license.mediumId === externalLicense.mediumId &&
						license.mediaSource?.sourceId === externalLicense.mediaSourceId
				);

				if (!existingLicense) {
					const newLicense: MediaUserLicense = await this.buildLicense(externalLicense, userId);
					await this.mediaUserLicenseService.saveUserLicense(newLicense);
				}
			})
		);
	}

	private async deleteExpiredLicenses(
		externalLicenses: ExternalLicenseDto[],
		mediaUserLicenses: MediaUserLicense[]
	): Promise<void> {
		await Promise.all(
			mediaUserLicenses.map(async (mediaUserLicense: MediaUserLicense): Promise<void> => {
				const existingExternalLicense: ExternalLicenseDto | undefined = externalLicenses.find(
					(externalLicense: ExternalLicenseDto) =>
						mediaUserLicense.mediumId === externalLicense.mediumId &&
						mediaUserLicense.mediaSource?.sourceId === externalLicense.mediaSourceId
				);

				if (!existingExternalLicense) {
					await this.mediaUserLicenseService.deleteUserLicense(mediaUserLicense);
				}
			})
		);
	}

	private async buildLicense(externalLicense: ExternalLicenseDto, userId: EntityId): Promise<MediaUserLicense> {
		let mediaSource: MediaSource | null = null;

		if (externalLicense.mediaSourceId) {
			mediaSource = await this.mediaSourceService.findBySourceId(externalLicense.mediaSourceId);

			if (!mediaSource) {
				mediaSource = new MediaSource({
					id: new ObjectId().toHexString(),
					sourceId: externalLicense.mediaSourceId,
				});
			}
		}

		const mediaUserLicense: MediaUserLicense = new MediaUserLicense({
			id: new ObjectId().toHexString(),
			type: UserLicenseType.MEDIA_LICENSE,
			userId,
			mediaSource: mediaSource ?? undefined,
			mediumId: externalLicense.mediumId,
		});

		return mediaUserLicense;
	}
}
