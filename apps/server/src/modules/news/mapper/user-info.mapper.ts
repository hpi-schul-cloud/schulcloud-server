import { User } from '@shared/domain/entity/user.entity';
import { UserInfoResponse } from '../controller/dto/user-info.response';

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
