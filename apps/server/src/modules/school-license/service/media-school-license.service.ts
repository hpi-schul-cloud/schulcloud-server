import { Inject } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { MediaSchoolLicense } from '../domain';
import { MEDIA_SCHOOL_LICENSE_REPO, MediaSchoolLicenseRepo } from '../repo';

export class MediaSchoolLicenseService {
	constructor(@Inject(MEDIA_SCHOOL_LICENSE_REPO) private readonly mediaSchoolLicenseRepo: MediaSchoolLicenseRepo) {}

	public async findAllByMediaSourceAndMediumId(
		mediaSourceId: EntityId,
		mediumId: string
	): Promise<MediaSchoolLicense[]> {
		const mediaSchoolLicenses: MediaSchoolLicense[] = await this.mediaSchoolLicenseRepo.findAllByMediaSourceAndMediumId(
			mediaSourceId,
			mediumId
		);

		return mediaSchoolLicenses;
	}

	public async saveMediaSchoolLicense(license: MediaSchoolLicense): Promise<void> {
		await this.mediaSchoolLicenseRepo.save(license);
	}

	public async deleteSchoolLicense(license: MediaSchoolLicense): Promise<void> {
		await this.mediaSchoolLicenseRepo.delete(license);
	}
}
