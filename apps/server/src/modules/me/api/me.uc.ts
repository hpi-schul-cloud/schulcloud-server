import { SchoolService } from '@modules/school';
import { SystemService } from '@modules/system';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { MeResponse } from './dto';
import { MeResponseMapper } from './mapper';

@Injectable()
export class MeUc {
	constructor(
		private readonly schoolService: SchoolService,
		private readonly userService: UserService,
		private readonly systemService: SystemService
	) {}

	public async getMe(
		userId: EntityId,
		schoolId: EntityId,
		accountId: EntityId,
		systemId?: EntityId
	): Promise<MeResponse> {
		const [school, user] = await Promise.all([
			this.schoolService.getSchoolById(schoolId),
			this.userService.getUserEntityWithRoles(userId), // TODO: replace when user domain object is available
		]);

		const permissions = this.userService.resolvePermissions(user);

		const dto = MeResponseMapper.mapToResponse(school, user, accountId, permissions, systemId);

		return dto;
	}
}
