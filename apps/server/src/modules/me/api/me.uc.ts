import { Injectable } from '@nestjs/common';
import { SchoolService } from '@src/modules/school';
import { UserService } from '@src/modules/user';
import { EntityId } from '@shared/domain/types';
import { MeResponseMapper } from './mapper';
import { MeResponse } from './dto';

@Injectable()
export class MeUc {
	constructor(private readonly schoolService: SchoolService, private readonly userService: UserService) {}

	// no authorization is required
	public async getMe(userId: EntityId, schoolId: EntityId, accountId: EntityId): Promise<MeResponse> {
		const [school, user] = await Promise.all([
			this.schoolService.getSchoolById(schoolId),
			this.userService.getUserEntityWithRoles(userId), // need to replace is valid user domain object avaible
		]);

		const dto = MeResponseMapper.mapToResponse(school, user, accountId);

		return dto;
	}
}
