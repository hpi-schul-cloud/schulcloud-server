import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorUtils } from '@src/core/error/utils';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse, HttpStatusCode } from 'axios';
import { DeletionRequestInput, DeletionRequestOutput } from './interface';
import { DeletionConsoleConfig } from '../deletion.config';

@Injectable()
export class DeletionClient {
	constructor(
		private readonly httpService: HttpService,
		private readonly configService: ConfigService<DeletionConsoleConfig, true>
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

	public async executeDeletions(limit?: number): Promise<void> {
		try {
			const response = await this.postDeletionExecutionRequest(limit);
			this.checkResponseStatusCode(response, HttpStatusCode.NoContent);
		} catch (err) {
			throw this.createError(err, 'executeDeletions');
		}
	}

	private async postDeletionRequest(input: DeletionRequestInput): Promise<AxiosResponse<DeletionRequestOutput, any>> {
		const headers = this.createDetaultHeaders();
		const baseUrl = this.configService.get('ADMIN_API_CLIENT_BASE_URL', { infer: true });
		const postDeletionRequestsEndpoint = new URL('/admin/api/v1/deletionRequests', baseUrl).toString();

		const request = this.httpService.post<DeletionRequestOutput>(postDeletionRequestsEndpoint, input, headers);
		const response = await firstValueFrom(request);

		return response;
	}

	private async postDeletionExecutionRequest(limit?: number): Promise<AxiosResponse<any, any>> {
		const defaultHeaders = this.createDetaultHeaders();
		const headers = this.isLimitGeaterZero(limit) ? { ...defaultHeaders, params: { limit } } : defaultHeaders;
		const baseUrl = this.configService.get('ADMIN_API_CLIENT_BASE_URL', { infer: true });
		const postDeletionExecutionsEndpoint = new URL('/admin/api/v1/deletionExecutions', baseUrl).toString();

		const request = this.httpService.post(postDeletionExecutionsEndpoint, null, headers);
		const response = await firstValueFrom(request);

		return response;
	}

	private createDetaultHeaders() {
		const apiKey = this.configService.get('ADMIN_API_CLIENT_API_KEY', { infer: true });

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

	private isLimitGeaterZero(limit?: number): boolean {
		return typeof limit === 'number' && limit > 0;
	}

	private createError(err: unknown, scope: string): Error {
		return new InternalServerErrorException(
			null,
			ErrorUtils.createHttpExceptionOptions(err, `DeletionClient:${scope}`)
		);
	}
}
