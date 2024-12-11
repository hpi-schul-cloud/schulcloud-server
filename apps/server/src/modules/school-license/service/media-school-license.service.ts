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
		items.map(async (item: VidisItemDto) => {
			const { schoolActivations } = item;
			const schoolActivationsSet: Set<string> = new Set(
				schoolActivations.map((activation) => this.removePrefix(activation))
			);

			const existingMediaSchoolLicenses: MediaSchoolLicense[] = await this.findMediaSchoolLicensesByMediumId(
				item.offerId
			);

			// delete existing licenses that are not in schoolActivations
			if (existingMediaSchoolLicenses.length !== 0) {
				await this.updateMediaSchoolLicenses(existingMediaSchoolLicenses, schoolActivationsSet);
			}

			schoolActivations.map(async (activation) => {
				const school: School | null = await this.schoolService.getSchoolByOfficialSchoolNumber(
					this.removePrefix(activation)
				);

				if (!school) {
					this.logger.info(new SchoolForSchoolMediaLicenseSyncNotFoundLoggable(this.removePrefix(activation)));
					return;
				}

				const existingMediaSchoolLicense: MediaSchoolLicense | null = await this.findMediaSchoolLicense(
					school.id,
					item.offerId
				);

				if (!existingMediaSchoolLicense) {
					const newSchoolMediaLicense: MediaSchoolLicense = this.buildLicense(mediaSource, school.id, item.offerId);
					await this.saveSchoolLicense(newSchoolMediaLicense);
				}
			});
		});
	}

	public async findMediaSchoolLicense(schoolId: EntityId, mediumId: string): Promise<MediaSchoolLicense | null> {
		const mediaSchoolLicense: MediaSchoolLicense | null = await this.mediaSchoolLicenseRepo.findMediaSchoolLicense(
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

	public buildLicense(mediaSource: MediaSource, schoolId: EntityId, mediumId: string): MediaSchoolLicense {
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
		existingMediaSchoolLicenses: MediaSchoolLicense[],
		schoolActivationsSet: Set<string>
	): Promise<void> {
		for await (const license of existingMediaSchoolLicenses) {
			const school = await this.schoolService.getSchoolById(license.schoolId);
			if (!schoolActivationsSet.has(school.officialSchoolNumber ?? '')) {
				await this.deleteSchoolLicense(license);
			}
		}
	}
}
