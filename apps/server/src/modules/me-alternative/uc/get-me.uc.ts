import { Injectable } from '@nestjs/common';
import { ICurrentUser } from '@infra/auth-guard';
import { SchoolRepo } from '../repo/school.repo';
import { UserRepo } from '../repo/user.repo';
import { MeMapper } from './me.mapper';

@Injectable()
export class GetMeUc {
	constructor(private readonly userRepo: UserRepo, private readonly schoolRepo: SchoolRepo) {}

	public async execute(currentUser: ICurrentUser) {
		const [school, user] = await Promise.all([
			this.schoolRepo.getSchoolById(currentUser.schoolId),
			this.userRepo.getUserById(currentUser.userId),
		]);

		const dto = MeMapper.mapToDto(user.id, user.firstName, school.name);

		return dto;
	}
}
