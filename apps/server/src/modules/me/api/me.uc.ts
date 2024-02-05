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
	public async getMe(userId: EntityId): Promise<MeResponse> {
		const user = await this.userService.getUser2(userId); // we need a user DO but nothing that is save to use exists, out of scope? Am besten neuer user Service, der aktuelle mixed sehr viel
		const school = await this.schoolService.getSchoolById(user.school.id); // In jwt we have the schoolId, but unsure if it is save to use must be checked, but then we can use promise all
		const permissions = user.resolvePermissions(); // mapping to permission enum will better, but must be done into methode. Not scope of the ticket i think.
		const roles = user.getRoles();

		const dto = MeResponseMapper.mapToResponse(school, user, roles, permissions); // pass roles as 4. parameter to hide sources for the mapper

		return dto;
	}
}
