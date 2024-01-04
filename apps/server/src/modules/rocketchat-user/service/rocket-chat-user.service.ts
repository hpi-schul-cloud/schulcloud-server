import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { RocketChatUser } from '../domain';
import { RocketChatUserRepo } from '../repo';

@Injectable()
export class RocketChatUserService {
	constructor(private readonly rocketChatUserRepo: RocketChatUserRepo, private readonly logger: LegacyLogger) {
		this.logger.setContext(RocketChatUserService.name);
	}

	public async findByUserId(userId: EntityId): Promise<RocketChatUser> {
		const user: RocketChatUser = await this.rocketChatUserRepo.findByUserId(userId);

		return user;
	}

	public deleteByUserId(userId: EntityId): Promise<number> {
		this.logger.log(`Deleting rocketChatUser with userId ${userId}`);
		const deletedRocketChatUser: Promise<number> = this.rocketChatUserRepo.deleteByUserId(userId);

		this.logger.log(`Successfully deleted rocketChatUser with userId ${userId}`);

		return deletedRocketChatUser;
	}
}
