import { MediaSource } from '@modules/media-source';
import { MediaSchoolLicenseService, MediaSchoolLicense, SchoolLicenseType } from '@modules/school-license';
import { School, SchoolService } from '@modules/school';
import { OfferDTO } from '@infra/vidis-client';
import { Logger } from '@src/core/logger';
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
		const syncItemPromises: Promise<void>[] = vidisOfferItems.map(async (item: OfferDTO): Promise<void> => {
			if (!item.schoolActivations || !item.offerId) {
				return;
			}

			const mediumId = item.offerId.toString();

			const officialSchoolNumbers = item.schoolActivations.map((activation) => this.removePrefix(activation));

			let existingLicenses: MediaSchoolLicense[] = await this.mediaSchoolLicenseService.findAllByMediaSourceAndMediumId(
				mediaSource.id,
				mediumId
			);

			if (existingLicenses.length) {
				existingLicenses = await this.removeNoLongerAvailableLicenses(existingLicenses, officialSchoolNumbers);
			}

			const existingLicenseSchoolNumberSet = new Set(
				existingLicenses.reduce<string[]>((acc: string[], license: MediaSchoolLicense) => {
					if (license.school.officialSchoolNumber) {
						acc.push(license.school.officialSchoolNumber);
					}
					return acc;
				}, [])
			);

			const newLicensesPromises: Promise<MediaSchoolLicense | null>[] = officialSchoolNumbers.map(
				async (schoolNumber: string): Promise<MediaSchoolLicense | null> => {
					if (existingLicenseSchoolNumberSet.has(schoolNumber)) {
						return null;
					}

					const newLicense: MediaSchoolLicense | null = await this.buildMediaSchoolLicense(
						schoolNumber,
						mediaSource,
						mediumId
					);

					return newLicense;
				}
			);

			const newLicenses = await Promise.all(newLicensesPromises);
			const filteredLicenses = newLicenses.filter<MediaSchoolLicense>(
				(license: MediaSchoolLicense | null) => !!license
			);

			if (filteredLicenses.length) {
				await this.mediaSchoolLicenseService.saveAllMediaSchoolLicenses(filteredLicenses);
			}
		});

		await Promise.all(syncItemPromises);
	}

	private removePrefix(input: string): string {
		return input.replace(/^.*?(\d{5})$/, '$1');
	}

	private async removeNoLongerAvailableLicenses(
		existingLicenses: MediaSchoolLicense[],
		schoolNumbersFromVidis: string[]
	): Promise<MediaSchoolLicense[]> {
		const vidisSchoolNumberSet = new Set(schoolNumbersFromVidis);

		const licensesToDelete: MediaSchoolLicense[] = existingLicenses.reduce<MediaSchoolLicense[]>(
			(acc: MediaSchoolLicense[], license: MediaSchoolLicense) => {
				if (!license.school.officialSchoolNumber || !vidisSchoolNumberSet.has(license.school.officialSchoolNumber)) {
					acc.push(license);
				}
				return acc;
			},
			[]
		);

		await this.mediaSchoolLicenseService.deleteSchoolLicenses(licensesToDelete);

		const licensesAfterDelete: MediaSchoolLicense[] = existingLicenses.filter(
			(existingLicense: MediaSchoolLicense) => !licensesToDelete.includes(existingLicense)
		);

		return licensesAfterDelete;
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
			school,
			mediaSource,
			mediumId,
		});

		return license;
	}
}
