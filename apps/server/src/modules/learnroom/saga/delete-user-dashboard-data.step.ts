import { Logger } from '@core/logger';
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
import { DashboardElementRepo } from '../repo';
import { DASHBOARD_REPO, IDashboardRepo } from '../repo/mikro-orm/dashboard.repo';

@Injectable()
export class DeleteUserDashboardDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.LEARNROOM_DASHBOARD;

	constructor(
		private readonly sagaService: SagaService,
		@Inject(DASHBOARD_REPO) private readonly dashboardRepo: IDashboardRepo,
		private readonly dashboardElementRepo: DashboardElementRepo,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserDashboardDataStep.name);
		this.sagaService.registerStep(this.moduleName, this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId } = params;

		const userDashboardsRemoved = await this.deleteUserDashboards(userId);

		const result = StepReportBuilder.build(this.moduleName, [userDashboardsRemoved]);

		return result;
	}

	public async deleteUserDashboards(userId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable('Deleting user dashboards', this.moduleName, userId, StepStatus.PENDING)
		);
		let deletedDashboard = 0;
		const refs: string[] = [];
		const usersDashboard = await this.dashboardRepo.getUsersDashboardIfExist(userId);
		if (usersDashboard !== null) {
			await this.dashboardElementRepo.deleteByDashboardId(usersDashboard.id);
			deletedDashboard = await this.dashboardRepo.deleteDashboardByUserId(userId);
			refs.push(usersDashboard.id);
		}

		const result = StepOperationReportBuilder.build(StepOperationType.DELETE, deletedDashboard, refs);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully deleted user dashboards',
				this.moduleName,
				userId,
				StepStatus.FINISHED,
				0,
				deletedDashboard
			)
		);

		return result;
	}
}
