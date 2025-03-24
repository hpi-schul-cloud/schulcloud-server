import { UserDo } from '@modules/user';
import { Page } from '@shared/domain/domainobject';
import { SchoolUserListResponse, SchoolUserResponse } from '../dto';

export class SchoolUserResponseMapper {
	public static mapToResponse(user: UserDo): SchoolUserResponse {
		const res = new SchoolUserResponse({
			id: user.id || '',
			firstName: user.firstName,
			lastName: user.lastName,
			schoolName: user.schoolName || '',
		});

		return res;
	}

	public static mapToListResponse(users: Page<UserDo>): SchoolUserListResponse {
		const data: SchoolUserResponse[] = users.data.map((user) => this.mapToResponse(user));
		const response = new SchoolUserListResponse(data);

		return response;
	}
}
