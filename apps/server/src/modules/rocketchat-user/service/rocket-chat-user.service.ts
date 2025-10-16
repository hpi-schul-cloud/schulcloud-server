import { Logger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { RocketChatUser } from '../domain';
import { RocketChatUserRepo } from '../repo';

@Injectable()
export class RocketChatUserService {
	constructor(private readonly rocketChatUserRepo: RocketChatUserRepo, private readonly logger: Logger) {
		this.logger.setContext(RocketChatUserService.name);
	}

	public async findByUserId(userId: EntityId): Promise<RocketChatUser | null> {
		const user: RocketChatUser | null = await this.rocketChatUserRepo.findByUserId(userId);

		return user;
	}
}
