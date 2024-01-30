import { Injectable } from '@nestjs/common';
import { DomainModel, EntityId, StatusModel } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { RocketChatUser } from '../domain';
import { RocketChatUserRepo } from '../repo';

@Injectable()
export class RocketChatUserService {
	constructor(private readonly rocketChatUserRepo: RocketChatUserRepo, private readonly logger: Logger) {
		this.logger.setContext(RocketChatUserService.name);
	}

	public async findByUserId(userId: EntityId): Promise<RocketChatUser[]> {
		const user: RocketChatUser[] = await this.rocketChatUserRepo.findByUserId(userId);

		return user;
	}

	public async deleteByUserId(userId: EntityId): Promise<number> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user from rocket chat',
				DomainModel.ROCKETCHATUSER,
				userId,
				StatusModel.PENDING
			)
		);
		const deletedRocketChatUser = await this.rocketChatUserRepo.deleteByUserId(userId);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted user from rocket chat',
				DomainModel.ROCKETCHATUSER,
				userId,
				StatusModel.FINISHED,
				0,
				deletedRocketChatUser
			)
		);

		return deletedRocketChatUser;
	}
}
