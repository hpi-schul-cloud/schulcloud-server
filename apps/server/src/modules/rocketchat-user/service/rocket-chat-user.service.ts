import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { RocketChatUserRepo } from '../repo';
import { RocketChatUser } from '../domain';

@Injectable()
export class RocketChatUserService {
	constructor(private readonly rocketChatUserRepo: RocketChatUserRepo) {}

	public async findByUserId(userId: EntityId): Promise<RocketChatUser> {
		const user: RocketChatUser = await this.rocketChatUserRepo.findByUserId(userId);

		return user;
	}

	public deleteByUserId(userId: EntityId): Promise<number> {
		return this.rocketChatUserRepo.deleteByUserId(userId);
	}
}
