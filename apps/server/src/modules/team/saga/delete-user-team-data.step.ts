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
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { TeamEntity, TeamRepo } from '../repo';

@Injectable()
export class DeleteUserTeamDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.TEAM;

	constructor(
		private readonly sagaService: SagaService,
		private readonly teamRepo: TeamRepo,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserTeamDataStep.name);
		this.sagaService.registerStep(this.moduleName, this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId } = params;

		const userReferencesRemoved = await this.removeUserReferences(userId);

		const result = StepReportBuilder.build(this.moduleName, [userReferencesRemoved]);

		return result;
	}

	public async removeUserReferences(userId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Deleting user data from Teams',
				this.moduleName,
				userId,
				StepStatus.PENDING
			)
		);
		const teams = await this.teamRepo.findByUserId(userId);

		const numberOfUpdatedTeams = await this.teamRepo.removeUserReferences(userId);

		const result = StepOperationReportBuilder.build(
			StepOperationType.UPDATE,
			numberOfUpdatedTeams,
			this.getTeamsId(teams)
		);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully deleted user data from Teams',
				this.moduleName,
				userId,
				StepStatus.FINISHED,
				numberOfUpdatedTeams,
				0
			)
		);

		return result;
	}

	private getTeamsId(teams: TeamEntity[]): EntityId[] {
		return teams.map((team) => team.id);
	}
}
