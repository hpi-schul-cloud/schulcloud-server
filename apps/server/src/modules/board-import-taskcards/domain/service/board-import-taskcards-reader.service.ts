import {
	type BoardImportJob,
	BoardImportJobLogReason,
	BoardImportJobRejectedError,
	BoardImportSourceHttpClientService,
	type BoardImportSourceReader,
	BoardImportSourceReaderRegistryService,
	type IntermediateBoard,
} from '@modules/board-import';
import { HttpStatus, Injectable } from '@nestjs/common';
import { setTimeout as wait } from 'node:timers/promises';
import { BOARD_IMPORT_TASKCARDS_SOURCE_TYPE } from '../../board-import-taskcards.constants';
import { mapTaskcardsBoard } from './board-import-taskcards-board';
import { parseTaskcardsLink, type TaskcardsLink } from './board-import-taskcards-link';
import { isJsonObject, type JsonObject } from './taskcards-json';

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
// The source rejects the query itself. A new attempt sends the same query.
const REQUEST_ERROR_CODES = new Set(['GRAPHQL_PARSE_FAILED', 'GRAPHQL_VALIDATION_FAILED', 'BAD_USER_INPUT']);
// The source builds a download link for each attachment. When it fails for one attachment, the board is complete
// without that link.
const ATTACHMENT_LINK_FIELDS = new Set(['downloadLink', 'previewLink']);
const STATUS_OK: number = HttpStatus.OK;
const FIRST_REDIRECT_STATUS: number = HttpStatus.AMBIGUOUS;
// The source answers with a conflict when the visitor has the access already.
const ACCESS_EXISTS_STATUS: number = HttpStatus.CONFLICT;
// Directly after the access call, the board query can still answer that the visitor has no access.
const BOARD_QUERY_RETRY_DELAYS_IN_MS = [300, 800];

// Reads a board the same way as the web app of TaskCards does for a visitor. TaskCards has no official interface.
@Injectable()
export class BoardImportTaskcardsReaderService implements BoardImportSourceReader {
	public readonly type = BOARD_IMPORT_TASKCARDS_SOURCE_TYPE;

	constructor(
		private readonly httpClient: BoardImportSourceHttpClientService,
		boardImportSourceReaderRegistryService: BoardImportSourceReaderRegistryService
	) {
		boardImportSourceReaderRegistryService.registerReader(this);
	}

	// Rejects with BoardImportJobRejectedError when the board is not readable with the link or has a type that the
	// import does not support, and with another error when a new attempt can help.
	public async readBoard(job: BoardImportJob, signal: AbortSignal): Promise<IntermediateBoard> {
		const link = parseTaskcardsLink(job.source.link);
		if (!link) {
			throw this.notReadable();
		}

		const visitorId = await this.createVisitor(link, signal);
		if (link.token !== undefined) {
			await this.unlockAccess(link, link.token, visitorId, signal);
		}
		const board = await this.queryBoard(link, visitorId, signal);
		const intermediateBoard = mapTaskcardsBoard(board, job.source);

		return intermediateBoard;
	}

	private async createVisitor(link: TaskcardsLink, signal: AbortSignal): Promise<string> {
		const body = await this.postGraphql(link, { query: VISITOR_QUERY }, undefined, signal);
		const { data } = this.parseJson(body);
		const visitor = isJsonObject(data) ? data.createVisitor : undefined;
		const visitorId = isJsonObject(visitor) ? visitor.id : undefined;

		if (typeof visitorId !== 'string' || visitorId === '') {
			throw this.temporaryError();
		}

		return visitorId;
	}

	private async unlockAccess(
		link: TaskcardsLink,
		token: string,
		visitorId: string,
		signal: AbortSignal
	): Promise<void> {
		const path = `/api/boards/${encodeURIComponent(link.boardId)}/permissions/${encodeURIComponent(token)}/accesses`;
		const { status } = await this.post(`${link.baseUrl}${path}`, { password: '' }, visitorId, signal);

		const isSuccess = status >= STATUS_OK && status < FIRST_REDIRECT_STATUS;
		if (!isSuccess && status !== ACCESS_EXISTS_STATUS) {
			throw this.notReadable();
		}
	}

