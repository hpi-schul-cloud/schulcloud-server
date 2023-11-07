import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { DeletionRequestInput, DeletionRequestOutput } from './interface';
import { DeletionClientConfig } from './deletion-client.config';

@Injectable()
export class DeletionClient {
	private readonly baseUrl: string;
	private readonly apiKey: string;

	private readonly postDeletionRequestsEndpoint: string;

	constructor(
		private readonly httpService: HttpService,
		private readonly configService: ConfigService<DeletionClientConfig, true>
	) {
		this.baseUrl = this.configService.get<string>('ADMIN_API_BASE_URL');
		this.apiKey = this.configService.get<string>('ADMIN_API_API_KEY');

		// Prepare the POST /deletionRequests endpoint beforehand to not do it on every client call.
		this.postDeletionRequestsEndpoint = new URL('/admin/api/v1/deletionRequests', this.baseUrl).toString();
	}

	async queueDeletionRequest(input: DeletionRequestInput): Promise<DeletionRequestOutput> {
		const request = this.httpService.post(this.postDeletionRequestsEndpoint, input, this.defaultHeaders());

		return firstValueFrom(request)
			.then((resp: AxiosResponse<DeletionRequestOutput>) => {
				// Throw an error if any other status code (other than expected "202 Accepted" is returned).
				if (resp.status !== 202) {
					throw new Error(`invalid HTTP status code in a response from the server - ${resp.status} instead of 202`);
				}

				// Throw an error if server didn't return a requestId in a response (and it is
				// required as it gives client the reference to the created deletion request).
				if (!resp.data.requestId) {
					throw new Error('no valid requestId returned from the server');
				}

				// Throw an error if server didn't return a deletionPlannedAt timestamp so the user
				// will not be aware after which date the deletion request's execution will begin.
				if (!resp.data.deletionPlannedAt) {
					throw new Error('no valid deletionPlannedAt returned from the server');
				}

				return resp.data;
			})
			.catch((err) => {
				// Throw an error if sending/processing deletion request by the client failed in any way.
				throw new Error(`failed to send/process a deletion request: ${err}`);
			});
	}

	private apiKeyHeader() {
		return { 'X-Api-Key': this.apiKey };
	}

	private defaultHeaders() {
		return {
			headers: this.apiKeyHeader(),
		};
	}
}
