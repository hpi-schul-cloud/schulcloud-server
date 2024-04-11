import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { SchoolService } from '@src/modules/school';
import { UserService } from '@src/modules/user';
import { SchoolPermissionService } from '../domain/school-permission.service';
import { MeResponse } from './dto';
import { MeResponseMapper } from './mapper';

@Injectable()
export class MeUc {
	constructor(
		private readonly schoolService: SchoolService,
		private readonly userService: UserService,
		private readonly schoolPermissionService: SchoolPermissionService
	) {}

	public async getMe(userId: EntityId, schoolId: EntityId, accountId: EntityId): Promise<MeResponse> {
		const [school, user] = await Promise.all([
			this.schoolService.getSchoolById(schoolId),
			this.userService.getUserEntityWithRoles(userId), // TODO: replace when user domain object is available
		]);

		const permissions = this.schoolPermissionService.resolvePermissions(user, school);

		const dto = MeResponseMapper.mapToResponse(school, user, accountId, permissions);

		return dto;
	}
}
