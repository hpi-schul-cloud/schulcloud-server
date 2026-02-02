import { ErrorUtils } from '@core/error/utils';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AxiosResponse, HttpStatusCode } from 'axios';
import { firstValueFrom } from 'rxjs';
import { DELETION_CONSOLE_CONFIG_TOKEN, DeletionConsoleConfig } from '../deletion-console.config';
import { DeletionRequestInput, DeletionRequestOutput } from './interface';

@Injectable()
export class DeletionClient {
	constructor(
		private readonly httpService: HttpService,
		@Inject(DELETION_CONSOLE_CONFIG_TOKEN) private readonly config: DeletionConsoleConfig
	) {}

	public async queueDeletionRequest(input: DeletionRequestInput): Promise<DeletionRequestOutput> {
		try {
			const response = await this.postDeletionRequest(input);
			this.checkResponseStatusCode(response, HttpStatusCode.Accepted);
			this.checkDeletionRequestResponseData(response);

			return response.data;
		} catch (err) {
			throw this.createError(err, 'queueDeletionRequest');
		}
	}

	public async executeDeletions(limit?: number, runFailed?: boolean): Promise<void> {
		try {
			let deletionRequestIds = await this.getDeletionRequestIds(limit, runFailed);
			while (deletionRequestIds.length > 0) {
				const response = await this.postDeletionExecutionRequest(deletionRequestIds);
				this.checkResponseStatusCode(response, HttpStatusCode.NoContent);
				deletionRequestIds = await this.getDeletionRequestIds(limit, runFailed);
			}
		} catch (err) {
			throw this.createError(err, 'executeDeletions');
		}
	}

	private async getDeletionRequestIds(limit?: number, runFailed?: boolean): Promise<string[]> {
		try {
			const baseUrl = this.config.adminApiClientBaseUrl;
			const endpoint = '/admin/api/v1/deletionExecutions';
			const getDeletionRequestsEndpoint = new URL(endpoint, baseUrl);

			const params = new URLSearchParams(getDeletionRequestsEndpoint.search);
			if (limit && this.isLimitGreaterZero(limit)) {
				params.append('limit', limit.toString());
			}
			if (runFailed) {
				params.append('runFailed', runFailed.toString());
			}

			const fullUrl = `${getDeletionRequestsEndpoint.toString()}?${params.toString()}`;

			const request = this.httpService.get<string[]>(fullUrl, this.createDefaultHeaders());
			const response = await firstValueFrom(request);

			return response.data;
		} catch (err) {
			throw this.createError(err, 'getDeletionRequestIds');
		}
	}

	private async postDeletionRequest(input: DeletionRequestInput): Promise<AxiosResponse<DeletionRequestOutput, any>> {
		const headers = this.createDefaultHeaders();
		const baseUrl = this.config.adminApiClientBaseUrl;
		const postDeletionRequestsEndpoint = new URL('/admin/api/v1/deletionRequests', baseUrl).toString();

		const request = this.httpService.post<DeletionRequestOutput>(postDeletionRequestsEndpoint, input, headers);
		const response = await firstValueFrom(request);

		return response;
	}

	private async postDeletionExecutionRequest(ids: string[]): Promise<AxiosResponse<any, any>> {
		const defaultHeaders = this.createDefaultHeaders();

		const baseUrl = this.config.adminApiClientBaseUrl;
		const endpoint = '/admin/api/v1/deletionExecutions';

		const postDeletionExecutionsEndpoint = new URL(endpoint, baseUrl);

		const params = new URLSearchParams(postDeletionExecutionsEndpoint.search);

		const fullUrl = `${postDeletionExecutionsEndpoint.toString()}?${params.toString()}`;

		const request = this.httpService.post(fullUrl, { ids }, defaultHeaders);
		const response = await firstValueFrom(request);

		return response;
	}

	private createDefaultHeaders() {
		const apiKey = this.config.adminApiClientApiKey;

		return {
			headers: { 'X-Api-Key': apiKey },
		};
	}

	private checkDeletionRequestResponseData(response: AxiosResponse<DeletionRequestOutput, any>): void {
		// It is required as it gives client the reference to the created deletion request.
		if (!response.data.requestId) {
			throw new Error('no valid requestId returned from the server');
		}

		// Throw an error if server didn't return a deletionPlannedAt timestamp so the user
		// will not be aware after which date the deletion request's execution will begin.
		if (!response.data.deletionPlannedAt) {
			throw Error('no valid deletionPlannedAt returned from the server');
		}
	}

	private checkResponseStatusCode(response: AxiosResponse<any, any>, expectedStatusCode: HttpStatusCode): void {
		if (response.status !== expectedStatusCode) {
			throw new Error(
				`Invalid HTTP status code in a response from the server - ${response.status} instead of ${expectedStatusCode}.`
			);
		}
	}

	private isLimitGreaterZero(limit?: number): boolean {
		return typeof limit === 'number' && limit > 0;
	}

	private createError(err: unknown, scope: string): Error {
		return new InternalServerErrorException(
			null,
			ErrorUtils.createHttpExceptionOptions(err, `DeletionClient:${scope}`)
		);
	}
}
