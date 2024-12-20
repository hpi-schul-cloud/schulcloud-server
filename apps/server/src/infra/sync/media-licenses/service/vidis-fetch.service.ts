import { Inject, Injectable } from '@nestjs/common';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { VidisClientFactory, IDMBetreiberApiInterface, PageOfferDTO, OfferDTO } from '@infra/vidis-client';
import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { MediaSourceBasicAuthConfigNotFoundLoggableException } from '@modules/media-source/loggable';
import { AxiosResponse, isAxiosError } from 'axios';
import { AxiosErrorLoggable } from '@src/core/error/loggable';
import { ConfigService } from '@nestjs/config';
import { VidisSyncConfig } from '../vidis-sync-config';

@Injectable()
export class VidisFetchService {
	constructor(
		private readonly vidisClientFactory: VidisClientFactory,
		private readonly configService: ConfigService<VidisSyncConfig, true>,
		@Inject(DefaultEncryptionService) private readonly encryptionService: EncryptionService
	) {}

	public async getOfferItemsFromVidis(mediaSource: MediaSource): Promise<OfferDTO[]> {
		if (!mediaSource.basicAuthConfig) {
			throw new MediaSourceBasicAuthConfigNotFoundLoggableException(mediaSource.id, MediaSourceDataFormat.VIDIS);
		}

		const vidisClient: IDMBetreiberApiInterface = this.vidisClientFactory.createVidisClient();

		const decryptedUsername = this.encryptionService.decrypt(mediaSource.basicAuthConfig.username);
		const decryptedPassword = this.encryptionService.decrypt(mediaSource.basicAuthConfig.password);
		const basicAuthEncoded = btoa(`${decryptedUsername}:${decryptedPassword}`);

		const region = this.configService.getOrThrow<string>('VIDIS_SYNC_REGION');

		try {
			const axiosResponse: AxiosResponse<PageOfferDTO> = await vidisClient.getActivatedOffersByRegion(
				region,
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
				throw new AxiosErrorLoggable(error, 'VIDIS_GET_OFFER_ITEMS_FAILED');
			} else {
				throw error;
			}
		}
	}
}
