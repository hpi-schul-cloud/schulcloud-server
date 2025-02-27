import { User } from '@modules/user/repo';
import { UserInfoResponse } from '../controller/dto';

export class UserInfoMapper {
	static mapToResponse(user: User): UserInfoResponse {
		const dto = new UserInfoResponse({
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
		});
		return dto;
	}
}
