import { ICurrentUser } from '@infra/auth-guard';
import { Inject, Injectable } from '@nestjs/common';
import { USER_REPO, UserRepo } from './interface/user.repo.interface';
import { MeMapper } from './mapper/me.mapper';

@Injectable()
export class GetMeUc {
	constructor(@Inject(USER_REPO) private readonly userRepo: UserRepo) {}

	public async execute(currentUser: ICurrentUser) {
		const user = await this.userRepo.getUserById(currentUser.userId);

		const dto = MeMapper.mapToDto(user);

		return dto;
	}
}
