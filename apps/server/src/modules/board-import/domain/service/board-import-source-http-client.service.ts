import { HttpService } from '@nestjs/axios';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type AxiosResponse, isAxiosError } from 'axios';
import { RequestFilteringHttpsAgent } from 'request-filtering-agent';
import { BOARD_IMPORT_SOURCE_REQUEST_CONFIG_TOKEN, BoardImportSourceRequestConfig } from '../../board-import.config';
import { BoardImportJobRejectedError } from '../error';
import { BoardImportJobLogReason, type BoardImportSourceType } from '../type';
import { BoardImportSourceService } from './board-import-source.service';

type Method = 'GET' | 'POST';

export interface BoardImportSourceRequest {
	method: Method;
	url: string;
	headers?: Record<string, string>;
	body?: string;
	sourceType: BoardImportSourceType;
	signal: AbortSignal;
}

export interface BoardImportSourceResponse {
	status: number;
	body: string;
}

interface Hop {
	method: Method;
	url: URL;
	headers: Record<string, string>;
	body?: string;
}

const MILLISECONDS_PER_SECOND = 1000;
const REDIRECT_STATUSES: number[] = [
	HttpStatus.MOVED_PERMANENTLY,
	HttpStatus.FOUND,
	HttpStatus.SEE_OTHER,
	HttpStatus.TEMPORARY_REDIRECT,
	HttpStatus.PERMANENT_REDIRECT,
];
const METHOD_KEEPING_REDIRECT_STATUSES: number[] = [HttpStatus.TEMPORARY_REDIRECT, HttpStatus.PERMANENT_REDIRECT];
const TEMPORARY_ERROR_STATUSES: number[] = [HttpStatus.REQUEST_TIMEOUT, HttpStatus.TOO_MANY_REQUESTS];
const FIRST_SERVER_ERROR_STATUS: number = HttpStatus.INTERNAL_SERVER_ERROR;
// The texts of the errors of axios and of the filtering agent. Both give no error code for these cases.
const RESPONSE_TOO_LARGE_MESSAGE_PART = 'maxContentLength';
const ADDRESS_NOT_ALLOWED_MESSAGE_PART = 'is not allowed';

// The only way for a request to a source. See ADR 0013.
@Injectable()
export class BoardImportSourceHttpClientService {
	// The agent checks the addresses in the DNS lookup of the connection itself. It rejects the connection when one
	// address of the host is not public. Thus no second lookup can give an address that is not checked.
	private readonly httpsAgent = new RequestFilteringHttpsAgent();

	constructor(
		private readonly httpService: HttpService,
		private readonly boardImportSourceService: BoardImportSourceService,
		@Inject(BOARD_IMPORT_SOURCE_REQUEST_CONFIG_TOKEN) private readonly config: BoardImportSourceRequestConfig
	) {}

	// Resolves with the last answer. Rejects with BoardImportJobRejectedError when a new attempt cannot help.
	// Rejects with another error when a new attempt can help: network error, timeout, status 408, 429 or 5xx.
	public async request(request: BoardImportSourceRequest): Promise<BoardImportSourceResponse> {
		let hop: Hop = {
			method: request.method,
			url: this.parseUrl(request.url),
			headers: request.headers ?? {},
			body: request.body,
		};

		for (let redirects = 0; ; redirects += 1) {
			request.signal.throwIfAborted();
			if (!this.boardImportSourceService.isLinkOfSource(hop.url.href, request.sourceType)) {
				throw new BoardImportJobRejectedError(BoardImportJobLogReason.SOURCE_LINK_REJECTED);
			}

			const response = await this.send(hop, request.signal);
			if (this.isTemporaryError(response.status)) {
				throw this.temporaryError();
			}
			const location = this.getRedirectLocation(response);

			if (location === undefined) {
				const result = { status: response.status, body: response.data };

				return result;
			}
			if (redirects >= this.config.maxRedirects) {
				throw new BoardImportJobRejectedError(BoardImportJobLogReason.SOURCE_LINK_REJECTED);
			}
			hop = this.getRedirectHop(hop, response.status, location);
		}
	}

	private async send(hop: Hop, signal: AbortSignal): Promise<AxiosResponse<string>> {
		try {
			const response = await this.httpService.axiosRef.request<string>({
				method: hop.method,
				url: hop.url.href,
				headers: hop.headers,
				data: hop.body,
				httpsAgent: this.httpsAgent,
				// A redirect or a proxy would send the request to a host that the check did not see.
				maxRedirects: 0,
				proxy: false,
				responseType: 'text',
				transformResponse: [(data: string): string => data],
				validateStatus: () => true,
				timeout: this.config.requestTimeoutInSeconds * MILLISECONDS_PER_SECOND,
				maxContentLength: this.config.maxResponseSizeInBytes,
				signal,
			});

			return response;
		} catch (error) {
			if (this.hasMessagePart(error, ADDRESS_NOT_ALLOWED_MESSAGE_PART)) {
				throw new BoardImportJobRejectedError(BoardImportJobLogReason.SOURCE_LINK_REJECTED);
			}
			if (this.hasMessagePart(error, RESPONSE_TOO_LARGE_MESSAGE_PART)) {
				throw new BoardImportJobRejectedError(BoardImportJobLogReason.SOURCE_RESPONSE_TOO_LARGE);
			}
			throw this.temporaryError();
		}
	}

	private hasMessagePart(error: unknown, messagePart: string): boolean {
		const hasMessagePart = isAxiosError(error) && error.message.includes(messagePart);

		return hasMessagePart;
	}

	private isTemporaryError(status: number): boolean {
		const isTemporaryError = TEMPORARY_ERROR_STATUSES.includes(status) || status >= FIRST_SERVER_ERROR_STATUS;

		return isTemporaryError;
	}

	// The axios error is not passed on, because it contains the URL and the headers of the request.
	private temporaryError(): Error {
		const error = new Error('Request to the source failed');

		return error;
	}

	private getRedirectLocation(response: AxiosResponse<string>): string | undefined {
		if (!REDIRECT_STATUSES.includes(response.status)) {
			return undefined;
		}

		const { location } = response.headers;
		const redirectLocation = typeof location === 'string' && location !== '' ? location : undefined;

		return redirectLocation;
	}

	private getRedirectHop(hop: Hop, status: number, location: string): Hop {
		const url = this.parseUrl(location, hop.url);
		const keepsMethod = METHOD_KEEPING_REDIRECT_STATUSES.includes(status);
		// A header of the caller can be a secret for one host, for example the visitor token.
		const headers = url.host === hop.url.host ? hop.headers : {};
		const redirectHop: Hop = {
			method: keepsMethod ? hop.method : 'GET',
			url,
			headers,
			body: keepsMethod ? hop.body : undefined,
		};

		return redirectHop;
	}

	private parseUrl(url: string, base?: URL): URL {
		if (!URL.canParse(url, base)) {
			throw new BoardImportJobRejectedError(BoardImportJobLogReason.SOURCE_LINK_REJECTED);
		}

		const parsedUrl = new URL(url, base);

		return parsedUrl;
	}
}
