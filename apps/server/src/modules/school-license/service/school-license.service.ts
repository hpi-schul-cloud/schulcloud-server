import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { MediaSource } from '@src/modules/mediasource/domain';
import { MediaSourceRepo } from '../../mediasource/repo';
import { MediaSchoolLicense } from '../domain';
import { SchoolLicenseType } from '../enum';
import { MediaSchoolLicenseRepo } from '../repo/media-school-license-repo';

@Injectable()
export class MediaSchoolLicenseService {
	constructor(
		private readonly mediaSchoolLicenseRepo: MediaSchoolLicenseRepo,
		private readonly mediaSourceRepo: MediaSourceRepo
	) {}

	public async findMediaSchoolLicense(
		mediaSource: MediaSource,
		schoolId: EntityId,
		mediumId: string
	): Promise<MediaSchoolLicense> {
		const mediaSchoolLicense: MediaSchoolLicense = await this.mediaSchoolLicenseRepo.findMediaSchoolLicense(
			mediaSource,
			schoolId,
			mediumId
		);

		return mediaSchoolLicense;
	}

	public async saveSchoolLicense(license: MediaSchoolLicense): Promise<void> {
		await this.mediaSchoolLicenseRepo.save(license);
	}

	public async deleteSchoolLicense(license: MediaSchoolLicense): Promise<void> {
		await this.mediaSchoolLicenseRepo.delete(license);
	}

	public async findMediaSchoolLicensesByMediumId(mediumId: string): Promise<MediaSchoolLicense[]> {
		const mediaSchoolLicenses: MediaSchoolLicense[] =
			await this.mediaSchoolLicenseRepo.findMediaSchoolLicensesByMediumId(mediumId);

		return mediaSchoolLicenses;
	}

	public async buildLicense(
		mediaSource: MediaSource,
		schoolId: EntityId,
		mediumId: string
	): Promise<MediaSchoolLicense> {
		const mediaSchoolLicense: MediaSchoolLicense = new MediaSchoolLicense({
			id: new ObjectId().toHexString(),
			type: SchoolLicenseType.MEDIA_LICENSE,
			schoolId,
			mediaSource,
			mediumId,
		});

		return mediaSchoolLicense;
	}
}
