import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import {
	MediaSourceForSyncNotFoundLoggableException,
	SchoolForSchoolMediaLicenseSyncNotFoundLoggable,
} from '@infra/sync/media-licenses/loggable';
import { IDMBetreiberApiInterface, OfferDTO, PageOfferDTO, VidisClientFactory } from '@infra/vidis-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { Inject } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { EntityId } from '@shared/domain/types';
import { School, SchoolService } from '@src/modules/school';
import { MediaSource, MediaSourceDataFormat, MediaSourceService } from '@src/modules/media-source';
import { AxiosResponse, isAxiosError } from 'axios';
import { AxiosErrorLoggable } from '../../../core/error/loggable';
import { MediaSourceBasicAuthConfigNotFoundLoggableException } from '../../media-source/loggable';
import { MediaSchoolLicense } from '../domain';
import { SchoolLicenseType } from '../enum';
import { SchoolNumberNotFoundLoggableException } from '../loggable/school-number-not-found.loggable-exception';
import { MEDIA_SCHOOL_LICENSE_REPO, MediaSchoolLicenseRepo } from '../repo';

export class MediaSchoolLicenseService {
	constructor(
		@Inject(MEDIA_SCHOOL_LICENSE_REPO) private readonly mediaSchoolLicenseRepo: MediaSchoolLicenseRepo,
		private readonly schoolService: SchoolService,
		private readonly logger: Logger,
		private readonly vidisClientFactory: VidisClientFactory,
		private readonly mediaSourceService: MediaSourceService,
		@Inject(DefaultEncryptionService) private readonly encryptionService: EncryptionService
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
		const school = await this.schoolService.getSchoolById(schoolId);

		if (!school) {
			this.logger.info(new SchoolForSchoolMediaLicenseSyncNotFoundLoggable(schoolId));
		}

		// const prefix: string = school.getProps().federalState.getProps().abbreviation;
		const prefix: string =
			school.getProps().federalState.getProps().abbreviation === 'NI' ? 'DE-VIDIS-vidis_test' : 'FAILING';
		const { officialSchoolNumber } = school;
		if (!officialSchoolNumber) {
			throw new SchoolNumberNotFoundLoggableException(schoolId);
		}
		const schoolname = `${prefix}_${officialSchoolNumber}`;

		const mediaSource: MediaSource | null = await this.mediaSourceService.findByFormat(MediaSourceDataFormat.VIDIS);

		if (!mediaSource) {
			throw new MediaSourceForSyncNotFoundLoggableException(MediaSourceDataFormat.VIDIS);
		}

		const offersFromMediaSource: OfferDTO[] = await this.fetchOffersForSchoolFromVidis(mediaSource, schoolname);

		await this.deleteAllBySchoolAndMediaSource(schoolId, mediaSource.id);

		await this.createLicenses(offersFromMediaSource, mediaSource, school);
	}

	private async buildMediaSchoolLicense(
		school: School,
		mediaSource: MediaSource,
		mediumId: number | undefined
	): Promise<MediaSchoolLicense | null> {
		if (!mediumId) {
			// TODO: Log this?
			// this.logger.info(new OfferIdNotFoundLoggableException());
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

	private async fetchOffersForSchoolFromVidis(mediaSource: MediaSource, schoolName: string): Promise<OfferDTO[]> {
		if (!mediaSource.basicAuthConfig) {
			throw new MediaSourceBasicAuthConfigNotFoundLoggableException(mediaSource.id, MediaSourceDataFormat.VIDIS);
		}

		const vidisClient: IDMBetreiberApiInterface = this.vidisClientFactory.createVidisClient();

		const decryptedUsername = this.encryptionService.decrypt(mediaSource.basicAuthConfig.username);
		const decryptedPassword = this.encryptionService.decrypt(mediaSource.basicAuthConfig.password);
		const basicAuthEncoded = btoa(`${decryptedUsername}:${decryptedPassword}`);

		try {
			const axiosResponse: AxiosResponse<PageOfferDTO> = await vidisClient.getActivatedOffersBySchool(
				schoolName,
				undefined,
				undefined,
				{
					headers: { Authorization: `Basic ${basicAuthEncoded}` },
				}
			);
			const offerItems: OfferDTO[] = axiosResponse.data.items ?? [];

			return offerItems;
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				throw new AxiosErrorLoggable(error, 'VIDIS_GET_OFFER_ITEMS_FOR_SCHOOL_FAILED');
			} else {
				throw error;
			}
		}
	}
}
