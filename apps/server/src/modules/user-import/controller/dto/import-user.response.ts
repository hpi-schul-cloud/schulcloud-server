import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { IsMongoId, IsString } from 'class-validator';
import { UserMatchResponse } from './user-match.response';
import { UserRole } from './user-role';

export class ImportUserResponse {
	constructor(props: ImportUserResponse) {
		this.importUserId = props.importUserId;
		this.loginName = props.loginName;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.roleNames = props.roleNames;
		this.classNames = props.classNames;
		this.externalRoleNames = props.externalRoleNames;
		if (props.match != null) this.match = props.match;
		if (props.flagged === true) this.flagged = true;
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
		enum: UserRole,
		isArray: true,
	})
	roleNames: UserRole[];

	@ApiProperty({ description: 'names of classes the user attends from external system' })
	classNames: string[];

	@ApiPropertyOptional({ description: 'assignemnt to a local user account', type: UserMatchResponse })
	match?: UserMatchResponse;

	// explicit type is needed for OpenAPI generator
	// eslint-disable-next-line @typescript-eslint/no-inferrable-types
	@ApiProperty({ description: 'manual flag to apply it as filter' })
	flagged: boolean = false;

	@ApiPropertyOptional({ description: 'exact user roles from the external system' })
	externalRoleNames?: string[];
}

export class ImportUserListResponse extends PaginationResponse<ImportUserResponse[]> {
	constructor(data: ImportUserResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [ImportUserResponse] })
	data: ImportUserResponse[];
}
