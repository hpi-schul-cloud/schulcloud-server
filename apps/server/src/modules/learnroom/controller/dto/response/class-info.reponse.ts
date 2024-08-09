import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';

export class ClassInfoResponse {
	@ApiProperty()
	id: EntityId;

	@ApiProperty()
	name: string;

	constructor(props: ClassInfoResponse) {
		this.id = props.id;
		this.name = props.name;
	}
}
