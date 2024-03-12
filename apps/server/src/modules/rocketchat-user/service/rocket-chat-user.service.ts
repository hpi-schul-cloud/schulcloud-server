import { Injectable } from '@nestjs/common';
import { EntityId, StatusModel } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { EventsHandler, IEventHandler, EventBus } from '@nestjs/cqrs';
import { RocketChatService } from '@modules/rocketchat';
import {
	UserDeletedEvent,
	DeletionService,
	DataDeletedEvent,
	DomainDeletionReport,
	DomainName,
	DomainDeletionReportBuilder,
	DomainOperationReportBuilder,
	OperationType,
	DataDeletionDomainOperationLoggable,
	DeletionErrorLoggableException,
} from '@modules/deletion';
import { RocketChatUser } from '../domain';
import { RocketChatUserRepo } from '../repo';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class RocketChatUserService implements DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(
		private readonly rocketChatUserRepo: RocketChatUserRepo,
		private readonly rocketChatService: RocketChatService,
		private readonly logger: Logger,
		private readonly eventBus: EventBus
	) {
		this.logger.setContext(RocketChatUserService.name);
	}

	public async handle({ deletionRequestId, targetRefId }: UserDeletedEvent): Promise<void> {
		const dataDeleted = await this.deleteUserData(targetRefId);
		await this.eventBus.publish(new DataDeletedEvent(deletionRequestId, dataDeleted));
	}

	public async findByUserId(userId: EntityId): Promise<RocketChatUser[]> {
		const user: RocketChatUser[] = await this.rocketChatUserRepo.findByUserId(userId);

		return user;
	}

	public async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user from rocket chat',
				DomainName.ROCKETCHATUSER,
				userId,
				StatusModel.PENDING
			)
		);
		const rocketChatUser = await this.rocketChatUserRepo.findByUserId(userId);

		if (rocketChatUser.length > 0) {
			try {
				const [, rocketChatUserDeleted] = await Promise.all([
					this.rocketChatService.deleteUser(rocketChatUser[0].username),
					this.rocketChatUserRepo.deleteByUserId(rocketChatUser[0].userId),
				]);

				const result = DomainDeletionReportBuilder.build(
					DomainName.ROCKETCHATUSER,
					[DomainOperationReportBuilder.build(OperationType.DELETE, rocketChatUserDeleted, [rocketChatUser[0].id])],
					[
						DomainDeletionReportBuilder.build(DomainName.ROCKETCHATSERVICE, [
							DomainOperationReportBuilder.build(OperationType.DELETE, 1, [rocketChatUser[0].username]),
						]),
					]
				);

				this.logger.info(
					new DataDeletionDomainOperationLoggable(
						'Successfully deleted user from rocket chat',
						DomainName.ROCKETCHATUSER,
						userId,
						StatusModel.FINISHED,
						0,
						rocketChatUserDeleted
					)
				);

				return result;
			} catch {
				throw new DeletionErrorLoggableException(
					`Failed to delete user data for userId '${userId}' from RocketChatUser collection / RocketChat service`
				);
			}
		} else {
			const result = DomainDeletionReportBuilder.build(
				DomainName.ROCKETCHATUSER,
				[DomainOperationReportBuilder.build(OperationType.DELETE, 0, [])],
				[
					DomainDeletionReportBuilder.build(DomainName.ROCKETCHATSERVICE, [
						DomainOperationReportBuilder.build(OperationType.DELETE, 0, []),
					]),
				]
			);

			this.logger.info(
				new DataDeletionDomainOperationLoggable(
					'RocketChat user already deleted',
					DomainName.ROCKETCHATUSER,
					userId,
					StatusModel.FINISHED,
					0,
					0
				)
			);

			return result;
		}
	}
}
