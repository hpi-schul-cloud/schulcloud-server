import { UserInfo } from '../entity';
import { UserInfoResponseDto } from '../controller/dto';

export class UserInfoMapper {
	static mapToResponse(userInfo: UserInfo): UserInfoResponseDto {
		if (userInfo != null) {
			const dto = new UserInfoResponseDto();
			dto.id = userInfo.id;
			dto.firstName = userInfo.firstName;
			dto.lastName = userInfo.lastName;
			return dto;
		}
		return null;
	}
}
