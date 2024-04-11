import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorUtils } from '@src/core/error/utils';
import { firstValueFrom } from 'rxjs';
import { DeletionClientConfig, DeletionRequestInput, DeletionRequestOutput } from './interface';

@Injectable()
export class DeletionClient {
	private readonly baseUrl: string;

	private readonly apiKey: string;

	private readonly postDeletionRequestsEndpoint: string;

	private readonly postDeletionExecutionsEndpoint: string;

	constructor(
		private readonly httpService: HttpService,
		private readonly configService: ConfigService<DeletionClientConfig, true>
	) {
		this.baseUrl = this.configService.get<string>('ADMIN_API_CLIENT_BASE_URL');
		this.apiKey = this.configService.get<string>('ADMIN_API_CLIENT_API_KEY');

		// Prepare the POST /deletionRequests endpoint beforehand to not do it on every client call.
		this.postDeletionRequestsEndpoint = new URL('/admin/api/v1/deletionRequests', this.baseUrl).toString();
		this.postDeletionExecutionsEndpoint = new URL('/admin/api/v1/deletionExecutions', this.baseUrl).toString();
	}

	async queueDeletionRequest(input: DeletionRequestInput): Promise<DeletionRequestOutput> {
		try {
			const request = this.httpService.post<DeletionRequestOutput>(
				this.postDeletionRequestsEndpoint,
				input,
				this.defaultHeaders()
			);

			const resp = await firstValueFrom(request);

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
				throw Error('no valid deletionPlannedAt returned from the server');
			}

			return resp.data;
		} catch (err) {
			// Throw an error if sending deletion request has failed.
			throw new InternalServerErrorException(
				null,
				ErrorUtils.createHttpExceptionOptions(err, 'DeletionClient:queueDeletionRequest')
			);
		}
	}

	async executeDeletions(limit?: number): Promise<void> {
		let requestConfig = {};

		if (limit && limit > 0) {
			requestConfig = { ...this.defaultHeaders(), params: { limit } };
		} else {
			requestConfig = { ...this.defaultHeaders() };
		}

		try {
			const request = this.httpService.post(this.postDeletionExecutionsEndpoint, null, requestConfig);

			const resp = await firstValueFrom(request);

			if (resp.status !== 204) {
				// Throw an error if any other status code (other than expected "204 No Content" is returned).
				throw new Error(`invalid HTTP status code in a response from the server - ${resp.status} instead of 204`);
			}
		} catch (err) {
			// Throw an error if sending deletion request(s) execution trigger has failed.
			throw new InternalServerErrorException(
				null,
				ErrorUtils.createHttpExceptionOptions(err, 'DeletionClient:executeDeletions')
			);
		}
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
