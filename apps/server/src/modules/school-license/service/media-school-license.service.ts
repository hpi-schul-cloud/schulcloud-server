import { Inject } from '@nestjs/common';
import { MediaSchoolLicense } from '../domain';
import { MEDIA_SCHOOL_LICENSE_REPO, MediaSchoolLicenseRepo } from '../repo';

export class MediaSchoolLicenseService {
	constructor(@Inject(MEDIA_SCHOOL_LICENSE_REPO) private readonly mediaSchoolLicenseRepo: MediaSchoolLicenseRepo) {}

	public async findMediaSchoolLicensesByMediumId(mediumId: string): Promise<MediaSchoolLicense[]> {
		const mediaSchoolLicenses: MediaSchoolLicense[] =
			await this.mediaSchoolLicenseRepo.findMediaSchoolLicensesByMediumId(mediumId);

		return mediaSchoolLicenses;
	}

	public async saveMediaSchoolLicense(license: MediaSchoolLicense): Promise<void> {
		await this.mediaSchoolLicenseRepo.save(license);
	}

	public async deleteSchoolLicense(license: MediaSchoolLicense): Promise<void> {
		await this.mediaSchoolLicenseRepo.delete(license);
	}
}
