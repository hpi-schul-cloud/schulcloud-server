import { Injectable } from '@nestjs/common';
import { DomainName, EntityId, OperationType, StatusModel } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { DomainDeletionReportBuilder, DomainOperationReportBuilder } from '@shared/domain/builder';
import { DeletionService, DomainDeletionReport } from '@shared/domain/interface';
import { EventsHandler, IEventHandler, EventBus } from '@nestjs/cqrs';
import { UserDeletedEvent, DataDeletedEvent } from '@src/modules/deletion/event';
import { RocketChatService } from '@modules/rocketchat';
import { DeletionErrorLoggableException } from '@shared/common/loggable-exception';
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

	async handle({ deletionRequest }: UserDeletedEvent) {
		const dataDeleted = await this.deleteUserData(deletionRequest.targetRefId);
		await this.eventBus.publish(new DataDeletedEvent(deletionRequest, dataDeleted));
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
			// try catch
			const [rocketChatDeleted, rocketChatUserDeleted] = await Promise.all([
				this.rocketChatService.deleteUser(rocketChatUser[0].username),
				this.rocketChatUserRepo.deleteByUserId(rocketChatUser[0].userId),
			]);

			if (rocketChatDeleted && rocketChatUserDeleted) {
				const result = DomainDeletionReportBuilder.build(
					DomainName.ROCKETCHATUSER,
					[DomainOperationReportBuilder.build(OperationType.DELETE, rocketChatUserDeleted, [rocketChatUser[0].id])],
					DomainDeletionReportBuilder.build(DomainName.ROCKETCHATSERVICE, [
						DomainOperationReportBuilder.build(OperationType.DELETE, 1, [rocketChatUser[0].username]),
					])
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
		}

		throw new DeletionErrorLoggableException(`Failed to delete rocketChatUser for '${userId}'`);
	}
}
