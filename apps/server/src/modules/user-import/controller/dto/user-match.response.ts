import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { IsMongoId } from 'class-validator';
import { MatchCreatorResponse } from './match-creator.response';
import { RoleNameResponse } from './role-name.response';

class UserResponse {
	constructor(props: UserResponse) {
		this.userId = props.userId;
		this.loginName = props.loginName;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
	}

	@IsMongoId()
	@ApiProperty({ description: 'local user id' })
	userId: string;

	@ApiProperty({ description: 'login name of local user' })
	loginName: string;

	@ApiProperty({ description: 'firstname of local user' })
	firstName: string;

	@ApiProperty({ description: 'lastname of local user' })
	lastName: string;
}

export class UserDetailsResponse extends UserResponse {
	constructor(props: UserDetailsResponse) {
		super(props);
		this.roleNames = props.roleNames;
	}

	@ApiProperty({
		description: 'list of user roles from external system: student, teacher, admin',
		enum: RoleNameResponse,
	})
	roleNames: RoleNameResponse[];
}

export class UserMatchResponse extends UserResponse {
	constructor(props: UserMatchResponse) {
		super(props);
		this.matchedBy = props.matchedBy;
	}

	@ApiProperty({
		description: 'match type: admin (manual) or auto (set, when names match exactly for a single user',
		enum: MatchCreatorResponse,
	})
	matchedBy: MatchCreatorResponse;
}

export class UserDetailsListResponse extends PaginationResponse<UserDetailsResponse[]> {
	constructor(data: UserDetailsResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [UserDetailsResponse] })
	data: UserDetailsResponse[];
}
