import { Logger } from '@core/logger';
import { OfferDTO, VidisClientAdapter } from '@infra/vidis-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { MediaSource, MediaSourceDataFormat, MediaSourceService } from '@modules/media-source';
import { School, SchoolService } from '@modules/school';
import { ExternalToolMedium } from '@modules/tool/external-tool/domain/';
import { Inject } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { MediaSchoolLicense } from '../domain';
import { SchoolLicenseType } from '../enum';
import {
	BuildMediaSchoolLicenseFailedLoggable,
	MediaSourceNotFoundLoggableException,
	SchoolNumberNotFoundLoggableException,
} from '../loggable';
import { MEDIA_SCHOOL_LICENSE_REPO, MediaSchoolLicenseRepo } from '../repo';

export class MediaSchoolLicenseService {
	constructor(
		@Inject(MEDIA_SCHOOL_LICENSE_REPO) private readonly mediaSchoolLicenseRepo: MediaSchoolLicenseRepo,
		private readonly schoolService: SchoolService,
		private readonly logger: Logger,
		private readonly mediaSourceService: MediaSourceService,
		private readonly vidisClientAdapter: VidisClientAdapter
	) {}

	public async deleteAllByMediaSource(mediaSourceId: EntityId): Promise<number> {
		const deleteCount: number = await this.mediaSchoolLicenseRepo.deleteAllByMediaSource(mediaSourceId);

		return deleteCount;
	}

	public async saveAllMediaSchoolLicenses(licenses: MediaSchoolLicense[]): Promise<MediaSchoolLicense[]> {
		const mediaSchoolLicenses: MediaSchoolLicense[] = await this.mediaSchoolLicenseRepo.saveAll(licenses);

		return mediaSchoolLicenses;
	}

	public async findMediaSchoolLicensesBySchoolId(schoolId: string): Promise<MediaSchoolLicense[]> {
		const mediaSchoolLicenses: MediaSchoolLicense[] =
			await this.mediaSchoolLicenseRepo.findMediaSchoolLicensesBySchoolId(schoolId);

		return mediaSchoolLicenses;
	}

	public hasLicenseForExternalTool(
		externalToolMedium: ExternalToolMedium,
		mediaSchoolLicense: MediaSchoolLicense[]
	): boolean {
		return mediaSchoolLicense.some(
			(license: MediaSchoolLicense) =>
				license.mediumId === externalToolMedium.mediumId &&
				license.mediaSource?.sourceId === externalToolMedium.mediaSourceId
		);
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

		const { officialSchoolNumber } = school;

		if (!officialSchoolNumber) {
			throw new SchoolNumberNotFoundLoggableException(schoolId);
		}

		const mediaSource: MediaSource | null = await this.mediaSourceService.findByFormat(MediaSourceDataFormat.VIDIS);

		if (!mediaSource || !mediaSource.vidisConfig) {
			throw new MediaSourceNotFoundLoggableException(MediaSourceDataFormat.VIDIS);
		}

		const schoolName = `${mediaSource.vidisConfig.schoolNumberPrefix}${officialSchoolNumber}`;

		const offersFromMediaSource: OfferDTO[] = await this.vidisClientAdapter.getOfferItemsBySchoolName(
			mediaSource,
			schoolName
		);

		await this.deleteAllBySchoolAndMediaSource(schoolId, mediaSource.id);

		await this.createLicenses(offersFromMediaSource, mediaSource, school);
	}

	private buildMediaSchoolLicense(
		school: School,
		mediaSource: MediaSource,
		mediumId: number | undefined
	): MediaSchoolLicense | null {
		if (!mediumId) {
			this.logger.info(new BuildMediaSchoolLicenseFailedLoggable());

			return null;
		}

		const license: MediaSchoolLicense = new MediaSchoolLicense({
			id: new ObjectId().toHexString(),
			type: SchoolLicenseType.MEDIA_LICENSE,
			schoolId: school.id,
			mediaSource,
			mediumId: mediumId.toString(),
		});

		return license;
	}

	private async createLicenses(offers: OfferDTO[], mediaSource: MediaSource, school: School): Promise<void> {
		const newLicensesPromises: (MediaSchoolLicense | null)[] = offers.map((offer): MediaSchoolLicense | null => {
			const newLicense: MediaSchoolLicense | null = this.buildMediaSchoolLicense(school, mediaSource, offer.offerId);

			return newLicense;
		});

		const newLicenses = await Promise.all(newLicensesPromises);
		const filteredLicenses = newLicenses.filter((license): license is MediaSchoolLicense => license !== null);

		if (filteredLicenses.length) {
			await this.saveAllMediaSchoolLicenses(filteredLicenses);
		}
	}
}
