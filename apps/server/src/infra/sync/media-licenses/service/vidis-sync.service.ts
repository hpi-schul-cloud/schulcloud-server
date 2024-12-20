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

			const mediumId = `${item.offerId}`;

			const officialSchoolNumbers = item.schoolActivations.map((activation) => this.removePrefix(activation));

			let existingLicenses: MediaSchoolLicense[] =
				await this.mediaSchoolLicenseService.findMediaSchoolLicensesByMediumId(mediumId);

			if (existingLicenses.length) {
				await this.removeNoLongerAvailableLicenses(existingLicenses, officialSchoolNumbers);
				existingLicenses = await this.mediaSchoolLicenseService.findMediaSchoolLicensesByMediumId(mediumId);
			}

			const saveNewLicensesPromises: Promise<void>[] = officialSchoolNumbers.map(
				async (schoolNumber: string): Promise<void> => {
					const school: School | null = await this.schoolService.getSchoolByOfficialSchoolNumber(schoolNumber);

					if (!school) {
						this.logger.info(new SchoolForSchoolMediaLicenseSyncNotFoundLoggable(schoolNumber));
					} else {
						const isExistingLicense = !!existingLicenses.find(
							(license: MediaSchoolLicense): boolean => license.schoolId === school.id
						);
						if (!isExistingLicense) {
							const newLicense: MediaSchoolLicense = new MediaSchoolLicense({
								id: new ObjectId().toHexString(),
								type: SchoolLicenseType.MEDIA_LICENSE,
								schoolId: school.id,
								mediaSource,
								mediumId,
							});
							await this.mediaSchoolLicenseService.saveMediaSchoolLicense(newLicense);
						}
					}
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
	): Promise<void> {
		const vidisSchoolNumberSet = new Set(schoolNumbersFromVidis);

		const removalPromises: Promise<void>[] = existingLicenses.map(async (license: MediaSchoolLicense) => {
			const school = await this.schoolService.getSchoolById(license.schoolId);
			if (!school.officialSchoolNumber) {
				return;
			}

			const isLicenseNoLongerInVidis = !vidisSchoolNumberSet.has(school.officialSchoolNumber);
			if (isLicenseNoLongerInVidis) {
				await this.mediaSchoolLicenseService.deleteSchoolLicense(license);
			}
		});

		await Promise.all(removalPromises);
	}
}
