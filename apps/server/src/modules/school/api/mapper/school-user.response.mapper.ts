import { Page, UserDO } from '@shared/domain/domainobject';
import { SchoolUserListResponse, SchoolUserResponse } from '../dto/response/school-user.response';

export class SchoolUserResponseMapper {
	public static mapToResponse(user: UserDO): SchoolUserResponse {
		const res = new SchoolUserResponse({
			id: user.id || '',
			firstName: user.firstName,
			lastName: user.lastName,
			schoolName: user.schoolName || '',
		});

		return res;
	}

	public static mapToListResponse(users: Page<UserDO>): SchoolUserListResponse {
		const data: SchoolUserResponse[] = users.data.map((user) => this.mapToResponse(user));
		const response = new SchoolUserListResponse(data);

		return response;
	}
}
