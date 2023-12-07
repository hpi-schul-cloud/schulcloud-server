import { Embedded, Entity, ManyToOne } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, SchoolEntity, SystemEntity } from '@shared/domain/entity';
import { ProvisioningOptionsInterface } from '../interface';
import { ProvisioningOptionsEntity } from './provisioning-options.entity';

export interface SchoolSystemOptionsEntityProps {
	school: SchoolEntity;

	system: SystemEntity;

	provisioningOptions: ProvisioningOptionsInterface;
}

@Entity({ tableName: 'school-system-options' })
export class SchoolSystemOptionsEntity extends BaseEntityWithTimestamps {
	@ManyToOne(() => SchoolEntity)
	school: SchoolEntity;

	@ManyToOne(() => SystemEntity)
	system: SystemEntity;

	@Embedded(() => ProvisioningOptionsEntity)
	provisioningOptions: ProvisioningOptionsEntity;

	constructor(props: SchoolSystemOptionsEntityProps) {
		super();
		this.school = props.school;
		this.system = props.system;
		this.provisioningOptions = new ProvisioningOptionsEntity(props.provisioningOptions);
	}
}
