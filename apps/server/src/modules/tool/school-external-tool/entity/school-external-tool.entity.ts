import { Embedded, Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { EntityId } from '@shared/domain/types';
import { CustomParameterEntryEntity } from '../../common/entity';
import { ToolContextType } from '../../common/enum';
import { ExternalToolEntity } from '../../external-tool/entity';

export interface SchoolExternalToolEntityProps {
	id?: EntityId;

	tool: ExternalToolEntity;

	school: SchoolEntity;

	schoolParameters?: CustomParameterEntryEntity[];

	isDeactivated: boolean;

	availableContexts: ToolContextType[];
}

@Entity({ tableName: 'school-external-tools' })
export class SchoolExternalToolEntity extends BaseEntityWithTimestamps {
	@ManyToOne()
	tool: ExternalToolEntity;

	@ManyToOne(() => SchoolEntity, { eager: true })
	school: SchoolEntity;

	@Embedded(() => CustomParameterEntryEntity, { array: true })
	schoolParameters: CustomParameterEntryEntity[];

	@Property()
	isDeactivated: boolean;

	@Property()
	availableContexts: ToolContextType[];

	constructor(props: SchoolExternalToolEntityProps) {
		super();
		if (props.id) {
			this.id = props.id;
		}
		this.tool = props.tool;
		this.school = props.school;
		this.schoolParameters = props.schoolParameters ?? [];
		this.isDeactivated = props.isDeactivated;
		this.availableContexts = props.availableContexts;
	}
}
