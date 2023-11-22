import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { Injectable, BadGatewayException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ErrorUtils } from '@src/core/error/utils';
import { DeletionRequestInput, DeletionRequestOutput, DeletionClientConfig } from './interface';

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
		let resp: AxiosResponse<DeletionRequestOutput>;

		try {
			const request = this.httpService.post(this.postDeletionRequestsEndpoint, input, this.defaultHeaders());

			resp = (await firstValueFrom(request)) as AxiosResponse<DeletionRequestOutput>;
		} catch (err: unknown) {
			// Throw an error if sending deletion request has failed.
			throw new BadGatewayException('DeletionClient:queueDeletionRequest', ErrorUtils.createHttpExceptionOptions(err));
		}

		// Throw an error if any other status code (other than expected "202 Accepted" is returned).
		if (resp.status !== 202) {
			const err = new Error(`invalid HTTP status code in a response from the server - ${resp.status} instead of 202`);

			throw new BadGatewayException('DeletionClient:queueDeletionRequest', ErrorUtils.createHttpExceptionOptions(err));
		}

		// Throw an error if server didn't return a requestId in a response (and it is
		// required as it gives client the reference to the created deletion request).
		if (!resp.data.requestId) {
			const err = new Error('no valid requestId returned from the server');

			throw new BadGatewayException('DeletionClient:queueDeletionRequest', ErrorUtils.createHttpExceptionOptions(err));
		}

		// Throw an error if server didn't return a deletionPlannedAt timestamp so the user
		// will not be aware after which date the deletion request's execution will begin.
		if (!resp.data.deletionPlannedAt) {
			const err = Error('no valid deletionPlannedAt returned from the server');

			throw new BadGatewayException('DeletionClient:queueDeletionRequest', ErrorUtils.createHttpExceptionOptions(err));
		}

		return resp.data;
	}

	async executeDeletions(limit?: number): Promise<void> {
		let requestConfig = {};

		if (limit && limit > 0) {
			requestConfig = { ...this.defaultHeaders(), params: { limit } };
		} else {
			requestConfig = { ...this.defaultHeaders() };
		}

		let resp: AxiosResponse;

		try {
			const request = this.httpService.post(this.postDeletionExecutionsEndpoint, null, requestConfig);

			resp = await firstValueFrom(request);
		} catch (err: unknown) {
			// Throw an error if sending deletion request(s) execution trigger has failed.
			throw new BadGatewayException('DeletionClient:executeDeletions', ErrorUtils.createHttpExceptionOptions(err));
		}

		if (resp.status !== 204) {
			// Throw an error if any other status code (other than expected "204 No Content" is returned).
			const err = new Error(`invalid HTTP status code in a response from the server - ${resp.status} instead of 204`);

			throw new BadGatewayException('DeletionClient:executeDeletions', ErrorUtils.createHttpExceptionOptions(err));
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
