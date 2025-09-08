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
import { UserMikroOrmRepo } from '../repo';

@Injectable()
export class DeleteUserStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.USER;

	constructor(
		private readonly sagaService: SagaService,
		private readonly userRepo: UserMikroOrmRepo,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserStep.name);
		this.sagaService.registerStep(this.moduleName, this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId } = params;

		const userDeleted = await this.deleteUser(userId);

		const result = StepReportBuilder.build(this.moduleName, [userDeleted]);

		return result;
	}

	public async deleteUser(userId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable('Deleting user', this.moduleName, userId, StepStatus.PENDING)
		);

		const userToDelete = await this.userRepo.findByIdOrNull(userId, true);

		if (userToDelete === null) {
			const result = StepOperationReportBuilder.build(StepOperationType.DELETE, 0, []);

			this.logger.info(
				new UserDeletionStepOperationLoggable(
					'User already deleted',
					this.moduleName,
					userId,
					StepStatus.FINISHED,
					0,
					0
				)
			);

			return result;
		}

		const numberOfDeletedUsers = await this.userRepo.deleteUser(userId);

		// TODO check necessary?
		if (numberOfDeletedUsers === 0) {
			throw new Error(`Failed to delete user '${userId}' from User collection`);
		}

		const result = StepOperationReportBuilder.build(StepOperationType.DELETE, numberOfDeletedUsers, [userId]);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully deleted user',
				this.moduleName,
				userId,
				StepStatus.FINISHED,
				0,
				numberOfDeletedUsers
			)
		);

		return result;
	}
}
