import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { DeletionRequestInput, DeletionRequestOutput } from './interface';
import { ConfigService } from '@nestjs/config';
import { DeletionClientConfig } from './deletion-client.config';

@Injectable()
export class DeletionClient {
	constructor(
		private readonly httpService: HttpService,
		private readonly configService: ConfigService<DeletionClientConfig, true>
	) {}

	async queueDeletionRequest(input: DeletionRequestInput): Promise<DeletionRequestOutput> {
		const url = this.endpointUrl('/admin/api/v1/deletionRequests');

		const request = this.httpService.post(url.toString(), input, {
			headers: this.apiKeyHeader(),
		});

		const expectedStatus = 202;

		return firstValueFrom(request)
			.then((resp: AxiosResponse<DeletionRequestOutput>) => {
				if (resp.status !== expectedStatus) {
					throw new Error(
						`invalid HTTP status code in a response from the server - ${resp.status} instead of ${expectedStatus}`
					);
				}

				return resp.data;
			})
			.catch((err) => {
				throw new Error(`failed to send a deletion request: ${err}`);
			});
	}

	private endpointUrl(endpoint: string): URL {
		const baseUrl = this.configService.get<string>('ADMIN_API_BASE_URL');

		return new URL(endpoint, baseUrl);
	}

	private apiKeyHeader() {
		return { 'X-Api-Key': this.configService.get<string>('ADMIN_API_KEY') };
	}
}
