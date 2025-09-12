import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '@shared/domain/entity';

export interface RuntimeConfigProperties {
	key: string;
}

@Entity()
export class RuntimeConfigEntity extends BaseEntity implements RuntimeConfigProperties {
	constructor(props: RuntimeConfigProperties) {
		super();
		this.key = props.key;
	}

	@Property({ nullable: false })
	key: string;
}
