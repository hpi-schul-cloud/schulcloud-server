import { Injectable } from '@nestjs/common';
import { type BoardImportJob } from '../do';
import { BoardImportJobRejectedError } from '../error';
import { BoardImportJobLogReason } from '../type';
import { BoardImportPlaceholderBoardService } from './board-import-placeholder-board.service';
import { BoardImportSourceReaderRegistryService } from './board-import-source-reader-registry.service';
import { BoardImportTokenService } from './board-import-token.service';
import { BoardImportUserSession } from './board-import-user-session';

@Injectable()
export class BoardImportRunnerService {
	constructor(
		private readonly boardImportTokenService: BoardImportTokenService,
		private readonly boardImportPlaceholderBoardService: BoardImportPlaceholderBoardService,
		private readonly boardImportSourceReaderRegistryService: BoardImportSourceReaderRegistryService
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
		const reader = this.boardImportSourceReaderRegistryService.findByType(job.source.type);
		if (!reader) {
			throw new BoardImportJobRejectedError(BoardImportJobLogReason.SOURCE_UNKNOWN);
		}

		const sourceResponse = await reader.readBoard(job, signal);

		return sourceResponse;
	}
}
