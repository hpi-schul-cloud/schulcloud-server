import { RuntimeConfigValueType } from '@infra/runtime-config/domain/runtime-config-value.do';
import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '@shared/domain/entity';

export interface RuntimeConfigProperties {
	key: string;
	type: RuntimeConfigValueType;
	value: string;
}

@Entity()
export class RuntimeConfigEntity extends BaseEntity implements RuntimeConfigProperties {
	constructor(props: RuntimeConfigProperties) {
		super();
		this.key = props.key;
		this.type = props.type;
		this.value = props.value;
	}

	@Property({ nullable: false })
	key: string;

	@Property({ nullable: false })
	type: RuntimeConfigValueType;

	@Property({ nullable: false })
	value: string;
}
