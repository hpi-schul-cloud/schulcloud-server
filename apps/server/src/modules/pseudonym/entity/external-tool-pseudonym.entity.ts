import { Entity, Property, Unique } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';

export type IExternalToolPseudonymEntityProps = Readonly<
	Omit<ExternalToolPseudonymEntity, keyof BaseEntityWithTimestamps>
>;

@Entity({ tableName: 'external-tool-pseudonyms' })
@Unique({ properties: ['userId', 'toolId'] })
export class ExternalToolPseudonymEntity extends BaseEntityWithTimestamps {
	@Property()
	@Unique()
	pseudonym: string;

	@Property()
	toolId: ObjectId;

	@Property()
	userId: ObjectId;

	constructor(props: IExternalToolPseudonymEntityProps) {
		super();
		this.pseudonym = props.pseudonym;
		this.toolId = props.toolId;
		this.userId = props.userId;
	}
}
