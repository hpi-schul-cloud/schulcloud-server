import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConverterUtil } from '@shared/common';
import { AxiosResponse } from 'axios';
import crypto from 'crypto';
import { lastValueFrom, Observable } from 'rxjs';
import { ArisOkResponse } from './response/aris-ok-response';
import { ArixRecordResponse } from './response/arix-record-response';
import { ArixUuidResponse } from './response/arix-uuid-response';

/**
 * This is a test client for the Arix API.
 *
 * https://docs.dbildungscloud.de/display/N21P/EduPool+Overview
 */
@Injectable()
export class ArixTestClient {
	private readonly endpoint = 'https://arix.datenbank-bildungsmedien.net/NDS';

	private arixUser: string;

	private arixPassword: string;

	constructor(private readonly httpService: HttpService, private readonly convertUtil: ConverterUtil) {
		this.arixUser = Configuration.get('ARIX_CLIENT__USER') as string;
		this.arixPassword = Configuration.get('ARIX_CLIENT__PASSWORD') as string;
	}

	private async postData<T>(data: string): Promise<T> {
		const observable: Observable<AxiosResponse<string>> = this.httpService.post(
			this.endpoint,
			{ xmlstatement: data },
			{ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
		);

		const axiosResponse: AxiosResponse<string> = await lastValueFrom(observable);

		if (!axiosResponse) {
			throw new Error('No data received from Arix.');
		} else {
			console.log('Raw XML Response:', axiosResponse.data);
			const response: T = this.convertUtil.xml2object<T>(axiosResponse.data);
			return response;
		}
	}

	private generatePhrase(id: string, secret: string): string {
		const hash: string = crypto.createHash('md5').update(`${id}:${secret}`).digest('hex');
		return hash;
	}

	private async getUUID(arixUser: string): Promise<ArixUuidResponse> {
		try {
			const uuidResponse: ArixUuidResponse = await this.postData(`<getpassphrase client="${arixUser}" />`);
			return uuidResponse;
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
			throw new Error(`Error in getUUID: ${error.message}`);
		}
	}

	private async activateID(uuid: string, passphrase: string): Promise<ArisOkResponse> {
		return this.postData<ArisOkResponse>(
			`<getpassphrase uuid="${uuid}">${this.generatePhrase(uuid, passphrase)}</getpassphrase>`
		);
	}

	private async performAuthenticatedAction(uuid: string): Promise<ArixRecordResponse> {
		try {
			const response: ArixRecordResponse = await this.postData(
				`<record user="${uuid}" template="plain" identifier="XMEDIENLB-5552796"></record>`
			);
			return response;
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
			throw new Error(`Error in performAuthenticatedAction: ${error.message}`);
		}
	}

	async testCall(): Promise<void> {
		try {
			// Request 1: Fetch a UUID for the user.
			const resp1: ArixUuidResponse = await this.getUUID(this.arixUser);
			console.log('Response from request 1:', resp1.uuid);

			// Request 2: Activate the ID with a generated passphrase.
			const resp2: ArisOkResponse = await this.activateID(resp1.uuid, this.arixPassword);
			console.log('Response from request 2:', resp2);

			// Request 3: Perform an authenticated action using the activated ID.
			const resp3: ArixRecordResponse = await this.performAuthenticatedAction(resp1.uuid);
			console.log('Response from request 3:', resp3);

			return await Promise.resolve();
		} catch (error) {
			console.error('Error:', error);
			return Promise.reject(error);
		}
	}
}
