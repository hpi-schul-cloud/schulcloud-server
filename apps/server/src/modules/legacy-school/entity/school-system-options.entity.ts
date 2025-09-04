import { Embedded, Entity, ManyToOne, ref, Ref, Unique } from '@mikro-orm/core';
import { SchoolEntity } from '@modules/school/repo';
import { SystemEntity } from '@modules/system/repo';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
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
	school: Ref<SchoolEntity>;

	@ManyToOne(() => SystemEntity)
	system: Ref<SystemEntity>;

	@Embedded(() => ProvisioningOptionsEntity, { object: true })
	provisioningOptions: ProvisioningOptionsEntity;

	constructor(props: SchoolSystemOptionsEntityProps) {
		super();
		if (props.id) {
			this.id = props.id;
		}
		this.school = ref(props.school);
		this.system = ref(props.system);
		this.provisioningOptions = new ProvisioningOptionsEntity(props.provisioningOptions);
	}
}
