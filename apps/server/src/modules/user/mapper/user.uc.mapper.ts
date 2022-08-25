import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';

export class UserUcMapper {
	static mapFromProvisioningUserOutputDtoToUserDto(
		provUserOutput: ProvisioningUserOutputDto,
		roleIds: string[]
	): UserDto {
		return new UserDto({
			id: provUserOutput.id,
			email: provUserOutput.email,
			firstName: provUserOutput.firstName,
			lastName: provUserOutput.lastName,
			roleIds,
			schoolId: provUserOutput.schoolId,
			externalId: provUserOutput.externalId,
		});
	}
}
