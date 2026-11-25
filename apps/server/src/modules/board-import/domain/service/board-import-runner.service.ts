import { Injectable } from '@nestjs/common';
import { type BoardImportJob } from '../do';
import { BoardImportPlaceholderBoardService } from './board-import-placeholder-board.service';
import { BoardImportTokenService } from './board-import-token.service';
import { BoardImportUserSession } from './board-import-user-session';

@Injectable()
export class BoardImportRunnerService {
	constructor(
		private readonly boardImportTokenService: BoardImportTokenService,
		private readonly boardImportPlaceholderBoardService: BoardImportPlaceholderBoardService
	) {}

	// The signal aborts when the run ends, also when the job reaches its maximum duration.
	public async run(job: BoardImportJob, signal: AbortSignal): Promise<void> {
		const session = new BoardImportUserSession(job, signal, this.boardImportTokenService);

		try {
			await this.boardImportPlaceholderBoardService.write(job, session);
		} finally {
			await session.close();
		}
	}
}
