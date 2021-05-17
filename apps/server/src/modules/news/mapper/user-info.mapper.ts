import { UserInfo } from '../entity';
import { UserInfoResponse } from '../controller/dto';

export class UserInfoMapper {
	static mapToResponse(userInfo: UserInfo): UserInfoResponse {
		if (userInfo != null) {
			const dto = new UserInfoResponse();
			dto.id = userInfo.id;
			dto.firstName = userInfo.firstName;
			dto.lastName = userInfo.lastName;
			return dto;
		}
		return null;
	}
}
