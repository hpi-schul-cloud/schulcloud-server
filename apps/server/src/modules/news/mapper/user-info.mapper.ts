import { User } from '@shared/domain';
import { UserInfoResponse } from '../controller/dto';

export class UserInfoMapper {
	static mapToResponse(user: User): UserInfoResponse {
		const dto = new UserInfoResponse();
		dto.id = user.id;
		dto.firstName = user.firstName;
		dto.lastName = user.lastName;
		return dto;
	}
}
