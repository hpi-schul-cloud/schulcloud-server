import { Logger } from '@core/logger';
import { CalendarService } from '@infra/calendar';
import {
	ModuleName,
	SagaService,
	SagaStep,
	StepOperationReport,
	StepOperationReportBuilder,
	StepOperationType,
	StepReport,
	StepReportBuilder,
	StepStatus,
	UserDeletionStepOperationLoggable,
} from '@modules/saga';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityId } from '@shared/domain/types';
import { UserConfig } from '../domain';

@Injectable()
export class DeleteUserCalendarDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.USER_CALENDAR;
	private featureEnabled = false;

	constructor(
		private readonly sagaService: SagaService,
		private readonly configService: ConfigService<UserConfig, true>,
		private readonly calendarService: CalendarService,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserCalendarDataStep.name);
		this.sagaService.registerStep(this.moduleName, this);
		this.featureEnabled = this.configService.get<boolean>('CALENDAR_SERVICE_ENABLED');
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId } = params;

		const operations: StepOperationReport[] = [];

		if (this.featureEnabled) {
			const calendarEventsDeleted = await this.deleteCalendarEvents(userId);
			operations.push(calendarEventsDeleted);
		}

		const result = StepReportBuilder.build(this.moduleName, operations);

		return result;
	}

	private async deleteCalendarEvents(userId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Deleting data from Calendar Service',
				this.moduleName,
				userId,
				StepStatus.PENDING
			)
		);

		const eventIds = await this.calendarService.getAllEvents(userId);

		await this.calendarService.deleteEventsByScopeId(userId);

		const result = StepOperationReportBuilder.build(StepOperationType.DELETE, eventIds.length, eventIds);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully removed user data from Calendar Service',
				this.moduleName,
				userId,
				StepStatus.FINISHED,
				0,
				eventIds.length
			)
		);

		return result;
	}
}
