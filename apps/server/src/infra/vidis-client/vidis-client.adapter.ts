import { AxiosErrorLoggable } from '@core/error/loggable';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import {
	MediaSource,
	MediaSourceDataFormat,
	MediaSourceVidisConfig,
	MediaSourceVidisConfigNotFoundLoggableException,
} from '@modules/media-source';
import { Inject, Injectable } from '@nestjs/common';
import { AxiosResponse, isAxiosError } from 'axios';
import { Configuration, IDMBetreiberApiFactory, OfferDTO, PageOfferDTO } from './generated';

@Injectable()
export class VidisClientAdapter {
	constructor(@Inject(DefaultEncryptionService) private readonly encryptionService: EncryptionService) {}

	public async getOfferItemsByRegion(mediaSource: MediaSource): Promise<OfferDTO[]> {
		if (!mediaSource.vidisConfig) {
			throw new MediaSourceVidisConfigNotFoundLoggableException(mediaSource.id, MediaSourceDataFormat.VIDIS);
		}

		const { vidisConfig } = mediaSource;
		const api = IDMBetreiberApiFactory(
			new Configuration({
				basePath: vidisConfig.baseUrl,
			})
		);

		try {
			const axiosResponse: AxiosResponse<PageOfferDTO> = await api.getActivatedOffersByRegion(
				vidisConfig.region,
				undefined,
				undefined,
				{
					headers: { Authorization: this.buildAuthHeaderValue(vidisConfig) },
				}
			);
			const offerItems: OfferDTO[] = axiosResponse.data.items ?? [];

			return offerItems;
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				throw new AxiosErrorLoggable(error, 'VIDIS_GET_OFFER_ITEMS_FAILED');
			} else {
				throw error;
			}
		}
	}

	private buildAuthHeaderValue(vidisConfig: MediaSourceVidisConfig): string {
		const decryptedUsername = this.encryptionService.decrypt(vidisConfig.username);
		const decryptedPassword = this.encryptionService.decrypt(vidisConfig.password);

		const encodedCredentials = btoa(`${decryptedUsername}:${decryptedPassword}`);

		const basicAuthHeaderValue = `Basic ${encodedCredentials}`;

		return basicAuthHeaderValue;
	}
}
