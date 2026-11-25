import { HttpStatus } from '@nestjs/common';
import { isAxiosError } from 'axios';
import { type BoardImportJob } from '../do';
import { BoardImportJobRejectedError } from '../error';
import { BoardImportJobLogReason } from '../type';
import { type BoardImportTokenService } from './board-import-token.service';

// Sends the requests of one attempt as the user of the job. See ADR 0011.
export class BoardImportUserSession {
	private token?: string;

	constructor(
		private readonly job: BoardImportJob,
		private readonly signal: AbortSignal,
		private readonly deadline: Date,
		private readonly boardImportTokenService: BoardImportTokenService
	) {}

	public async call<T>(request: (token: string) => Promise<T>): Promise<T> {
		try {
			const result = await this.send(request);

			return result;
		} catch (error) {
			if (!this.hasStatus(error, HttpStatus.UNAUTHORIZED) && !this.hasStatus(error, HttpStatus.FORBIDDEN)) {
				throw error;
			}
		}

		await this.close();
		try {
			const result = await this.send(request);

			return result;
		} catch (error) {
			if (this.hasStatus(error, HttpStatus.FORBIDDEN)) {
				throw new BoardImportJobRejectedError(BoardImportJobLogReason.BOARD_API_FORBIDDEN);
			}
			throw error;
		}
	}

	public async close(): Promise<void> {
		if (this.token === undefined) {
			return;
		}

		const { token } = this;
		this.token = undefined;
		await this.boardImportTokenService.removeToken(this.job, token);
	}

	private async send<T>(request: (token: string) => Promise<T>): Promise<T> {
		this.signal.throwIfAborted();
		this.token ??= await this.boardImportTokenService.createToken(this.job, this.deadline);

		const result = await request(this.token);

		return result;
	}

	private hasStatus(error: unknown, status: HttpStatus): boolean {
		const hasStatus = isAxiosError(error) && error.response?.status === status;

		return hasStatus;
	}
}
