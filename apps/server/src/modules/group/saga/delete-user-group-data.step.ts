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
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Group } from '../domain';
import { GroupService } from '../service';

@Injectable()
export class DeleteUserGroupDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.GROUP;

	constructor(
		private readonly sagaService: SagaService,
		private readonly groupService: GroupService,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserGroupDataStep.name);
		this.sagaService.registerStep(this.moduleName, this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId } = params;

		const groupsModified = await this.removeUserFromGroups(userId);

		const result = StepReportBuilder.build(this.moduleName, [groupsModified]);

		return result;
	}

	public async removeUserFromGroups(userId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable('Removing user from groups', this.moduleName, userId, StepStatus.PENDING)
		);

		if (!userId) {
			throw new InternalServerErrorException('User id is missing');
		}

		const groups = await this.groupService.findAllGroupsForUser(userId);
		const numberOfUpdatedGroups = await this.groupService.removeUserReference(userId);

		const result = StepOperationReportBuilder.build(
			StepOperationType.UPDATE,
			numberOfUpdatedGroups,
			this.getGroupsId(groups)
		);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				`Removed user from groups`,
				this.moduleName,
				userId,
				StepStatus.FINISHED,
				numberOfUpdatedGroups,
				0
			)
		);

		return result;
	}

	private getGroupsId(groups: Group[]): EntityId[] {
		return groups.map((group) => group.id);
	}
}
