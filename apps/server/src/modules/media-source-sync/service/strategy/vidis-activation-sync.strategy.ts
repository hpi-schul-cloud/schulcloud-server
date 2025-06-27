import { Logger } from '@core/logger';
import { OfferDTO, SchoolActivationDTO, VidisClientAdapter } from '@infra/vidis-client';
import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { School, SchoolService } from '@modules/school';
import { MediaSchoolLicense, MediaSchoolLicenseService, SchoolLicenseType } from '@modules/school-license';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { MediaSourceSyncOperationReportFactory, MediaSourceSyncReportFactory } from '../../factory';
import { MediaActivationSyncStrategy, MediaSourceSyncReport } from '../../interface';
import { SchoolForMediaActivationSyncNotFoundLoggable } from '../../loggable';
import { MediaSourceSyncOperation } from '../../types';

@Injectable()
export class VidisActivationSyncStrategy implements MediaActivationSyncStrategy {
	constructor(
		private readonly mediaSchoolLicenseService: MediaSchoolLicenseService,
		private readonly schoolService: SchoolService,
		private readonly vidisClientAdapter: VidisClientAdapter,
		private readonly logger: Logger
	) {}

	public getMediaSourceFormat(): MediaSourceDataFormat {
		return MediaSourceDataFormat.VIDIS;
	}

	public async syncAllMediaActivations(mediaSource: MediaSource): Promise<MediaSourceSyncReport> {
		const vidisOfferItems = await this.vidisClientAdapter.getOfferItemsByRegion(mediaSource);

		await this.mediaSchoolLicenseService.deleteAllByMediaSource(mediaSource.id);

		const schoolNumberPrefix: string = mediaSource.vidisConfig?.schoolNumberPrefix || '';

		const createSuccess = MediaSourceSyncOperationReportFactory.buildWithSuccessStatus(MediaSourceSyncOperation.CREATE);

		const syncItemPromises: Promise<void>[] = vidisOfferItems.map(async (item: OfferDTO): Promise<void> => {
			if (!item.schoolActivations || !item.offerId) {
				return;
			}

			const mediumId: string = item.offerId.toString();

			const officialSchoolNumbersFromVidis: string[] = item.schoolActivations.map(
				(activation: SchoolActivationDTO): string => activation.regionName.replace(schoolNumberPrefix, '')
			);

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

			createSuccess.count += filteredLicenses.length;
		});

		await Promise.all(syncItemPromises);

		const syncReport = MediaSourceSyncReportFactory.buildFromOperations([createSuccess]);
		return syncReport;
	}

	private async buildMediaSchoolLicense(
		officialSchoolNumber: string,
		mediaSource: MediaSource,
		mediumId: string
	): Promise<MediaSchoolLicense | null> {
		const school: School | null = await this.schoolService.getSchoolByOfficialSchoolNumber(officialSchoolNumber);

		if (!school) {
			this.logger.info(new SchoolForMediaActivationSyncNotFoundLoggable(officialSchoolNumber));
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
}
