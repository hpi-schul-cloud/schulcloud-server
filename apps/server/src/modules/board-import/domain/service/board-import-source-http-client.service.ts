import { HttpService } from '@nestjs/axios';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AxiosError, type AxiosResponse, isAxiosError } from 'axios';
import { Agent } from 'node:https';
import { BOARD_IMPORT_SOURCE_REQUEST_CONFIG_TOKEN, BoardImportSourceRequestConfig } from '../../board-import.config';
import { BoardImportJobRejectedError } from '../error';
import { BoardImportJobLogReason, type BoardImportSourceType } from '../type';
import { type BoardImportCheckedAddress, BoardImportLinkCheckService } from './board-import-link-check.service';
import { createPinnedLookup } from './board-import-pinned-lookup';

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
const RESPONSE_TOO_LARGE_MESSAGE_PART = 'maxContentLength';

// The only way for a request to a source. See ADR 0013.
@Injectable()
export class BoardImportSourceHttpClientService {
	constructor(
		private readonly httpService: HttpService,
		private readonly boardImportLinkCheckService: BoardImportLinkCheckService,
		@Inject(BOARD_IMPORT_SOURCE_REQUEST_CONFIG_TOKEN) private readonly config: BoardImportSourceRequestConfig
	) {}

	// Resolves for each status of the last answer. Rejects with BoardImportJobRejectedError when a new attempt
	// cannot help, and with another error when the request can be sent again.
	public async request(request: BoardImportSourceRequest): Promise<BoardImportSourceResponse> {
		let hop: Hop = {
			method: request.method,
			url: this.parseUrl(request.url),
			headers: request.headers ?? {},
			body: request.body,
		};

		for (let redirects = 0; ; redirects += 1) {
			request.signal.throwIfAborted();
			// eslint-disable-next-line no-await-in-loop
			const address = await this.boardImportLinkCheckService.check(hop.url, request.sourceType);
			// eslint-disable-next-line no-await-in-loop
			const response = await this.send(hop, address, request.signal);
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

	private async send(hop: Hop, address: BoardImportCheckedAddress, signal: AbortSignal): Promise<AxiosResponse<string>> {
		const httpsAgent = new Agent({ lookup: createPinnedLookup(address) });

		try {
			const response = await this.httpService.axiosRef.request<string>({
				method: hop.method,
				url: hop.url.href,
				headers: hop.headers,
				data: hop.body,
				httpsAgent,
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
			if (this.isResponseTooLarge(error)) {
				throw new BoardImportJobRejectedError(BoardImportJobLogReason.SOURCE_RESPONSE_TOO_LARGE);
			}
			// The axios error is not passed on, because it contains the URL and the headers of the request.
			throw new Error('Request to the source failed');
		} finally {
			httpsAgent.destroy();
		}
	}

	private isResponseTooLarge(error: unknown): boolean {
		const isResponseTooLarge =
			isAxiosError(error) &&
			error.code === AxiosError.ERR_BAD_RESPONSE &&
			error.message.includes(RESPONSE_TOO_LARGE_MESSAGE_PART);

		return isResponseTooLarge;
	}

	private getRedirectLocation(response: AxiosResponse<string>): string | undefined {
		if (!REDIRECT_STATUSES.includes(response.status)) {
			return undefined;
		}

		const location: unknown = response.headers.location;
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
