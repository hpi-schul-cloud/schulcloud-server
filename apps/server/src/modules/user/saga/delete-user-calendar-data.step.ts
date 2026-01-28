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
import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { USER_CONFIG_TOKEN, UserConfig } from '../user.config';

@Injectable()
export class DeleteUserCalendarDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.USER_CALENDAR;

	constructor(
		private readonly sagaService: SagaService,
		@Inject(USER_CONFIG_TOKEN) private readonly userConfig: UserConfig,
		private readonly calendarService: CalendarService,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserCalendarDataStep.name);
		this.sagaService.registerStep(this.moduleName, this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId } = params;

		const operations: StepOperationReport[] = [];

		if (this.userConfig.calendarServiceEnabled) {
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

		const eventIds = await this.calendarService.getAllEvents(userId, userId);

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
