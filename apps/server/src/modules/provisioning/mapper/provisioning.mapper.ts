import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';

export class ProvisioningMapper {
	static mapToUserDto(provisioningDto: ProvisioningDto): UserDto {
		return new UserDto({});
	}

	static mapToSchoolDto(provisioningDto: ProvisioningDto): SchoolDto {
		return new SchoolDto({});
	}
}
