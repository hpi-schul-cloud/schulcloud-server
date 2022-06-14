export class TeamPermissionsDto {
	read?: boolean;

	write?: boolean;

	create?: boolean;

	delete?: boolean;

	share?: boolean;

	constructor(props: TeamPermissionsDto) {
		this.read   = !!props.read;
		this.write  = !!props.write;
		this.create = !!props.create;
		this.delete = !!props.delete;
		this.share  = !!props.share;
	}
}
