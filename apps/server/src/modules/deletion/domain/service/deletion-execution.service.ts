import { Injectable } from '@nestjs/common';
import { Logger } from '@core/logger';
import { ModuleName, SagaService, StepOperationReport, StepOperationType, StepReport } from '@modules/saga';
import { DeletionRequest } from '../do';
import { DomainDeletionReport, DomainOperationReport } from '../interface';
import { DomainName, OperationType } from '../types';
import { DeletionLogEntry, DeletionLogService, DeletionRequestService } from './';
import { DeletionErrorLoggableException } from '../loggable-exception';

@Injectable()
export class DeletionExecutionService {
	constructor(
		private readonly sagaService: SagaService,
		private readonly deletionRequestService: DeletionRequestService,
		private readonly deletionLogService: DeletionLogService,
		private readonly logger: Logger
	) {
		this.logger.setContext(DeletionExecutionService.name);
	}

	public async executeDeletionRequest(deletionRequest: DeletionRequest): Promise<void> {
		await this.deletionRequestService.markDeletionRequestAsPending(deletionRequest.id);

		try {
			const reports = await this.sagaService.executeSaga('userDeletion', {
				userId: deletionRequest.targetRefId,
			});

			const logEntries = reports.map((report) => {
				const entry: DeletionLogEntry = {
					deletionRequestId: deletionRequest.id,
					domainDeletionReport: this.mapToDomainDeletionReport(report),
				};
				return entry;
			});

			await this.deletionLogService.createDeletionLog(logEntries);

			await this.deletionRequestService.markDeletionRequestAsExecuted(deletionRequest.id);
		} catch (error) {
			await this.deletionRequestService.markDeletionRequestAsFailed(deletionRequest.id);

			this.logger.warning(
				new DeletionErrorLoggableException(
					`An error occurred during deletion execution ${deletionRequest.id}`,
					error as Error
				)
			);
		}
	}

	public mapToDomainDeletionReport(report: StepReport): DomainDeletionReport {
		const domainDeletionReport: DomainDeletionReport = {
			domain: this.mapToDomainName(report.moduleName),
			operations: report.operations.map((stepReport) => this.mapToDomainOperationReport(stepReport)),
		};

		return domainDeletionReport;
	}

	private mapToDomainName(moduleName: ModuleName): DomainName {
		const mapping: Record<ModuleName, DomainName> = {
			[ModuleName.ACCOUNT]: DomainName.ACCOUNT,
			[ModuleName.BOARD]: DomainName.BOARD,
			[ModuleName.MEDIA_BOARD]: DomainName.MEDIA_BOARD,
			[ModuleName.CLASS]: DomainName.CLASS,
			[ModuleName.COURSE]: DomainName.COURSE,
			[ModuleName.COURSE_COURSEGROUP]: DomainName.COURSEGROUP,
			[ModuleName.LEARNROOM_DASHBOARD]: DomainName.DASHBOARD,
			[ModuleName.FILES]: DomainName.FILE,
			[ModuleName.FILES_STORAGE]: DomainName.FILERECORDS,
			[ModuleName.GROUP]: DomainName.GROUP,
			[ModuleName.LESSON]: DomainName.LESSONS,
			[ModuleName.PSEUDONYM]: DomainName.PSEUDONYMS,
			[ModuleName.ROCKETCHATUSER]: DomainName.ROCKETCHATUSER,
			[ModuleName.TASK]: DomainName.TASK,
			[ModuleName.TASK_SUBMISSION]: DomainName.SUBMISSIONS,
			[ModuleName.TEAM]: DomainName.TEAMS,
			[ModuleName.USER]: DomainName.USER,
			[ModuleName.USER_CALENDAR]: DomainName.CALENDAR,
			[ModuleName.USER_REGISTRATIONPIN]: DomainName.REGISTRATIONPIN,
			[ModuleName.NEWS]: DomainName.NEWS,
			[ModuleName.ROOM]: DomainName.ROOM,
		} as const;

		if (mapping[moduleName]) {
			return mapping[moduleName];
		}

		throw new Error(`Unknown module name: ${moduleName}`);
	}

	private mapToDomainOperationReport(report: StepOperationReport): DomainOperationReport {
		const domainOperationReport: DomainOperationReport = {
			count: report.count,
			operation: this.mapToDomainOperationType(report.operation),
			refs: report.refs,
		};
		return domainOperationReport;
	}

	private mapToDomainOperationType(operationType: StepOperationType): OperationType {
		const mapping: Record<StepOperationType, OperationType> = {
			[StepOperationType.UPDATE]: OperationType.UPDATE,
			[StepOperationType.DELETE]: OperationType.DELETE,
		} as const;

		if (mapping[operationType]) {
			return mapping[operationType];
		}

		throw new Error(`Unknown operation type: ${operationType}`);
	}
}
