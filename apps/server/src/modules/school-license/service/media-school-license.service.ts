import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { MediaSource } from '@src/modules/mediasource/domain';
import { MediaSourceRepo } from '@src/modules/mediasource/repo';
import { School, SchoolService } from '@src/modules/school';
import { Logger } from '@src/core/logger';
import { MediaSchoolLicense } from '../domain';
import { VidisItemDto } from '../dto';
import { SchoolLicenseType } from '../enum';
import { SchoolForSchoolMediaLicenseSyncNotFoundLoggable } from '../loggable';
import { MediaSchoolLicenseRepo } from '../repo';

@Injectable()
export class MediaSchoolLicenseService {
	constructor(
		private readonly mediaSchoolLicenseRepo: MediaSchoolLicenseRepo,
		private readonly mediaSourceRepo: MediaSourceRepo,
		private readonly schoolService: SchoolService,
		private readonly logger: Logger
	) {}

	public async syncMediaSchoolLicenses(mediaSource: MediaSource, items: VidisItemDto[]): Promise<void> {
		for (const item of items) {
			const schoolNumbers = item.schoolActivations.map((activation) => this.removePrefix(activation));
			const schoolActivationsSet = new Set(schoolNumbers);

			const existingLicenses: MediaSchoolLicense[] = await this.findMediaSchoolLicensesByMediumId(item.offerId);
			if (existingLicenses.length) {
				await this.updateMediaSchoolLicenses(existingLicenses, schoolActivationsSet);
			}

			for (const schoolNumber of schoolNumbers) {
				const school: School | null = await this.schoolService.getSchoolByOfficialSchoolNumber(schoolNumber);

				if (!school) {
					this.logger.info(new SchoolForSchoolMediaLicenseSyncNotFoundLoggable(schoolNumber));
				} else {
					const existingLicense: MediaSchoolLicense | null = await this.findMediaSchoolLicense(school.id, item.offerId);
					if (!existingLicense) {
						const newLicense: MediaSchoolLicense = this.buildLicense(mediaSource, school.id, item.offerId);
						await this.saveSchoolLicense(newLicense);
					}
				}
			}
		}
	}

	private async findMediaSchoolLicense(schoolId: EntityId, mediumId: string): Promise<MediaSchoolLicense | null> {
		const mediaSchoolLicense: MediaSchoolLicense | null = await this.mediaSchoolLicenseRepo.findMediaSchoolLicense(
			schoolId,
			mediumId
		);

		return mediaSchoolLicense;
	}

	private async saveSchoolLicense(license: MediaSchoolLicense): Promise<void> {
		await this.mediaSchoolLicenseRepo.save(license);
	}

	private async deleteSchoolLicense(license: MediaSchoolLicense): Promise<void> {
		await this.mediaSchoolLicenseRepo.delete(license);
	}

	private async findMediaSchoolLicensesByMediumId(mediumId: string): Promise<MediaSchoolLicense[]> {
		const mediaSchoolLicenses: MediaSchoolLicense[] =
			await this.mediaSchoolLicenseRepo.findMediaSchoolLicensesByMediumId(mediumId);

		return mediaSchoolLicenses;
	}

	private buildLicense(mediaSource: MediaSource, schoolId: EntityId, mediumId: string): MediaSchoolLicense {
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

	private async updateMediaSchoolLicenses(
		existingLicenses: MediaSchoolLicense[],
		schoolActivationsSet: Set<string>
	): Promise<void> {
		await Promise.all(
			existingLicenses.map(async (license) => {
				const school = await this.schoolService.getSchoolById(license.schoolId);
				if (!schoolActivationsSet.has(school.officialSchoolNumber ?? '')) {
					await this.deleteSchoolLicense(license);
				}
			})
		);
	}
}