	private async queryBoard(
		link: TaskcardsLink,
		visitorId: string,
		signal: AbortSignal,
		attempt = 0
	): Promise<JsonObject> {
		const query = { operationName: null, variables: { id: link.boardId }, query: BOARD_QUERY };
		const body = await this.postGraphql(link, query, visitorId, signal);
		const answer = this.parseJson(body);

		const board = this.findBoard(answer);
		if (board) {
			if (!this.hasOnlyAttachmentLinkErrors(answer)) {
				throw this.temporaryError();
			}

			return board;
		}

		const errorCodes = this.getErrorCodes(answer);
		if (!errorCodes.includes(BOARD_ERROR_CODE)) {
			const isNotReadable = errorCodes.length === 0 || errorCodes.some((code) => REQUEST_ERROR_CODES.has(code));
			throw isNotReadable ? this.notReadable() : this.temporaryError();
		}

		const retryDelayInMs = link.token === undefined ? undefined : BOARD_QUERY_RETRY_DELAYS_IN_MS.at(attempt);
		if (retryDelayInMs === undefined) {
			throw this.notReadable();
		}
		await wait(retryDelayInMs, undefined, { signal });
		const boardOfNextAttempt = await this.queryBoard(link, visitorId, signal, attempt + 1);

		return boardOfNextAttempt;
	}

	// An error in a nested field gives the board, with null in that field, and an error entry for that field.
	private findBoard(answer: JsonObject): JsonObject | undefined {
		const board = isJsonObject(answer.data) && isJsonObject(answer.data.board) ? answer.data.board : undefined;

		return board;
	}

	private hasOnlyAttachmentLinkErrors(answer: JsonObject): boolean {
		const errors: unknown[] = Array.isArray(answer.errors) ? answer.errors : [];
		const hasOnlyAttachmentLinkErrors = errors.every(
			(error) => isJsonObject(error) && Array.isArray(error.path) && this.isAttachmentLinkPath(error.path)
		);

		return hasOnlyAttachmentLinkErrors;
	}

	private isAttachmentLinkPath(path: unknown[]): boolean {
		const [board, cards, cardIndex, attachments, attachmentIndex, field] = path;
		const isAttachmentLinkPath =
			path.length === 6 &&
			board === 'board' &&
			cards === 'cards' &&
			typeof cardIndex === 'number' &&
			attachments === 'attachments' &&
			typeof attachmentIndex === 'number' &&
			typeof field === 'string' &&
			ATTACHMENT_LINK_FIELDS.has(field);

		return isAttachmentLinkPath;
	}

	private getErrorCodes(answer: JsonObject): string[] {
		const errors: unknown[] = Array.isArray(answer.errors) ? answer.errors : [];
		const errorCodes = errors.map((error) =>
			isJsonObject(error) && isJsonObject(error.extensions) && typeof error.extensions.code === 'string'
				? error.extensions.code
				: ''
		);

		return errorCodes;
	}

	private async postGraphql(
		link: TaskcardsLink,
		payload: JsonObject,
		visitorId: string | undefined,
		signal: AbortSignal
	): Promise<string> {
		const { status, body } = await this.post(`${link.baseUrl}/graphql`, payload, visitorId, signal);

		if (status !== STATUS_OK) {
			throw this.notReadable();
		}

		return body;
	}

	private async post(
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
			sourceType: this.type,
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

	private notReadable(): BoardImportJobRejectedError {
		const error = new BoardImportJobRejectedError(BoardImportJobLogReason.SOURCE_NOT_READABLE);

		return error;
	}

	// The message has no details, because the answer of the source can contain contents of the board.
	private temporaryError(): Error {
		const error = new Error('TaskCards request failed');

		return error;
	}
}
