import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';

export class ProvisioningDto {
	constructor(provisioningDto: ProvisioningDto) {
		this.userDto = provisioningDto.userDto;
		this.schoolDto = provisioningDto.schoolDto;
	}

	userDto: ProvisioningUserOutputDto;

	schoolDto?: ProvisioningSchoolOutputDto;
}
