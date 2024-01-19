import { EntityId } from '@shared/domain/types';
import { AccountSaveDto } from './account-save.dto';

export class AccountDto extends AccountSaveDto {
	readonly id: EntityId;

	readonly createdAt: Date;

	readonly updatedAt: Date;

	constructor(props: AccountDto) {
		super(props);
		this.id = props.id;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}
}
