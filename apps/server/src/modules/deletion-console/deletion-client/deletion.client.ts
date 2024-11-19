import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorUtils } from '@src/core/error/utils';
import { firstValueFrom, Observable } from 'rxjs';
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
			const request = this.createDeletionRequest(input);
			const response = await firstValueFrom(request);

			this.checkResponseStatusCode(response, HttpStatusCode.Accepted);
			this.checkDeletionRequestResponseData(response);

			return response.data;
		} catch (err) {
			throw this.createError(err, 'queueDeletionRequest');
		}
	}

	public async executeDeletions(limit?: number): Promise<void> {
		try {
			const request = this.createDeletionExecutionRequest(limit);
			const response = await firstValueFrom(request);

			this.checkResponseStatusCode(response, HttpStatusCode.NoContent);
		} catch (err) {
			throw this.createError(err, 'executeDeletions');
		}
	}

	private createDeletionRequest(input: DeletionRequestInput): Observable<AxiosResponse<DeletionRequestOutput, any>> {
		const headers = this.createDetaultHeaders();
		const baseUrl = this.configService.get<string>('ADMIN_API_CLIENT_BASE_URL');
		const postDeletionRequestsEndpoint = new URL('/admin/api/v1/deletionRequests', baseUrl).toString();

		const request = this.httpService.post<DeletionRequestOutput>(postDeletionRequestsEndpoint, input, headers);

		return request;
	}

	private createDeletionExecutionRequest(limit?: number): Observable<AxiosResponse<any, any>> {
		const defaultHeaders = this.createDetaultHeaders();
		const headers = this.isLimitGeaterZero(limit) ? { ...defaultHeaders, params: { limit } } : defaultHeaders;

		const baseUrl = this.configService.get<string>('ADMIN_API_CLIENT_BASE_URL');
		const postDeletionExecutionsEndpoint = new URL('/admin/api/v1/deletionExecutions', baseUrl).toString();
		const request = this.httpService.post(postDeletionExecutionsEndpoint, null, headers);

		return request;
	}

	private createDetaultHeaders() {
		const apiKey = this.configService.get<string>('ADMIN_API_CLIENT_API_KEY');

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
		return limit !== undefined && limit !== null && limit > 0;
	}

	private createError(err: unknown, scope: string): Error {
		return new InternalServerErrorException(
			null,
			ErrorUtils.createHttpExceptionOptions(err, `DeletionClient:${scope}`)
		);
	}
}
