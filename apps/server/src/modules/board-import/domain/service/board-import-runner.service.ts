import { Inject, Injectable } from '@nestjs/common';
import { type BoardImportJob } from '../do';
import { BoardImportJobRejectedError } from '../error';
import { BOARD_IMPORT_JOB_REPO, type BoardImportJobRepo } from '../interface';
import { BOARD_PLAN_VERSION, BoardImportJobLogReason, type BoardPlan, type IntermediateBoard } from '../type';
import { BoardImportExporterService } from './board-import-exporter.service';
import { BoardImportPlannerService } from './board-import-planner.service';
import { BoardImportSourceReaderRegistryService } from './board-import-source-reader-registry.service';
import { BoardImportTokenService } from './board-import-token.service';
import { BoardImportUserSession } from './board-import-user-session';

@Injectable()
export class BoardImportRunnerService {
	constructor(
		@Inject(BOARD_IMPORT_JOB_REPO) private readonly boardImportJobRepo: BoardImportJobRepo,
		private readonly boardImportTokenService: BoardImportTokenService,
		private readonly boardImportPlannerService: BoardImportPlannerService,
		private readonly boardImportExporterService: BoardImportExporterService,
		private readonly boardImportSourceReaderRegistryService: BoardImportSourceReaderRegistryService
	) {}

	// The signal aborts when the run ends, also when the job reaches its maximum duration.
	public async run(job: BoardImportJob, signal: AbortSignal): Promise<void> {
		const plan = job.plan ?? (await this.createPlan(job, signal));
		// The checkpoints of the job fit only the plan that they were stored for.
		if (plan.version !== BOARD_PLAN_VERSION) {
			throw new BoardImportJobRejectedError(BoardImportJobLogReason.PLAN_VERSION_NOT_SUPPORTED);
		}

		const session = new BoardImportUserSession(job, signal, this.boardImportTokenService);

		try {
			await this.boardImportExporterService.export(job, session, plan);
		} finally {
			await session.close();
		}
	}

	// The source is read before the board is created, so a job with a source that is not readable creates no board.
	// The plan is stored, so a later attempt continues with the same plan and does not read the source again.
	private async createPlan(job: BoardImportJob, signal: AbortSignal): Promise<BoardPlan> {
		const board = await this.readSource(job, signal);
		const { plan, notes } = this.boardImportPlannerService.plan(board);
		await this.boardImportJobRepo.setPlan(job.id, plan, notes);

		return plan;
	}

	private async readSource(job: BoardImportJob, signal: AbortSignal): Promise<IntermediateBoard> {
		const reader = this.boardImportSourceReaderRegistryService.findByType(job.source.type);
		if (!reader) {
			throw new BoardImportJobRejectedError(BoardImportJobLogReason.SOURCE_UNKNOWN);
		}

		const board = await reader.readBoard(job, signal);

		return board;
	}
}
