export class TeamRolePermissionsDto {
	teamId: string;

	teamName: string;

	roleName: string;

	permissions: boolean[];

	constructor(props: TeamRolePermissionsDto) {
		this.teamId = props.teamId;
		this.teamName = props.teamName;
		this.roleName = props.roleName;
		this.permissions = props.permissions;
	}
}
