import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@core/logger';
import { AxiosErrorLoggable } from '@core/error/loggable';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import {
	MediaSource,
	MediaSourceDataFormat,
	MediaSourceOauthConfig,
	MediaSourceOauthConfigNotFoundLoggableException,
} from '@modules/media-source';
import {
	OAuthTokenDto,
	OauthAdapterService,
	OAuthGrantType,
	ClientCredentialsGrantTokenRequest,
} from '@modules/oauth-adapter';
import { lastValueFrom, Observable } from 'rxjs';
import { AxiosResponse, isAxiosError } from 'axios';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { MediaQueryBadResponseReport } from './interface';
import { BiloMediaQueryBadResponseLoggable, BiloMediaQueryBadResponseLoggableException } from './loggable';
import { BiloMediaQueryBodyParams } from './request';
import { BiloMediaQueryDataResponse, BiloMediaQueryResponse } from './response';

@Injectable()
export class BiloMediaClientAdapter {
	constructor(
		private readonly httpService: HttpService,
		private readonly logger: Logger,
		private readonly oauthAdapterService: OauthAdapterService,
		@Inject(DefaultEncryptionService) private readonly encryptionService: EncryptionService
	) {}

	public async fetchMediaMetadata(
		mediumIds: string[],
		biloMediaSource: MediaSource,
		shouldThrowOnAnyBadResponse: boolean
	): Promise<BiloMediaQueryDataResponse[]> {
		if (!biloMediaSource.oauthConfig) {
			throw new MediaSourceOauthConfigNotFoundLoggableException(
				biloMediaSource.id,
				MediaSourceDataFormat.BILDUNGSLOGIN
			);
		}

		const url = new URL(`${biloMediaSource.oauthConfig.baseUrl}/query`);

		const body: BiloMediaQueryBodyParams[] = mediumIds.map((id: string) => ({ id } as BiloMediaQueryBodyParams));

		const token: OAuthTokenDto = await this.fetchAccessToken(biloMediaSource);

		const observable: Observable<AxiosResponse<BiloMediaQueryResponse[]>> = this.httpService.post(
			url.toString(),
			body,
			{
				headers: {
					Authorization: `Bearer ${token.accessToken}`,
					'Content-Type': 'application/vnd.de.bildungslogin.mediaquery+json',
				},
			}
		);

		let axiosResponse: AxiosResponse<BiloMediaQueryResponse[]>;
		try {
			axiosResponse = await lastValueFrom(observable);
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				throw new AxiosErrorLoggable(error, 'BILO_GET_MEDIA_METADATA_FAILED');
			} else {
				throw error;
			}
		}

		const validResponses = await this.validateAndFilterMediaQueryResponses(
			axiosResponse.data,
			shouldThrowOnAnyBadResponse
		);
		const metadataItems: BiloMediaQueryDataResponse[] = validResponses.map(
			(response: BiloMediaQueryResponse) => response.data
		);

		return metadataItems;
	}

	private async fetchAccessToken(mediaSource: MediaSource): Promise<OAuthTokenDto> {
		const oauthConfig = mediaSource.oauthConfig as MediaSourceOauthConfig;

		const credentials = new ClientCredentialsGrantTokenRequest({
			client_id: oauthConfig.clientId,
			client_secret: this.encryptionService.decrypt(oauthConfig.clientSecret),
			grant_type: OAuthGrantType.CLIENT_CREDENTIALS_GRANT,
		});

		const accessToken: OAuthTokenDto = await this.oauthAdapterService.sendTokenRequest(
			oauthConfig.authEndpoint,
			credentials
		);

		return accessToken;
	}

	private async validateAndFilterMediaQueryResponses(
		responses: BiloMediaQueryResponse[],
		shouldThrowOnAnyBadResponse: boolean
	): Promise<BiloMediaQueryResponse[]> {
		const validResponses: BiloMediaQueryResponse[] = [];
		const badResponseReports: MediaQueryBadResponseReport[] = [];

		const validatePromises = responses.map(async (response: BiloMediaQueryResponse): Promise<void> => {
			if (response.status !== 200) {
				badResponseReports.push({ mediumId: response.query.id, status: response.status, validationErrors: [] });
				return;
			}

			const validationErrors: ValidationError[] = await validate(plainToClass(BiloMediaQueryResponse, response));
			if (validationErrors.length > 0) {
				badResponseReports.push({ mediumId: response.query.id, status: response.status, validationErrors });
				return;
			}

			validResponses.push(response);
		});

		await Promise.all(validatePromises);

		if (badResponseReports.length) {
			if (shouldThrowOnAnyBadResponse) {
				throw new BiloMediaQueryBadResponseLoggableException(badResponseReports);
			} else {
				this.logger.debug(new BiloMediaQueryBadResponseLoggable(badResponseReports));
			}
		}

		return validResponses;
	}
}
