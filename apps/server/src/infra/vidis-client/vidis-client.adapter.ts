import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { AxiosErrorLoggable } from '@infra/error';
import { Inject, Injectable } from '@nestjs/common';
import { AxiosResponse, isAxiosError } from 'axios';
import { Configuration, IDMBetreiberApiFactory, OfferDTO, PageOfferDTO } from './generated';
import { VidisConfig, VidisMediaSource } from './interface';
import { MediaSourceVidisConfigNotFoundLoggableException } from './loggable';

@Injectable()
export class VidisClientAdapter {
	constructor(@Inject(DefaultEncryptionService) private readonly encryptionService: EncryptionService) {}

	public async getOfferItemsByRegion(mediaSource: VidisMediaSource): Promise<OfferDTO[]> {
		if (!mediaSource.vidisConfig) {
			throw new MediaSourceVidisConfigNotFoundLoggableException(mediaSource.id, 'VIDIS');
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

	public async getOfferItemsBySchoolName(mediaSource: VidisMediaSource, schoolName: string): Promise<OfferDTO[]> {
		if (!mediaSource.vidisConfig) {
			throw new MediaSourceVidisConfigNotFoundLoggableException(mediaSource.id, 'VIDIS');
		}

		const { vidisConfig } = mediaSource;
		const api = IDMBetreiberApiFactory(
			new Configuration({
				basePath: vidisConfig.baseUrl,
			})
		);

		try {
			const axiosResponse: AxiosResponse<PageOfferDTO> = await api.getActivatedOffersBySchool(
				schoolName,
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
				throw new AxiosErrorLoggable(error, 'VIDIS_GET_OFFER_ITEMS_FOR_SCHOOL_FAILED');
			} else {
				throw error;
			}
		}
	}

	private buildAuthHeaderValue(vidisConfig: VidisConfig): string {
		const decryptedUsername = this.encryptionService.decrypt(vidisConfig.username);
		const decryptedPassword = this.encryptionService.decrypt(vidisConfig.password);

		const encodedCredentials = btoa(`${decryptedUsername}:${decryptedPassword}`);

		const basicAuthHeaderValue = `Basic ${encodedCredentials}`;

		return basicAuthHeaderValue;
	}
}
