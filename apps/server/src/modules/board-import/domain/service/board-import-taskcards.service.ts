import { HttpStatus, Injectable } from '@nestjs/common';
import { type BoardImportJob } from '../do';
import { BoardImportJobRejectedError } from '../error';
import { BoardImportJobLogReason } from '../type';
import { BoardImportSourceHttpClientService } from './board-import-source-http-client.service';
import { parseTaskcardsLink, type TaskcardsLink } from './board-import-taskcards-link';

const VISITOR_QUERY = 'mutation { createVisitor { id noActive } }';
// The comments are left out, because they contain names of other persons and are not imported.
const BOARD_QUERY =
	'query ($id: String!) { board(id: $id) { id name description type ' +
	'lists { id name position color } ' +
	'cards { id title description link videoConference color enableContract enableThumbnails mode created modified ' +
	'attachments { id filename length mimetype downloadLink previewLink } ' +
	'chalkBoardPosition { height width left top ' +
	'connections { id toId arrowFrom arrowTo color thick label fromId dashed } } ' +
	'kanbanPosition { listId position } timeLinePosition { position } storyPosition { position } ' +
	'worldMapPosition { lat lng } } } }';
const VISITOR_HEADER = 'x-token';
const JSON_HEADERS = { 'Content-Type': 'application/json' };
const BOARD_ERROR_CODE = 'BOARD_ERROR';
// Directly after the access call, the board query can still answer that the visitor has no access.
const BOARD_QUERY_RETRY_DELAYS_IN_MS = [300, 800];

type JsonObject = Record<string, unknown>;

const isJsonObject = (value: unknown): value is JsonObject => typeof value === 'object' && value !== null;

// Reads a board the same way as the web app of TaskCards does for a visitor. TaskCards has no official interface.
@Injectable()
export class BoardImportTaskcardsService {
	constructor(private readonly httpClient: BoardImportSourceHttpClientService) {}

	// Returns the raw answer of the board query. Rejects with BoardImportJobRejectedError when the board is not
	// readable with the link, and with another error when a new attempt can help.
	public async readBoard(job: BoardImportJob, signal: AbortSignal): Promise<string> {
		const link = parseTaskcardsLink(job.source.link);
		if (!link) {
			throw this.notReadable();
		}

		const visitorId = await this.createVisitor(job, link, signal);
		if (link.token !== undefined) {
			await this.unlockAccess(job, link, link.token, visitorId, signal);
		}
		const board = await this.queryBoard(job, link, visitorId, signal);

		return board;
	}

	private async createVisitor(job: BoardImportJob, link: TaskcardsLink, signal: AbortSignal): Promise<string> {
		const body = await this.postGraphql(job, link, { query: VISITOR_QUERY }, undefined, signal);
		const data = this.parseJson(body).data;
		const visitor = isJsonObject(data) ? data.createVisitor : undefined;
		const visitorId = isJsonObject(visitor) ? visitor.id : undefined;

		if (typeof visitorId !== 'string' || visitorId === '') {
			throw this.temporaryError();
		}

		return visitorId;
	}

	private async unlockAccess(
		job: BoardImportJob,
		link: TaskcardsLink,
		token: string,
		visitorId: string,
		signal: AbortSignal
	): Promise<void> {
		const path = `/api/boards/${encodeURIComponent(link.boardId)}/permissions/${encodeURIComponent(token)}/accesses`;
		const { status } = await this.post(job, `${link.baseUrl}${path}`, { password: '' }, visitorId, signal);

		// The source answers with a conflict when the visitor has the access already.
		if (!this.isSuccess(status) && status !== HttpStatus.CONFLICT) {
			throw this.getStatusError(status);
		}
	}

	private async queryBoard(
		job: BoardImportJob,
		link: TaskcardsLink,
		visitorId: string,
		signal: AbortSignal
	): Promise<string> {
		const query = { operationName: null, variables: { id: link.boardId }, query: BOARD_QUERY };
		const retryDelaysInMs = link.token === undefined ? [] : BOARD_QUERY_RETRY_DELAYS_IN_MS;

		for (let attempt = 0; ; attempt += 1) {
			// eslint-disable-next-line no-await-in-loop
			const body = await this.postGraphql(job, link, query, visitorId, signal);
			const answer = this.parseJson(body);

			if (this.hasBoard(answer)) {
				return body;
			}

			const retryDelayInMs = retryDelaysInMs.at(attempt);
			if (retryDelayInMs === undefined || !this.isBoardError(answer)) {
				throw this.notReadable();
			}
			// eslint-disable-next-line no-await-in-loop
			await this.wait(retryDelayInMs);
		}
	}

	private hasBoard(answer: JsonObject): boolean {
		const hasErrors = Array.isArray(answer.errors) && answer.errors.length > 0;
		const hasBoard = !hasErrors && isJsonObject(answer.data) && isJsonObject(answer.data.board);

		return hasBoard;
	}

	private isBoardError(answer: JsonObject): boolean {
		const errors: unknown[] = Array.isArray(answer.errors) ? answer.errors : [];
		const isBoardError = errors.some(
			(error) =>
				isJsonObject(error) &&
				isJsonObject(error.extensions) &&
				error.extensions.code === BOARD_ERROR_CODE &&
				(error.message ?? '') === ''
		);

		return isBoardError;
	}

	private async postGraphql(
		job: BoardImportJob,
		link: TaskcardsLink,
		payload: JsonObject,
		visitorId: string | undefined,
		signal: AbortSignal
	): Promise<string> {
		const { status, body } = await this.post(job, `${link.baseUrl}/graphql`, payload, visitorId, signal);

		if (status !== HttpStatus.OK) {
			throw this.getStatusError(status);
		}

		return body;
	}

	private async post(
		job: BoardImportJob,
		url: string,
		payload: JsonObject,
		visitorId: string | undefined,
		signal: AbortSignal
	): Promise<{ status: number; body: string }> {
		signal.throwIfAborted();
		const headers = visitorId === undefined ? JSON_HEADERS : { ...JSON_HEADERS, [VISITOR_HEADER]: visitorId };

		const response = await this.httpClient.request({
			method: 'POST',
			url,
			headers,
			body: JSON.stringify(payload),
			sourceType: job.source.type,
			signal,
		});

		return response;
	}

	private parseJson(body: string): JsonObject {
		let value: unknown;
		try {
			value = JSON.parse(body);
		} catch {
			throw this.temporaryError();
		}

		if (!isJsonObject(value)) {
			throw this.temporaryError();
		}

		return value;
	}

	private isSuccess(status: number): boolean {
		const isSuccess = status >= HttpStatus.OK && status < HttpStatus.AMBIGUOUS;

		return isSuccess;
	}

	private getStatusError(status: number): Error {
		const isTemporary =
			status === HttpStatus.REQUEST_TIMEOUT ||
			status === HttpStatus.TOO_MANY_REQUESTS ||
			status >= HttpStatus.INTERNAL_SERVER_ERROR;
		const error = isTemporary ? this.temporaryError() : this.notReadable();

		return error;
	}

	private notReadable(): BoardImportJobRejectedError {
		const error = new BoardImportJobRejectedError(BoardImportJobLogReason.SOURCE_NOT_READABLE);

		return error;
	}

	// The message has no details, because the answer of the source can contain contents of the board.
	private temporaryError(): Error {
		const error = new Error('TaskCards request failed');

		return error;
	}

	private async wait(delayInMs: number): Promise<void> {
		await new Promise((resolve) => {
			setTimeout(resolve, delayInMs);
		});
	}
}
