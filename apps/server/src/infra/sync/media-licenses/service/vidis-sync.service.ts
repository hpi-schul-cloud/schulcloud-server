import { MediaSource } from '@modules/media-source';
import { MediaSchoolLicenseService, MediaSchoolLicense, SchoolLicenseType } from '@modules/school-license';
import { School, SchoolService } from '@modules/school';
import { OfferDTO } from '@infra/vidis-client';
import { Logger } from '@core/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { SchoolForSchoolMediaLicenseSyncNotFoundLoggable } from '../loggable';

@Injectable()
export class VidisSyncService {
	constructor(
		private readonly mediaSchoolLicenseService: MediaSchoolLicenseService,
		private readonly schoolService: SchoolService,
		private readonly logger: Logger
	) {}

	public async syncMediaSchoolLicenses(mediaSource: MediaSource, vidisOfferItems: OfferDTO[]): Promise<void> {
		await this.mediaSchoolLicenseService.deleteAllByMediaSource(mediaSource.id);

		const syncItemPromises: Promise<void>[] = vidisOfferItems.map(async (item: OfferDTO): Promise<void> => {
			if (!item.schoolActivations || !item.offerId) {
				return;
			}

			const mediumId = item.offerId.toString();

			const officialSchoolNumbersFromVidis = item.schoolActivations.map((activation) => this.removePrefix(activation));

			await this.createLicenses(officialSchoolNumbersFromVidis, mediaSource, mediumId);
		});

		await Promise.all(syncItemPromises);
	}

	private removePrefix(input: string): string {
		return input.replace(/^.*?(\d{5})$/, '$1');
	}

	private async buildMediaSchoolLicense(
		officialSchoolNumber: string,
		mediaSource: MediaSource,
		mediumId: string
	): Promise<MediaSchoolLicense | null> {
		const school: School | null = await this.schoolService.getSchoolByOfficialSchoolNumber(officialSchoolNumber);

		if (!school) {
			this.logger.info(new SchoolForSchoolMediaLicenseSyncNotFoundLoggable(officialSchoolNumber));
			return null;
		}

		const license: MediaSchoolLicense = new MediaSchoolLicense({
			id: new ObjectId().toHexString(),
			type: SchoolLicenseType.MEDIA_LICENSE,
			schoolId: school.id,
			mediaSource,
			mediumId,
		});

		return license;
	}

	private async createLicenses(
		officialSchoolNumbersFromVidis: string[],
		mediaSource: MediaSource,
		mediumId: string
	): Promise<void> {
		const newLicensesPromises: Promise<MediaSchoolLicense | null>[] = officialSchoolNumbersFromVidis.map(
			async (schoolNumber: string): Promise<MediaSchoolLicense | null> => {
				const newLicense: MediaSchoolLicense | null = await this.buildMediaSchoolLicense(
					schoolNumber,
					mediaSource,
					mediumId
				);

				return newLicense;
			}
		);

		const newLicenses = await Promise.all(newLicensesPromises);
		const filteredLicenses = newLicenses.filter<MediaSchoolLicense>((license: MediaSchoolLicense | null) => !!license);

		if (filteredLicenses.length) {
			await this.mediaSchoolLicenseService.saveAllMediaSchoolLicenses(filteredLicenses);
		}
	}
}
