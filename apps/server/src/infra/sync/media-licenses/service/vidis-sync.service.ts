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
				existingLicenses.reduce((acc: string[], license: MediaSchoolLicense) => {
					if (license.school.officialSchoolNumber) {
						acc.push(license.school.officialSchoolNumber);
					}
					return acc;
				}, [] as string[])
			);

			const saveNewLicensesPromises: Promise<void>[] = officialSchoolNumbers.map(
				async (schoolNumber: string): Promise<void> => {
					await this.saveNonExistingLicense(existingLicenseSchoolNumberSet, schoolNumber, mediaSource, mediumId);
				}
			);

			await Promise.all(saveNewLicensesPromises);
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

		const removalPromises: Promise<MediaSchoolLicense | null>[] = existingLicenses.map(
			async (license: MediaSchoolLicense) => {
				if (!license.school.officialSchoolNumber) {
					await this.mediaSchoolLicenseService.deleteSchoolLicense(license);
					return null;
				}

				const isLicenseNoLongerInVidis = !vidisSchoolNumberSet.has(license.school.officialSchoolNumber);
				if (isLicenseNoLongerInVidis) {
					await this.mediaSchoolLicenseService.deleteSchoolLicense(license);
					return null;
				}

				return license;
			}
		);

		const availableLicensesWithNull = await Promise.all(removalPromises);
		return availableLicensesWithNull.filter((license: MediaSchoolLicense | null) => !!license);
	}

	private async saveNonExistingLicense(
		existingLicenseSchoolNumberSet: Set<string>,
		officialSchoolNumber: string,
		mediaSource: MediaSource,
		mediumId: string
	): Promise<void> {
		if (existingLicenseSchoolNumberSet.has(officialSchoolNumber)) {
			return;
		}

		const school: School | null = await this.schoolService.getSchoolByOfficialSchoolNumber(officialSchoolNumber);

		if (!school) {
			this.logger.info(new SchoolForSchoolMediaLicenseSyncNotFoundLoggable(officialSchoolNumber));
		} else {
			const newLicense: MediaSchoolLicense = new MediaSchoolLicense({
				id: new ObjectId().toHexString(),
				type: SchoolLicenseType.MEDIA_LICENSE,
				school,
				mediaSource,
				mediumId,
			});
			await this.mediaSchoolLicenseService.saveMediaSchoolLicense(newLicense);
		}
	}
}
