import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { SchoolService } from '@src/modules/school';
import { UserService } from '@src/modules/user';
import { System, SystemService } from '@src/modules/system';
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

		let system: System | null = null;
		if (systemId) {
			system = await this.systemService.findById(systemId);
		}

		const permissions = user.resolvePermissions();

		const dto = MeResponseMapper.mapToResponse(school, user, accountId, permissions, system);

		return dto;
	}
}
