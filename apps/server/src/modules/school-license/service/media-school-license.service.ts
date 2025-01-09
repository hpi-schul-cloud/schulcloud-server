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

	public async deleteSchoolLicenses(licenses: MediaSchoolLicense[]): Promise<void> {
		await this.mediaSchoolLicenseRepo.delete(licenses);
	}

	public async saveAllMediaSchoolLicenses(licenses: MediaSchoolLicense[]): Promise<MediaSchoolLicense[]> {
		const mediaSchoolLicenses: MediaSchoolLicense[] = await this.mediaSchoolLicenseRepo.saveAll(licenses);

		return mediaSchoolLicenses;
	}
}
