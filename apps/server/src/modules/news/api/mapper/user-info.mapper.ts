import { User } from '@modules/user/repo';
import { UserInfoResponse } from '../dto';

export class UserInfoMapper {
	public static mapToResponse(user: User): UserInfoResponse {
		const dto = new UserInfoResponse({
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
		});
		return dto;
	}
}
