import { UserDto } from './user.dto';

export class UserListDto {
	public limit: number;

	public offset: number;

	// public total: number;

	public data: UserDto[];

	constructor(props: UserListDto) {
		this.limit = props.limit;
		this.offset = props.offset;
		// this.total = props.total;
		this.data = props.data;
	}
}
