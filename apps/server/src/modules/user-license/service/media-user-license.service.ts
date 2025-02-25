import { ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { MediaUserLicense } from '@modules/user-license';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { MediaUserLicenseRepo } from '../repo';

@Injectable()
export class MediaUserLicenseService {
	constructor(private readonly mediaUserLicenseRepo: MediaUserLicenseRepo) {}

	public async getMediaUserLicensesForUser(userId: EntityId): Promise<MediaUserLicense[]> {
		const mediaUserLicenses: MediaUserLicense[] = await this.mediaUserLicenseRepo.findMediaUserLicensesForUser(userId);

		return mediaUserLicenses;
	}

	public async saveAll(licenses: MediaUserLicense[]): Promise<MediaUserLicense[]> {
		const savedLicenses: MediaUserLicense[] = await this.mediaUserLicenseRepo.saveAll(licenses);

		return savedLicenses;
	}

	public async delete(licenses: MediaUserLicense[] | MediaUserLicense): Promise<void> {
		await this.mediaUserLicenseRepo.delete(licenses);
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
