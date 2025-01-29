import { AxiosErrorLoggable } from '@core/error/loggable';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { Configuration, IDMBetreiberApiFactory, OfferDTO, PageOfferDTO } from '@infra/vidis-client';
import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { MediaSourceVidisConfigNotFoundLoggableException } from '@modules/media-source/loggable';
import { Inject } from '@nestjs/common';
import { AxiosResponse, isAxiosError } from 'axios';

export class MediaSchoolLicenseFetchService {
	constructor(@Inject(DefaultEncryptionService) private readonly encryptionService: EncryptionService) {}

	public async fetchOffersForSchoolFromVidis(mediaSource: MediaSource, schoolName: string): Promise<OfferDTO[]> {
		if (!mediaSource.vidisConfig) {
			throw new MediaSourceVidisConfigNotFoundLoggableException(mediaSource.id, MediaSourceDataFormat.VIDIS);
		}

		const { vidisConfig } = mediaSource;
		const api = IDMBetreiberApiFactory(
			new Configuration({
				basePath: vidisConfig.baseUrl,
			})
		);

		const decryptedUsername = this.encryptionService.decrypt(vidisConfig.username);
		const decryptedPassword = this.encryptionService.decrypt(vidisConfig.password);
		const basicAuthEncoded = btoa(`${decryptedUsername}:${decryptedPassword}`);

		try {
			const axiosResponse: AxiosResponse<PageOfferDTO> = await api.getActivatedOffersBySchool(
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
