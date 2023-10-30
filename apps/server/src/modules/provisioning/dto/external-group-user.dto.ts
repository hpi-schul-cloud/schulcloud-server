import { RoleName } from '@shared/domain/interface/rolename.enum';

export class ExternalGroupUserDto {
	externalUserId: string;

	roleName: RoleName;

	constructor(props: ExternalGroupUserDto) {
		this.externalUserId = props.externalUserId;
		this.roleName = props.roleName;
	}
}
