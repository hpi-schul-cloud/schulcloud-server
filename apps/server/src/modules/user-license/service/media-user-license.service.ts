import { ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { MediaUserLicense } from '@modules/user-license';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { MediaSourceRepo, MediaUserLicenseRepo } from '../repo';

@Injectable()
export class MediaUserLicenseService {
	constructor(
		private readonly mediaUserLicenseRepo: MediaUserLicenseRepo,
		private readonly mediaSourceRepo: MediaSourceRepo
	) {}

	public async getMediaUserLicensesForUser(userId: EntityId): Promise<MediaUserLicense[]> {
		const mediaUserLicenses: MediaUserLicense[] = await this.mediaUserLicenseRepo.findMediaUserLicensesForUser(userId);

		return mediaUserLicenses;
	}

	public async saveUserLicense(license: MediaUserLicense): Promise<void> {
		if (license.mediaSource) {
			await this.mediaSourceRepo.save(license.mediaSource);
		}

		await this.mediaUserLicenseRepo.save(license);
	}

	public async deleteUserLicense(license: MediaUserLicense): Promise<void> {
		await this.mediaUserLicenseRepo.delete(license);
	}

	public hasLicenseForExternalTool(
		externalToolMedium: ExternalToolMedium,
		mediaUserLicenses: MediaUserLicense[]
	): boolean {
		return mediaUserLicenses.some(
			(license: MediaUserLicense) =>
				license.mediumId === externalToolMedium.mediumId &&
				license.mediaSource?.sourceId === externalToolMedium.mediaSourceId
		);
	}
}
