import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';

export class ProvisioningDto {
	constructor(provisioningDto: ProvisioningDto) {
		this.userDto = provisioningDto.userDto;
		this.schoolDto = provisioningDto.schoolDto;
	}

	userDto?: UserDto;

	schoolDto!: SchoolDto;
}
