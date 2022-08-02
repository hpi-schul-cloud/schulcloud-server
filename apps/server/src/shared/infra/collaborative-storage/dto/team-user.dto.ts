import { EntityId, RoleName } from '@shared/domain/index';

export class TeamUserDto {
	userId: EntityId;

	roleName: RoleName;

	schoolId: EntityId;

	constructor(props: TeamUserDto) {
		this.userId = props.userId;
		this.roleName = props.roleName;
		this.schoolId = props.schoolId;
	}
}
