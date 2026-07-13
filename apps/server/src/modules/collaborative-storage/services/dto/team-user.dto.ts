export class TeamUserDto {
	userId: string;

	roleId: string;

	schoolId: string;

	constructor(props: TeamUserDto) {
		this.userId = props.userId;
		this.roleId = props.roleId;
		this.schoolId = props.schoolId;
	}
}
