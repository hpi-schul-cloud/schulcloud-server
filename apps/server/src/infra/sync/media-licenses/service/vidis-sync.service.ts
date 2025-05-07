import { Logger } from '@core/logger';
import { OfferDTO, SchoolActivationDTO } from '@infra/vidis-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { MediaSource } from '@modules/media-source';
import { School, SchoolService } from '@modules/school';
import { MediaSchoolLicense, MediaSchoolLicenseService, SchoolLicenseType } from '@modules/school-license';
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

		const schoolNumberPrefix: string = mediaSource.vidisConfig?.schoolNumberPrefix || '';

		const syncItemPromises: Promise<void>[] = vidisOfferItems.map(async (item: OfferDTO): Promise<void> => {
			if (!item.schoolActivations || !item.offerId) {
				return;
			}

			const mediumId: string = item.offerId.toString();

			const officialSchoolNumbersFromVidis: string[] = item.schoolActivations.map(
				(activation: SchoolActivationDTO): string => this.removePrefix(schoolNumberPrefix, activation.regionName)
			);

			await this.createLicenses(officialSchoolNumbersFromVidis, mediaSource, mediumId);
		});

		await Promise.all(syncItemPromises);
	}

	private removePrefix(prefix: string, input: string): string {
		return input.replace(prefix, '');
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
		const filteredLicenses = newLicenses.filter(
			(license: MediaSchoolLicense | null): license is MediaSchoolLicense => !!license
		);

		if (filteredLicenses.length) {
			await this.mediaSchoolLicenseService.saveAllMediaSchoolLicenses(filteredLicenses);
		}
	}
}
