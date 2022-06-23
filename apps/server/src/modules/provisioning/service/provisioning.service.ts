import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { Injectable } from '@nestjs/common';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { ProvisioningMapper } from '@src/modules/provisioning/mapper/provisioning.mapper';

@Injectable()
export class ProvisioningService {
	createSchoolDto(provisioningDto: ProvisioningDto): SchoolDto {
		return ProvisioningMapper.mapToSchoolDto(provisioningDto);
	}

	createUserDto(provisioningDto: ProvisioningDto): UserDto {
		return ProvisioningMapper.mapToUserDto(provisioningDto);
	}
}
