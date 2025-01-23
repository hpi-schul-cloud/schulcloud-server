import { Logger } from '@core/logger';
import { OfferDTO } from '@infra/vidis-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { Inject } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { MediaSource, MediaSourceDataFormat, MediaSourceService } from '@modules/media-source';
import { School, SchoolService } from '@modules/school';
import { MediaSchoolLicense } from '../domain';
import { SchoolLicenseType } from '../enum';
import {
	BuildMediaSchoolLicenseFailedLoggable,
	FederalStateAbbreviationOfSchoolNotFoundLoggableException,
	MediaSourceNotFoundLoggableException,
	SchoolNumberNotFoundLoggableException,
} from '../loggable';
import { MEDIA_SCHOOL_LICENSE_REPO, MediaSchoolLicenseRepo } from '../repo';
import { MediaSchoolLicenseFetchService } from './media-school-license-fetch.service';

export class MediaSchoolLicenseService {
	constructor(
		@Inject(MEDIA_SCHOOL_LICENSE_REPO) private readonly mediaSchoolLicenseRepo: MediaSchoolLicenseRepo,
		private readonly schoolService: SchoolService,
		private readonly logger: Logger,
		private readonly mediaSourceService: MediaSourceService,
		private readonly mediaSchoolLicenseFetchService: MediaSchoolLicenseFetchService
	) {}

	public async deleteAllByMediaSource(mediaSourceId: EntityId): Promise<number> {
		const deleteCount: number = await this.mediaSchoolLicenseRepo.deleteAllByMediaSource(mediaSourceId);

		return deleteCount;
	}

	public async saveAllMediaSchoolLicenses(licenses: MediaSchoolLicense[]): Promise<MediaSchoolLicense[]> {
		const mediaSchoolLicenses: MediaSchoolLicense[] = await this.mediaSchoolLicenseRepo.saveAll(licenses);

		return mediaSchoolLicenses;
	}

	public async deleteAllBySchoolAndMediaSource(schoolId: EntityId, mediaSourceId: EntityId): Promise<number> {
		const deleteCount: number = await this.mediaSchoolLicenseRepo.deleteAllBySchoolAndMediaSource(
			schoolId,
			mediaSourceId
		);

		return deleteCount;
	}

	public async updateMediaSchoolLicenses(schoolId: EntityId): Promise<void> {
		const school: School = await this.schoolService.getSchoolById(schoolId);

		const abbreviation: string | undefined = school.getProps().federalState?.getProps().abbreviation;
		const { officialSchoolNumber } = school;

		if (!abbreviation) {
			throw new FederalStateAbbreviationOfSchoolNotFoundLoggableException(schoolId);
		}

		if (!officialSchoolNumber) {
			throw new SchoolNumberNotFoundLoggableException(schoolId);
		}

		const schoolName = `${abbreviation}_${officialSchoolNumber}`;

		const mediaSource: MediaSource | null = await this.mediaSourceService.findByFormat(MediaSourceDataFormat.VIDIS);

		if (!mediaSource) {
			throw new MediaSourceNotFoundLoggableException(MediaSourceDataFormat.VIDIS);
		}

		const offersFromMediaSource: OfferDTO[] = await this.mediaSchoolLicenseFetchService.fetchOffersForSchoolFromVidis(
			mediaSource,
			schoolName
		);

		await this.deleteAllBySchoolAndMediaSource(schoolId, mediaSource.id);

		await this.createLicenses(offersFromMediaSource, mediaSource, school);
	}

	private async buildMediaSchoolLicense(
		school: School,
		mediaSource: MediaSource,
		mediumId: number | undefined
	): Promise<MediaSchoolLicense | null> {
		if (!mediumId) {
			this.logger.info(new BuildMediaSchoolLicenseFailedLoggable());

			return null;
		}

		const license: MediaSchoolLicense = new MediaSchoolLicense({
			id: new ObjectId().toHexString(),
			type: SchoolLicenseType.MEDIA_LICENSE,
			school,
			mediaSource,
			mediumId: mediumId.toString(),
		});

		return license;
	}

	private async createLicenses(offers: OfferDTO[], mediaSource: MediaSource, school: School): Promise<void> {
		const newLicensesPromises: Promise<MediaSchoolLicense | null>[] = offers.map(
			async (offer): Promise<MediaSchoolLicense | null> => {
				const newLicense: MediaSchoolLicense | null = await this.buildMediaSchoolLicense(
					school,
					mediaSource,
					offer.offerId
				);

				return newLicense;
			}
		);

		const newLicenses = await Promise.all(newLicensesPromises);
		const filteredLicenses = newLicenses.filter((license): license is MediaSchoolLicense => license !== null);

		if (filteredLicenses.length) {
			await this.saveAllMediaSchoolLicenses(filteredLicenses);
		}
	}
}
