import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConverterUtil } from '@shared/common';
import { AxiosResponse } from 'axios';
import crypto from 'crypto';
import { lastValueFrom, Observable } from 'rxjs';
import { ArixBaseRequest } from './request/arix-base-request';
import { ArixPassphraseActivateRequest } from './request/arix-passphrase-activate-request';
import { ArixPassphraseRequest } from './request/arix-passphrase-request';
import { ArixRecordRequest } from './request/arix-record-request';
import { ArixSearchRequest } from './request/arix-search-request';
import { ArixOkResponse } from './response/arix-ok-response';
import { ArixLinkResponse } from './response/arix-link-response';
import { ArixRecordResponse } from './response/arix-record-response';
import { ArixSearchResponse } from './response/arix-search-response';
import { ArixUuidResponse } from './response/arix-uuid-response';

/**
 * This is a test client for the Arix API.
 *
 * https://docs.dbildungscloud.de/display/N21P/EduPool+Overview
 */
@Injectable()
export class ArixTestClient {
	// TODO: move url to options and think about setting the context e.g. NDS/H/30167
	private readonly endpoint = 'https://arix.datenbank-bildungsmedien.net/NDS';

	private arixUser: string;

	private arixPassword: string;

	constructor(private readonly httpService: HttpService, private readonly convertUtil: ConverterUtil) {
		// TODO: inject from options which comes from module
		this.arixUser = Configuration.get('ARIX_CLIENT__USER') as string;
		this.arixPassword = Configuration.get('ARIX_CLIENT__PASSWORD') as string;
	}

	private async postData<T, U>(request: ArixBaseRequest<T>): Promise<U> {
		const xmlRequest: string = this.convertUtil.object2xml(request.data);

		const observable: Observable<AxiosResponse<string>> = this.httpService.post(
			this.endpoint,
			{ xmlstatement: xmlRequest },
			{
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			}
		);
		const axiosResponse: AxiosResponse<string> = await lastValueFrom(observable);

		if (!axiosResponse) {
			throw new Error('No data received from Arix.');
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
		try {
			const uuidResponse: ArixUuidResponse = await this.postData<ArixPassphraseRequest, ArixUuidResponse>({
				// TODO: maybe use a builder
				data: { getpassphrase: { client: arixUser } },
			});
			return uuidResponse;
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
			throw new Error(`Error in getUUID: ${error.message}`);
		}
	}

	private async activateID(uuid: string, passphrase: string): Promise<ArixOkResponse> {
		return this.postData<ArixPassphraseActivateRequest, ArixOkResponse>({
			data: { getpassphrase: { uuid, value: this.generatePhrase(uuid, passphrase) } },
		});
	}

	private async getRecord(uuid: string): Promise<ArixRecordResponse> {
		try {
			const response: ArixRecordResponse = await this.postData<ArixRecordRequest, ArixRecordResponse>({
				data: { record: { user: uuid, template: 'plain', identifier: 'XMEDIENLB-5552796' } },
			});
			return response;
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
			throw new Error(`Error in performAuthenticatedAction: ${error.message}`);
		}
	}

	private async login(): Promise<string> {
		// Request 1: Fetch a UUID for the user.
		const uuidResponse: ArixUuidResponse = await this.getUUID(this.arixUser);
		console.log('Response from uuid request:', uuidResponse.uuid);

		// Request 2: Activate the ID with a generated passphrase.
		const arixOkResponse: ArixOkResponse = await this.activateID(uuidResponse.uuid, this.arixPassword);
		console.log('Response from activate request:', arixOkResponse);

		return uuidResponse.uuid;
	}

	private async search(uuid: string): Promise<ArixSearchResponse> {
		try {
			const response: ArixSearchResponse = await this.postData<ArixSearchRequest, ArixSearchResponse>({
				data: {
					search: {
						user: uuid,
						fields: 'text,titel',
						conditions: [
							{
								field: 'titel_fields',
								value: 'watt',
							},
						],
						limit: '1',
					},
				},
			});
			return response;
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
			throw new Error(`Error in search: ${error.message}`);
		}
	}

	public async getMediaRecord(): Promise<ArixRecordResponse> {
		try {
			const uuid: string = await this.login();
			return await this.getRecord(uuid);
		} catch (error) {
			console.error('Error:', error);
			return Promise.reject(error);
		}
	}

	public async doSearch(): Promise<ArixSearchResponse> {
		try {
			const uuid: string = await this.login();
			return await this.search(uuid);
		} catch (error) {
			console.error('Error:', error);
			return Promise.reject(error);
		}
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async getLink(): Promise<ArixLinkResponse> {
		return {} as ArixLinkResponse;
	}
}
