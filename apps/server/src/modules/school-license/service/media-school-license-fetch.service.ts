import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { IDMBetreiberApiInterface, OfferDTO, PageOfferDTO, VidisClientFactory } from '@infra/vidis-client';
import { Inject } from '@nestjs/common';
import { AxiosResponse, isAxiosError } from 'axios';
import { AxiosErrorLoggable } from '@core/error/loggable';
import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { MediaSourceBasicAuthConfigNotFoundLoggableException } from '@modules/media-source/loggable';

export class MediaSchoolLicenseFetchService {
	constructor(
		private readonly vidisClientFactory: VidisClientFactory,
		@Inject(DefaultEncryptionService) private readonly encryptionService: EncryptionService
	) {}

	public async fetchOffersForSchoolFromVidis(mediaSource: MediaSource, schoolName: string): Promise<OfferDTO[]> {
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
