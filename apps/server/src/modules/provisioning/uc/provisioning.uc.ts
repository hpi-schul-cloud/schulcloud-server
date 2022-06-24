import { Injectable } from '@nestjs/common';
import { UserUc } from '@src/modules/user/uc';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { RoleName } from '@shared/domain';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { RoleUc } from '@src/modules/role/uc/role.uc';
import { SystemUc } from '@src/modules/system/uc/system.uc';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';

@Injectable()
export class ProvisioningUc {
	constructor(
		private readonly userUc: UserUc,
		private readonly schoolUc: SchoolUc,
		private readonly roleUc: RoleUc,
		private readonly systemUc: SystemUc
	) {}

	async run(sub: string, systemId: string) {
		// StrategyEnum = call SystemUc to get Strategy
		// ProvisioningDto = call strategy.apply

		// schoolDto = mapProvisioningDto to SchoolDto
		// userDto = mapProvisioningDto to UserDto

		// call schoolUsecase(schoolDto)
		// call userUsecase (userDto)

		const system: SystemDto = await this.systemUc.findById(systemId);
		switch (system.provisioningStrategy) {
			default:
				break;
		}

		const schoolDto = new SchoolDto({ name: 'blub' });
		const roleDto = await this.roleUc.findByName(RoleName.STUDENT);
		const userDto = new UserDto({
			email: 'abc@def.xyz',
			firstName: 'Hans',
			lastName: 'Meyer',
			roles: [roleDto],
			school: schoolDto,
		});

		// TODOs: user use case tests, role repo findByIds findbyNAMES!!! tests, usermapper tests, provisioning uc tests

		if (schoolDto) {
			await this.schoolUc.saveSchool(schoolDto);
		}

		if (userDto) {
			await this.userUc.save(userDto);
		}
	}
}
