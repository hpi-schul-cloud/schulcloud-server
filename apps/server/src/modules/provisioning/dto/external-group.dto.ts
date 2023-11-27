import { GroupTypes } from '@modules/group';
import { ExternalGroupUserDto } from './external-group-user.dto';

export class ExternalGroupDto {
	externalId: string;

	name: string;

	user: ExternalGroupUserDto;

	otherUsers?: ExternalGroupUserDto[];

	from: Date;

	until: Date;

	type: GroupTypes;

	constructor(props: ExternalGroupDto) {
		this.externalId = props.externalId;
		this.name = props.name;
		this.user = props.user;
		this.otherUsers = props.otherUsers;
		this.from = props.from;
		this.until = props.until;
		this.type = props.type;
	}
}
