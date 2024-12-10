import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { MediaSource } from '@src/modules/mediasource/domain';
import { MediaSourceRepo } from '@src/modules/mediasource/repo';
import { SchoolService } from '@src/modules/school';
import { Logger } from '@src/core/logger';
import { MediaSchoolLicense } from '../domain';
import { VidisItemDto } from '../dto';
import { SchoolLicenseType } from '../enum';
import { SchoolForSchoolMediaLicenseSyncNotFoundLoggable } from '../loggable/school-for-school-media-license-sync-not-found.loggable';
import { MediaSchoolLicenseRepo } from '../repo/media-school-license-repo';

@Injectable()
export class MediaSchoolLicenseService {
	constructor(
		private readonly mediaSchoolLicenseRepo: MediaSchoolLicenseRepo,
		private readonly mediaSourceRepo: MediaSourceRepo,
		private readonly schoolService: SchoolService,
		private readonly logger: Logger
	) {}

	public async syncMediaSchoolLicenses(mediaSource: MediaSource, items: VidisItemDto[]): Promise<void> {
		items.map(async (item: VidisItemDto) => {
			const { schoolActivations } = item;
			const schoolActivationsSet = new Set(schoolActivations.map((activation) => this.removePrefix(activation)));
			const mediumId = item.offerId;

			const existingMediaSchoolLicenses: MediaSchoolLicense[] = await this.findMediaSchoolLicensesByMediumId(mediumId);

			// delete existing licenses that are not in schoolActivations
			for await (const license of existingMediaSchoolLicenses) {
				const school = await this.schoolService.getSchoolById(license.schoolId);
				if (!schoolActivationsSet.has(school.officialSchoolNumber ?? '')) {
					await this.deleteSchoolLicense(license);
				}
			}

			schoolActivations.map(async (activation) => {
				const school = await this.schoolService.getSchoolByOfficialSchoolNumber(this.removePrefix(activation));

				if (!school) {
					this.logger.info(new SchoolForSchoolMediaLicenseSyncNotFoundLoggable(activation));
				}

				const existingMediaSchoolLicense = await this.findMediaSchoolLicense(school.id, mediumId);

				if (!existingMediaSchoolLicense) {
					const newSchoolMediaLicense: MediaSchoolLicense = await this.buildLicense(mediaSource, school.id, mediumId);
					await this.saveSchoolLicense(newSchoolMediaLicense);
				}
			});
		});
	}

	public async findMediaSchoolLicense(schoolId: EntityId, mediumId: string): Promise<MediaSchoolLicense> {
		const mediaSchoolLicense: MediaSchoolLicense = await this.mediaSchoolLicenseRepo.findMediaSchoolLicense(
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

	private removePrefix(input: string): string {
		return input.replace(/^.*?(\d{5})$/, '$1');
	}
}
