import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConverterUtil } from '@shared/common';
import { AxiosResponse } from 'axios';
import crypto from 'crypto';
import { lastValueFrom, Observable } from 'rxjs';
import { ARIX_REST_CLIENT_OPTIONS, ArixRestClientOptions } from './arix-rest-client-options';
import {
	ArixBaseRequest,
	ArixLinkRequest,
	ArixLogoRequest,
	ArixNotchRequest,
	ArixPassphraseActivateRequest,
	ArixPassphraseRequest,
	ArixRecordRequest,
	ArixSearchRequest,
	ArixSearchRequestParams,
} from './request';
import {
	ArixActivateUuidResponse,
	ArixLinkResponse,
	ArixLogoResponse,
	ArixNotchResponse,
	ArixRecordResponse,
	ArixSearchResponse,
	ArixUuidResponse,
} from './response';

/**
 * This is a rest client for the Arix API.
 *
 * https://docs.dbildungscloud.de/display/N21P/EduPool+Overview
 */
@Injectable()
export class ArixRestClient {
	constructor(
		@Inject(ARIX_REST_CLIENT_OPTIONS) private readonly options: ArixRestClientOptions,
		private readonly httpService: HttpService,
		private readonly convertUtil: ConverterUtil
	) {}

	private async postData<T, U>(request: ArixBaseRequest<T>): Promise<U> {
		const xmlRequest: string = this.convertUtil.object2xml(request.data);

		const observable: Observable<AxiosResponse<string>> = this.httpService.post(
			// TODO: handle context
			this.options.apiUrl,
			// TODO: maybe use a builder
			{ xmlstatement: xmlRequest },
			{
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			}
		);
		const axiosResponse: AxiosResponse<string> = await lastValueFrom(observable);

		if (!axiosResponse) {
			throw new InternalServerErrorException('No data received from Arix.');
		} else {
			const response: U = this.convertUtil.xml2object<U>(axiosResponse.data);

			return response;
		}
	}

	private generatePhrase(id: string, secret: string): string {
		const hash: string = crypto.createHash('md5').update(`${id}:${secret}`).digest('hex');

		return hash;
	}

	private async getUUID(arixUser: string): Promise<ArixUuidResponse> {
		const uuidResponsePromise: Promise<ArixUuidResponse> = this.postData<ArixPassphraseRequest, ArixUuidResponse>({
			data: { getpassphrase: { client: arixUser } },
		});

		return uuidResponsePromise;
	}

	private async activateID(uuid: string, passphrase: string): Promise<ArixActivateUuidResponse> {
		const response: ArixActivateUuidResponse = await this.postData<
			ArixPassphraseActivateRequest,
			ArixActivateUuidResponse
		>({
			data: { getpassphrase: { uuid, value: this.generatePhrase(uuid, passphrase) } },
		});

		return response;
	}

	// TODO: do this only when the uuid is expired
	private async getActiveUuid(): Promise<string> {
		// Request 1: Fetch a UUID for the user.
		const uuidResponse: ArixUuidResponse = await this.getUUID(this.options.user);

		// Request 2: Activate the ID with a generated passphrase.
		const arixActivateUuidResponse: ArixActivateUuidResponse = await this.activateID(
			uuidResponse.uuid,
			this.options.password
		);
		if (arixActivateUuidResponse.error) {
			throw new InternalServerErrorException(`Error on activation of id: ${arixActivateUuidResponse.error}`);
		}

		return uuidResponse.uuid;
	}

	public async getMediaRecord(identifier: string, template?: string): Promise<ArixRecordResponse> {
		const uuid: string = await this.getActiveUuid();

		const responsePromise: Promise<ArixRecordResponse> = this.postData<ArixRecordRequest, ArixRecordResponse>({
			data: { record: { user: uuid, identifier, template } },
		});

		return responsePromise;
	}

	public async search(params: ArixSearchRequestParams): Promise<ArixSearchResponse> {
		const uuid: string = await this.getActiveUuid();

		const searchResponsePromise: Promise<ArixSearchResponse> = this.postData<ArixSearchRequest, ArixSearchResponse>({
			data: {
				search: {
					user: uuid,
					fields: params.fields,
					condition: params.condition
						? {
								field: params.condition.field,
								value: params.condition.value,
								operator: params.condition.operator,
								option: params.condition.option,
						  }
						: undefined,
					limit: params.limit,
					eaf: params.eaf,
				},
			},
		});

		return searchResponsePromise;
	}

	public async getMediaLink(identifier: string): Promise<ArixLinkResponse> {
		const uuid: string = await this.getActiveUuid();

		const arixNotchResponse: ArixNotchResponse | undefined = await this.postData<ArixNotchRequest, ArixNotchResponse>({
			data: {
				notch: {
					user: uuid,
					identifier,
				},
			},
		});

		if (!arixNotchResponse.notch) {
			throw new InternalServerErrorException('No notch found for the given identifier.');
		}

		const arixLinkResponsePromise: Promise<ArixLinkResponse> = this.postData<ArixLinkRequest, ArixLinkResponse>({
			data: {
				link: {
					user: uuid,
					id: arixNotchResponse.notch.id,
					value: this.generatePhrase(arixNotchResponse.notch.value, this.options.password),
				},
			},
		});

		return arixLinkResponsePromise;
	}

	public async getRecordLogo(identifier: string): Promise<ArixLogoResponse> {
		const uuid: string = await this.getActiveUuid();

		const arixLogoResponse: Promise<ArixLogoResponse> = this.postData<ArixLogoRequest, ArixLogoResponse>({
			data: { logo: { user: uuid, identifier } },
		});

		return arixLogoResponse;
	}
}
