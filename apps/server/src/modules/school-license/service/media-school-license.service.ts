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
}
