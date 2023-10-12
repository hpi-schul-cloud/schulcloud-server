import { RoleName } from '@shared/domain';

export class ExternalGroupUserDto {
	externalUserId: string;

	roleName: RoleName;

	constructor(props: ExternalGroupUserDto) {
		this.externalUserId = props.externalUserId;
		this.roleName = props.roleName;
	}
}
