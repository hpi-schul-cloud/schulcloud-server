import { ICurrentUser } from '@infra/auth-guard';
import { Injectable } from '@nestjs/common';
import { UserRepo } from '../repo/user.repo';
import { MeMapper } from './mapper/me.mapper';

@Injectable()
export class GetMeUc {
	constructor(private readonly userRepo: UserRepo) {}

	public async execute(currentUser: ICurrentUser) {
		const user = await this.userRepo.getUserById(currentUser.userId);

		const dto = MeMapper.mapToDto(user);

		return dto;
	}
}
