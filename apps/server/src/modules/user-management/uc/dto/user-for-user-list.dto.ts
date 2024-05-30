import { EntityId } from '@shared/domain/types';
import { ClassForUserListDto } from './class-for-user-list.dto';

export class UserForUserListDto {
	public id: EntityId;

	public firstName: string;

	public lastName: string;

	public email: string;

	public classes: ClassForUserListDto[] = [];

	constructor(props: UserForUserListDto) {
		this.id = props.id;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.email = props.email;
		this.classes = props.classes;
	}
}
