import { EntityId } from '@shared/domain/types';
import { ClassDto } from './class.dto';

export class UserDto {
	public id: EntityId;

	public firstName: string;

	public lastName: string;

	public email: string;

	public classes: ClassDto[] = [];

	constructor(props: UserDto) {
		this.id = props.id;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.email = props.email;
		this.classes = props.classes;
	}
}
