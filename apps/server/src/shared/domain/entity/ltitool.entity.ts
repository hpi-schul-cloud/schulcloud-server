import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';

export type ILtiToolProperties = Readonly<Omit<LtiTool, keyof BaseEntityWithTimestamps>>;

@Entity({ tableName: 'ltitools' })
export class LtiTool extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	constructor(props: ILtiToolProperties) {
		super();
		this.name = props.name;
	}
}
