import { ExternalToolMedium } from '@modules/tool/external-tool/domain/';
import { Inject } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { MediaSchoolLicense } from '../domain';
import { MEDIA_SCHOOL_LICENSE_REPO, MediaSchoolLicenseRepo } from '../repo';

export class MediaSchoolLicenseService {
	constructor(@Inject(MEDIA_SCHOOL_LICENSE_REPO) private readonly mediaSchoolLicenseRepo: MediaSchoolLicenseRepo) {}

	public async deleteAllByMediaSource(mediaSourceId: EntityId): Promise<number> {
		const deleteCount: number = await this.mediaSchoolLicenseRepo.deleteAllByMediaSource(mediaSourceId);

		return deleteCount;
	}

	public async saveAllMediaSchoolLicenses(licenses: MediaSchoolLicense[]): Promise<MediaSchoolLicense[]> {
		const mediaSchoolLicenses: MediaSchoolLicense[] = await this.mediaSchoolLicenseRepo.saveAll(licenses);

		return mediaSchoolLicenses;
	}

	public async findMediaSchoolLicensesBySchoolId(schoolId: string): Promise<MediaSchoolLicense[]> {
		const mediaSchoolLicenses: MediaSchoolLicense[] =
			await this.mediaSchoolLicenseRepo.findMediaSchoolLicensesBySchoolId(schoolId);

		return mediaSchoolLicenses;
	}

	public hasLicenseForExternalTool(
		externalToolMedium: ExternalToolMedium,
		mediaSchoolLicense: MediaSchoolLicense[]
	): boolean {
		return mediaSchoolLicense.some(
			(license: MediaSchoolLicense) =>
				license.mediumId === externalToolMedium.mediumId &&
				license.mediaSource?.sourceId === externalToolMedium.mediaSourceId
		);
	}
}
