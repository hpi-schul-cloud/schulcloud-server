import { Injectable } from '@nestjs/common';
import { type BoardImportJob } from '../do';
import { BoardImportSourceType } from '../type';
import { BoardImportPlaceholderBoardService } from './board-import-placeholder-board.service';
import { BoardImportTaskcardsService } from './board-import-taskcards.service';
import { BoardImportTokenService } from './board-import-token.service';
import { BoardImportUserSession } from './board-import-user-session';

@Injectable()
export class BoardImportRunnerService {
	constructor(
		private readonly boardImportTokenService: BoardImportTokenService,
		private readonly boardImportPlaceholderBoardService: BoardImportPlaceholderBoardService,
		private readonly boardImportTaskcardsService: BoardImportTaskcardsService
	) {}

	// The signal aborts when the run ends, also when the job reaches its maximum duration.
	public async run(job: BoardImportJob, signal: AbortSignal): Promise<void> {
		// The source is read first, so a job with a source that is not readable creates no board.
		const sourceResponse = await this.readSource(job, signal);
		const session = new BoardImportUserSession(job, signal, this.boardImportTokenService);

		try {
			await this.boardImportPlaceholderBoardService.write(job, session, sourceResponse);
		} finally {
			await session.close();
		}
	}

	private async readSource(job: BoardImportJob, signal: AbortSignal): Promise<string> {
		const readers: Record<BoardImportSourceType, () => Promise<string>> = {
			[BoardImportSourceType.TASKCARDS]: () => this.boardImportTaskcardsService.readBoard(job, signal),
		};

		const sourceResponse = await readers[job.source.type]();

		return sourceResponse;
	}
}
