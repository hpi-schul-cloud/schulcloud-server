import { Injectable } from '@nestjs/common';
import { MediaSchoolLicense } from '../domain';
import { MediaSchoolLicenseRepo } from '../repo';

@Injectable()
export class MediaSchoolLicenseService {
	constructor(private readonly mediaSchoolLicenseRepo: MediaSchoolLicenseRepo) {}

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
