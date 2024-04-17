import { HttpService } from '@nestjs/axios';
import { Logger } from '@src/core/logger';
import { AxiosResponse } from 'axios';
import QueryString from 'qs';
import { lastValueFrom, Observable } from 'rxjs';
import { EthepadApiInterface } from './etherpad-api.interface';
import { EtherpadRestClientOptions } from './etherpad-rest-client-options';
import {
	EtherpadAuthorPadsResponse,
	EtherpadAuthorResponse,
	EtherpadAuthorSessionsResponse,
	EtherpadAuthorsOfPadResponse,
	EtherpadDeleteResponse,
	EtherpadGroupResponse,
} from './response';
import {
	EtherpadConfigurationMissingLoggable,
	EtherpadCookiesConfigurationMissingLoggable,
	MissingCookie,
} from './loggable';

export class EtherpadRestClient implements EthepadApiInterface {
	private readonly ETHERPAD_URI: string;

	private readonly ETHERPAD_API_KEY: string;

	constructor(
		private readonly options: EtherpadRestClientOptions,
		private readonly httpService: HttpService,
		private readonly logger: Logger
	) {
		this.checkOptions();
		this.ETHERPAD_URI = options.apiUri;
		this.ETHERPAD_API_KEY = options.apiKey;
	}

	public async createOrGetAuthor(authorMapper: string, name: string): Promise<EtherpadAuthorResponse> {
		const params = {
			apiKey: this.ETHERPAD_API_KEY,
			name,
			authorMapper,
		};
		const url = this.prepareUrl('createAuthorIfNotExistsFor', params);

		const response: Promise<EtherpadAuthorResponse> = this.getRequest<EtherpadAuthorResponse>(url);

		return response;
	}

	public async createOrGetGroup(groupMapper: string): Promise<EtherpadGroupResponse> {
		const params = {
			apiKey: this.ETHERPAD_API_KEY,
			groupMapper,
		};
		const url = this.prepareUrl('createGroupIfNotExistsFor', params);

		const response: Promise<EtherpadGroupResponse> = this.getRequest<EtherpadGroupResponse>(url);

		return response;
	}

	public async listPadsOfAuthor(authorID: string): Promise<EtherpadAuthorPadsResponse> {
		const params = {
			apiKey: this.ETHERPAD_API_KEY,
			authorID,
		};
		const url = this.prepareUrl('listPadsOfAuthor', params);

		const response: Promise<EtherpadAuthorPadsResponse> = this.getRequest<EtherpadAuthorPadsResponse>(url);

		return response;
	}

	public async listAuthorsOfPad(padID: string): Promise<EtherpadAuthorsOfPadResponse> {
		const params = {
			apiKey: this.ETHERPAD_API_KEY,
			padID,
		};
		const url = this.prepareUrl('listAuthorsOfPad', params);

		const response: Promise<EtherpadAuthorsOfPadResponse> = this.getRequest<EtherpadAuthorsOfPadResponse>(url);

		return response;
	}

	public async listSessionsOfAuthor(authorID: string): Promise<EtherpadAuthorSessionsResponse> {
		const params = {
			apiKey: this.ETHERPAD_API_KEY,
			authorID,
		};
		const url = this.prepareUrl('listSessionsOfAuthor', params);

		const response: Promise<EtherpadAuthorSessionsResponse> = this.getRequest<EtherpadAuthorSessionsResponse>(url);

		return response;
	}

	public async deleteSession(sessionID: string): Promise<EtherpadDeleteResponse> {
		const params = {
			apiKey: this.ETHERPAD_API_KEY,
			sessionID,
		};
		const url = this.prepareUrl('deleteSession', params);

		const response: Promise<EtherpadDeleteResponse> = this.getRequest<EtherpadDeleteResponse>(url);

		return response;
	}

	public async deletePad(padID: string): Promise<EtherpadDeleteResponse> {
		const params = {
			apiKey: this.ETHERPAD_API_KEY,
			padID,
		};
		const url = this.prepareUrl('deletePad', params);

		const response: Promise<EtherpadDeleteResponse> = this.getRequest<EtherpadDeleteResponse>(url);

		return response;
	}

	private checkOptions(): void {
		if (!this.options.apiUri || !this.options.apiKey) {
			this.logger.debug(new EtherpadConfigurationMissingLoggable());
		}
		if (!this.options.cookieExpirationInSeconds) {
			const cookieValue = 28800;
			this.logger.debug(new EtherpadCookiesConfigurationMissingLoggable(cookieValue, MissingCookie.cookieExpiration));
			this.options.cookieExpirationInSeconds = cookieValue;
		}

		if (!this.options.cookieReleaseThreshold) {
			const cookieValue = 7200;
			this.logger.debug(
				new EtherpadCookiesConfigurationMissingLoggable(cookieValue, MissingCookie.cookieReleaseThreshold)
			);
			this.options.cookieExpirationInSeconds = cookieValue;
		}
	}

	private async getRequest<T>(url: URL): Promise<T> {
		const observable: Observable<AxiosResponse<T>> = this.httpService.get(url.toString());

		const responseToken: AxiosResponse<T> = await lastValueFrom(observable);

		return responseToken.data;
	}

	private prepareUrl(endpoint: string, params: object): URL {
		const url: URL = new URL(`${this.ETHERPAD_URI}/${endpoint}`);
		url.search = QueryString.stringify(params);
		return url;
	}
}
