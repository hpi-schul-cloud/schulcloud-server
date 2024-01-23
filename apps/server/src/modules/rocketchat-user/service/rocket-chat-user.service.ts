import { Injectable } from '@nestjs/common';
import { DomainModel, EntityId, OperationModel, StatusModel } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { DomainOperation } from '@shared/domain/interface';
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

	public async deleteByUserId(userId: EntityId): Promise<DomainOperation> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user from rocket chat',
				DomainModel.ROCKETCHATUSER,
				userId,
				StatusModel.PENDING
			)
		);
		const rocketChatUser = await this.rocketChatUserRepo.findByUserId(userId);

		const deletedRocketChatUser = await this.rocketChatUserRepo.deleteByUserId(userId);

		const result = DomainOperationBuilder.build(DomainModel.ROCKETCHATUSER, OperationModel.DELETE, 1, [
			rocketChatUser[0].id,
		]);

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

		return result;
	}
}
