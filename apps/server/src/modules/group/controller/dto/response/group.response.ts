import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExternalSourceResponse } from './external-source.response';
import { GroupTypeResponse } from './group-type.response';
import { GroupUserResponse } from './group-user.response';

export class GroupResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	type: GroupTypeResponse;

	@ApiProperty({ type: [GroupUserResponse] })
	users: GroupUserResponse[];

	@ApiPropertyOptional()
	externalSource?: ExternalSourceResponse;

	@ApiPropertyOptional()
	organizationId?: string;

	constructor(group: GroupResponse) {
		this.id = group.id;
		this.name = group.name;
		this.type = group.type;
		this.users = group.users;
		this.externalSource = group.externalSource;
		this.organizationId = group.organizationId;
	}
}
