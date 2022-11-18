import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { IsMongoId } from 'class-validator';
import { MatchType } from './match-type';
import { UserRole } from './user-role';

export class UserMatchResponse {
	constructor(props: UserMatchResponse) {
		this.userId = props.userId;
		this.loginName = props.loginName;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.roleNames = props.roleNames;
		if (props.matchedBy != null) this.matchedBy = props.matchedBy;
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

	@ApiProperty({
		description: 'list of user roles from external system: student, teacher, admin',
		enum: UserRole,
		isArray: true,
	})
	roleNames: UserRole[];

	@ApiPropertyOptional({
		description: 'match type: admin (manual) or auto (set, when names match exactly for a single user',
		enum: MatchType,
	})
	matchedBy?: MatchType;
}

export class UserMatchListResponse extends PaginationResponse<UserMatchResponse[]> {
	constructor(data: UserMatchResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [UserMatchResponse] })
	data: UserMatchResponse[];
}
