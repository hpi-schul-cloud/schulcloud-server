import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
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
	StatusModel,
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

	public async findByUserId(userId: EntityId): Promise<RocketChatUser | null> {
		const user: RocketChatUser | null = await this.rocketChatUserRepo.findByUserId(userId);

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

		if (rocketChatUser !== null) {
			try {
				const deletedUserFormRocketChatService = await this.rocketChatService.deleteUser(rocketChatUser.username);

				if (deletedUserFormRocketChatService.success === true) {
					const rocketChatUserDeleted = await this.rocketChatUserRepo.deleteByUserId(rocketChatUser.userId);

					const result = DomainDeletionReportBuilder.build(
						DomainName.ROCKETCHATUSER,
						[DomainOperationReportBuilder.build(OperationType.DELETE, rocketChatUserDeleted, [rocketChatUser.id])],
						[
							DomainDeletionReportBuilder.build(DomainName.ROCKETCHATSERVICE, [
								DomainOperationReportBuilder.build(OperationType.DELETE, 1, [rocketChatUser.username]),
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
				}

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
						'Failed to delete user from RocketChat service',
						DomainName.ROCKETCHATUSER,
						userId,
						StatusModel.FAILED,
						0,
						0
					)
				);

				return result;
			} catch {
				this.logger.info(
					new DataDeletionDomainOperationLoggable(
						'Failed to delete user data from RocketChatUser collection / RocketChat service',
						DomainName.ROCKETCHATUSER,
						userId,
						StatusModel.FAILED,
						0,
						0
					)
				);

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
