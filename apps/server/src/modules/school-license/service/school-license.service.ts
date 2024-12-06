import { ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { MediaSourceRepo } from '../../mediasource/repo';
import { MediaSchoolLicense } from '../domain';
import { MediaSchoolLicenseRepo } from '../repo/media-school-license-repo';

@Injectable()
export class MediaSchoolLicenseService {
	constructor(
		private readonly mediaSchoolLicenseRepo: MediaSchoolLicenseRepo,
		private readonly mediaSourceRepo: MediaSourceRepo
	) {}

	public async getMediaSchoolLicensesForSchool(schoolId: EntityId): Promise<MediaSchoolLicense[]> {
		const mediaSchoolLicenses: MediaSchoolLicense[] =
			await this.mediaSchoolLicenseRepo.findMediaSchoolLicensesForSchool(schoolId);

		return mediaSchoolLicenses;
	}

	public async saveSchoolLicense(license: MediaSchoolLicense): Promise<void> {
		if (license.mediaSource) {
			await this.mediaSourceRepo.save(license.mediaSource);
		}

		await this.mediaSchoolLicenseRepo.save(license);
	}

	public async deleteSchoolLicense(license: MediaSchoolLicense): Promise<void> {
		await this.mediaSchoolLicenseRepo.delete(license);
	}

	public hasSchoolLicenseForExternalTool(
		externalToolMedium: ExternalToolMedium,
		mediaSchoolLicenses: MediaSchoolLicense[]
	): boolean {
		return mediaSchoolLicenses.some(
			(license: MediaSchoolLicense) =>
				license.mediumId === externalToolMedium.mediumId &&
				license.mediaSource?.sourceId === externalToolMedium.mediaSourceId
		);
	}
}
