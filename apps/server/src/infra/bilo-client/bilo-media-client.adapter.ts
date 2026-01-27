import { AxiosErrorLoggable } from '@core/error/loggable';
import { Logger } from '@core/logger';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import {
	MediaSource,
	MediaSourceDataFormat,
	MediaSourceOauthConfig,
	MediaSourceOauthConfigNotFoundLoggableException,
} from '@modules/media-source';
import {
	ClientCredentialsGrantTokenRequest,
	OauthAdapterService,
	OAuthGrantType,
	OAuthTokenDto,
} from '@modules/oauth-adapter';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { AxiosResponse, isAxiosError } from 'axios';
import { plainToClass } from 'class-transformer';
import { isURL, validate, ValidationError } from 'class-validator';
import { lastValueFrom } from 'rxjs';
import { MediaQueryBadResponseReport } from './interface';
import {
	BiloBadRequestResponseLoggableException,
	BiloMediaQueryBadResponseLoggable,
	BiloMediaQueryBadResponseLoggableException,
	BiloMediaQueryUnprocessableResponseLoggableException,
	BiloNotFoundResponseLoggableException,
} from './loggable';
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

	public async fetchMediumMetadata(id: string, biloMediaSource: MediaSource): Promise<BiloMediaQueryDataResponse> {
		if (!biloMediaSource.oauthConfig) {
			throw new MediaSourceOauthConfigNotFoundLoggableException(
				biloMediaSource.id,
				MediaSourceDataFormat.BILDUNGSLOGIN
			);
		}

		const url: string = this.constructUrl(biloMediaSource.oauthConfig.baseUrl, './query');
		const body: BiloMediaQueryBodyParams[] = [{ id }];
		const token: OAuthTokenDto = await this.fetchAccessToken(biloMediaSource.oauthConfig);

		const axiosResponse = await this.sendPostRequest<BiloMediaQueryResponse[]>(url, body, token.accessToken);

		if (!axiosResponse.data.length) {
			throw new BiloMediaQueryUnprocessableResponseLoggableException();
		}

		await this.validateResponse(axiosResponse.data[0]);

		const metadata: BiloMediaQueryDataResponse = axiosResponse.data[0].data;
		return metadata;
	}

	public async fetchMediaMetadata(
		mediumIds: string[],
		biloMediaSource: MediaSource
	): Promise<BiloMediaQueryDataResponse[]> {
		if (!biloMediaSource.oauthConfig) {
			throw new MediaSourceOauthConfigNotFoundLoggableException(
				biloMediaSource.id,
				MediaSourceDataFormat.BILDUNGSLOGIN
			);
		}

		const url: string = this.constructUrl(biloMediaSource.oauthConfig.baseUrl, './query');
		const body: BiloMediaQueryBodyParams[] = mediumIds.map((id: string): BiloMediaQueryBodyParams => {
			return { id };
		});
		const token: OAuthTokenDto = await this.fetchAccessToken(biloMediaSource.oauthConfig);

		const axiosResponse = await this.sendPostRequest<BiloMediaQueryResponse[]>(url, body, token.accessToken);

		const validResponses = await this.validateAndFilterMediaQueryResponses(axiosResponse.data);
		const metadataItems: BiloMediaQueryDataResponse[] = validResponses.map(
			(response: BiloMediaQueryResponse) => response.data
		);

		return metadataItems;
	}

	private async fetchAccessToken(mediaSourceOauthConfig: MediaSourceOauthConfig): Promise<OAuthTokenDto> {
		const credentials = new ClientCredentialsGrantTokenRequest({
			client_id: mediaSourceOauthConfig.clientId,
			client_secret: this.encryptionService.decrypt(mediaSourceOauthConfig.clientSecret),
			grant_type: OAuthGrantType.CLIENT_CREDENTIALS_GRANT,
		});

		const accessToken: OAuthTokenDto = await this.oauthAdapterService.sendTokenRequest(
			mediaSourceOauthConfig.authEndpoint,
			credentials
		);

		return accessToken;
	}

	private async validateAndFilterMediaQueryResponses(
		responses: BiloMediaQueryResponse[]
	): Promise<BiloMediaQueryResponse[]> {
		if (!Array.isArray(responses)) {
			throw new BiloMediaQueryUnprocessableResponseLoggableException();
		}

		const validResponses: BiloMediaQueryResponse[] = [];
		const badResponseReports: MediaQueryBadResponseReport[] = [];

		const validatePromises = responses.map(async (response: BiloMediaQueryResponse): Promise<void> => {
			if (response.status !== 200) {
				badResponseReports.push({ mediumId: response.query.id, status: response.status, validationErrors: [] });
				return;
			}

			this.validateAndCorrectCoverUrls(response);

			const validationErrors: ValidationError[] = await validate(plainToClass(BiloMediaQueryResponse, response));
			if (validationErrors.length > 0) {
				badResponseReports.push({ mediumId: response.query.id, status: response.status, validationErrors });
				return;
			}

			validResponses.push(response);
		});

		await Promise.all(validatePromises);

		if (badResponseReports.length) {
			this.logger.debug(new BiloMediaQueryBadResponseLoggable(badResponseReports));
		}

		return validResponses;
	}

	private async validateResponse(response: BiloMediaQueryResponse): Promise<void> {
		if (response.status === 400) {
			throw new BiloBadRequestResponseLoggableException();
		}

		if (response.status === 404) {
			throw new BiloNotFoundResponseLoggableException();
		}

		if (!response.data) {
			throw new BiloMediaQueryUnprocessableResponseLoggableException();
		}

		this.validateAndCorrectCoverUrls(response);

		const validationErrors: ValidationError[] = await validate(plainToClass(BiloMediaQueryResponse, response));
		if (validationErrors.length > 0) {
			throw new BiloMediaQueryBadResponseLoggableException([
				{ mediumId: response.query.id, status: response.status, validationErrors },
			]);
		}
	}

	private validateAndCorrectCoverUrls(response: BiloMediaQueryResponse): ValidationError | void {
		if (!isURL(response.data.coverSmall.href) && !isURL(response.data.cover.href)) {
			// non-valid URLs should return empty strings (FE loads default logo instead)
			response.data.coverSmall.href = '';
			response.data.cover.href = '';
		} else {
			if (!isURL(response.data.coverSmall.href)) {
				response.data.coverSmall.href = response.data.cover.href;
			} else if (!isURL(response.data.cover.href)) {
				response.data.cover.href = response.data.coverSmall.href;
			}
		}
	}

	private async sendPostRequest<T>(
		url: string,
		body: BiloMediaQueryBodyParams[],
		accessToken: string
	): Promise<AxiosResponse<T>> {
		try {
			const response = await lastValueFrom(
				this.httpService.post<T>(url, body, {
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/vnd.de.bildungslogin.mediaquery+json',
					},
				})
			);
			return response;
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				throw new AxiosErrorLoggable(error, 'BILO_GET_MEDIA_METADATA_FAILED');
			} else {
				throw error;
			}
		}
	}

	private constructUrl(baseUrl: string, path: string): string {
		return new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();
	}
}
