import { Embedded, Entity, ManyToOne, Unique } from '@mikro-orm/core';
import { SystemEntity } from '@modules/system/entity';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { EntityId } from '@shared/domain/types';
import { ProvisioningOptionsInterface } from '../interface';
import { ProvisioningOptionsEntity } from './provisioning-options.entity';

export interface SchoolSystemOptionsEntityProps {
	id?: EntityId;

	school: SchoolEntity;

	system: SystemEntity;

	provisioningOptions: ProvisioningOptionsInterface;
}

@Entity({ tableName: 'school-system-options' })
@Unique({ properties: ['school', 'system'] })
export class SchoolSystemOptionsEntity extends BaseEntityWithTimestamps {
	@ManyToOne(() => SchoolEntity)
	school: SchoolEntity;

	@ManyToOne(() => SystemEntity)
	system: SystemEntity;

	@Embedded(() => ProvisioningOptionsEntity, { object: true })
	provisioningOptions: ProvisioningOptionsEntity;

	constructor(props: SchoolSystemOptionsEntityProps) {
		super();
		if (props.id) {
			this.id = props.id;
		}
		this.school = props.school;
		this.system = props.system;
		this.provisioningOptions = new ProvisioningOptionsEntity(props.provisioningOptions);
	}
}
