import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { IsMongoId, IsString } from 'class-validator';
import { RoleNameResponse } from './role-name.response';
import { UserMatchResponse } from './user-match.response';

export class ImportUserResponse {
	constructor(props: ImportUserResponse) {
		this.importUserId = props.importUserId;
		this.loginName = props.loginName;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.roleNames = props.roleNames;
		this.classNames = props.classNames;
		if (props.match != null) this.match = props.match;
	}

	@IsMongoId()
	@ApiProperty({
		pattern: '[a-f0-9]{24}',
		description: 'id reference to a import user',
	})
	// no school, system
	importUserId: string;

	@IsString()
	@ApiProperty({
		description: 'login name from external system',
	})
	loginName: string;

	@IsString()
	@ApiProperty({
		description: 'external systems user firstname',
	})
	firstName: string;

	@IsString()
	@ApiProperty({
		description: 'external systems user lastname',
	})
	lastName: string;

	@ApiProperty({
		description: 'list of user roles from external system: student, teacher, admin',
		enum: RoleNameResponse,
	})
	roleNames: RoleNameResponse[];

	@ApiProperty({ description: 'names of classes the user attends from external system' })
	classNames: string[];

	@ApiPropertyOptional({ description: 'assignemnt to a local user account' })
	match?: UserMatchResponse;
}

export class ImportUserListResponse extends PaginationResponse<ImportUserResponse[]> {
	constructor(data: ImportUserResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [ImportUserResponse] })
	data: ImportUserResponse[];
}
