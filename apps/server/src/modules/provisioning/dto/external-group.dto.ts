import { GroupTypes } from '@src/modules/group';
import { ExternalGroupUserDto } from './external-group-user.dto';

export class ExternalGroupDto {
	externalId: string;

	name: string;

	users: ExternalGroupUserDto[];

	from: Date;

	until: Date;

	type: GroupTypes;

	externalOrganizationId?: string;

	constructor(props: ExternalGroupDto) {
		this.externalId = props.externalId;
		this.name = props.name;
		this.users = props.users;
		this.from = props.from;
		this.until = props.until;
		this.type = props.type;
		this.externalOrganizationId = props.externalOrganizationId;
	}
}
