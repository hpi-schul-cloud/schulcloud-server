import { Injectable } from '@nestjs/common';
import { UserUc } from '@src/modules/user/uc';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { RoleDto } from '@src/modules/user/uc/dto/role.dto';
import { Permission, RoleName } from '@shared/domain';

@Injectable()
export class ProvisioningUc {
	constructor(private readonly userUc: UserUc, private readonly schoolUc: SchoolUc) {}

	async run(sub: string, systemId: string) {
		// StrategyEnum = call SystemUc to get Strategy
		// ProvisioningDto = call strategy.apply

		// schoolDto = mapProvisioningDto to SchoolDto
		// userDto = mapProvisioningDto to UserDto

		// call schoolUsecase(schoolDto)
		// call userUsecase (userDto)

		const roleDto = new RoleDto({
			name: RoleName.ADMINISTRATOR,
			roles: [],
			permissions: [Permission.ADD_SCHOOL_MEMBERS],
		});
		const schoolDto = new SchoolDto({ name: 'blub' });
		const userDto = new UserDto({
			email: 'abc@def.xyz',
			firstName: 'Hans',
			lastName: 'Meyer',
			roles: [roleDto],
			school: schoolDto,
		});

		await this.schoolUc.saveSchool(schoolDto);
		await this.userUc.save(userDto);
	}
}
