import { EntityId } from '@shared/domain';
import { AccountBaseDto } from './account-base.dto';

export class AccountReadDto extends AccountBaseDto {
	readonly id: EntityId;

	readonly createdAt: Date;

	readonly updatedAt: Date;

	readonly oldHashedPassword?: string;

	constructor(props: AccountReadDto) {
		super(props);
		this.id = props.id;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
		this.oldHashedPassword = props.oldHashedPassword;
	}
}
