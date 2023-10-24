import { Embedded, Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { CustomParameterEntryEntity } from '../../common/entity';
import { SchoolExternalToolEntity } from '../../school-external-tool/entity';
import { ContextExternalToolType } from './context-external-tool-type.enum';

export interface IContextExternalToolProperties {
	schoolTool: SchoolExternalToolEntity;

	contextId: string;

	contextType: ContextExternalToolType;

	displayName?: string;

	parameters?: CustomParameterEntryEntity[];

	toolVersion: number;
}

@Entity({ tableName: 'context_external_tools' })
export class ContextExternalToolEntity extends BaseEntityWithTimestamps {
	@ManyToOne()
	schoolTool: SchoolExternalToolEntity;

	@Property()
	contextId: string;

	@Property()
	contextType: ContextExternalToolType;

	@Property({ nullable: true })
	displayName?: string;

	@Embedded(() => CustomParameterEntryEntity, { array: true })
	parameters: CustomParameterEntryEntity[];

	@Property()
	toolVersion: number;

	constructor(props: IContextExternalToolProperties) {
		super();
		this.schoolTool = props.schoolTool;
		this.contextId = props.contextId;
		this.contextType = props.contextType;
		this.displayName = props.displayName;
		this.parameters = props.parameters ?? [];
		this.toolVersion = props.toolVersion;
	}
}
