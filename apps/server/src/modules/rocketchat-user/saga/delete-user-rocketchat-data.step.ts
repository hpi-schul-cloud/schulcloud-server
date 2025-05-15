import { Logger } from '@core/logger';
import { RocketChatService } from '@modules/rocketchat/rocket-chat.service';
import {
	ModuleName,
	SagaService,
	SagaStep,
	StepOperationReportBuilder,
	StepOperationType,
	StepReport,
	StepReportBuilder,
	StepStatus,
	UserDeletionStepOperationLoggable,
} from '@modules/saga';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { RocketChatUser } from '../domain';
import { RocketChatUserRepo } from '../repo';

@Injectable()
export class DeleteUserRocketChatDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.ROCKETCHATUSER;

	constructor(
		private readonly sagaService: SagaService,
		private readonly rocketChatUserRepo: RocketChatUserRepo,
		private readonly rocketChatService: RocketChatService,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserRocketChatDataStep.name);
		this.sagaService.registerStep(this.moduleName, this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId } = params;

		const result = await this.deleteUserData(userId);

		return result;
	}

	public async deleteUserData(userId: EntityId): Promise<StepReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Deleting user from rocket chat',
				this.moduleName,
				userId,
				StepStatus.PENDING
			)
		);
		const rocketChatUser = await this.rocketChatUserRepo.findByUserId(userId);

		if (rocketChatUser === null) {
			const result = this.buildResultAndLog(0, 0, userId, 'RocketChat user already deleted', StepStatus.FINISHED);

			return result;
		}

		try {
			await this.rocketChatService.deleteUser(rocketChatUser.username);
			const rocketChatUserDeleted = await this.rocketChatUserRepo.deleteByUserId(rocketChatUser.userId);
			const result = this.buildResultAndLog(
				rocketChatUserDeleted,
				1,
				userId,
				'Successfully deleted user from rocket chat',
				StepStatus.SUCCESS,
				rocketChatUser
			);

			return result;
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			if (error.errorType === 'error-invalid-user' && error.response.success === false) {
				const rocketChatUserDeleted = await this.rocketChatUserRepo.deleteByUserId(rocketChatUser.userId);
				const result = this.buildResultAndLog(
					rocketChatUserDeleted,
					0,
					userId,
					'Successfully deleted user from rocket chat',
					StepStatus.SUCCESS,
					rocketChatUser
				);

				return result;
			}

			this.logger.warning(
				new UserDeletionStepOperationLoggable(
					'Failed to delete user data from RocketChatUser collection / RocketChat service',
					this.moduleName,
					userId,
					StepStatus.FAILED,
					0,
					0
				)
			);

			throw new Error(
				`Failed to delete user data for userId '${userId}' from RocketChatUser collection / RocketChat service`
			);
		}
	}

	private buildResultAndLog(
		rocketChatUserDeleted: number,
		rocketChatServiceUserDeleted: number,
		userId: string,
		message: string,
		status: StepStatus,
		rocketChatUser?: RocketChatUser
	): StepReport {
		const result = StepReportBuilder.build(this.moduleName, [
			StepOperationReportBuilder.build(
				StepOperationType.DELETE,
				rocketChatUserDeleted,
				rocketChatUser ? [rocketChatUser.id] : []
			),
			StepOperationReportBuilder.build(
				StepOperationType.DELETE,
				rocketChatServiceUserDeleted,
				rocketChatUser && rocketChatServiceUserDeleted !== 0 ? [rocketChatUser.username] : []
			),
		]);

		this.logger.info(
			new UserDeletionStepOperationLoggable(message, this.moduleName, userId, status, 0, rocketChatUserDeleted)
		);
		return result;
	}
}
