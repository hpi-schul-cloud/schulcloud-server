import { EntityManager } from '@mikro-orm/mongodb';
import { SchoolEntity } from '@modules/school/repo';
import { SystemEntity } from '@modules/system/repo';
import { AnyProvisioningOptions, SchoolSystemOptions, SchoolSystemOptionsProps } from '../domain';
import { SchoolSystemOptionsEntity, SchoolSystemOptionsEntityProps } from '../entity';

export class SchoolSystemOptionsRepoMapper {
	static mapDomainObjectToEntityProperties(
		schoolSystemOptions: SchoolSystemOptions,
		em: EntityManager
	): SchoolSystemOptionsEntityProps {
		const props: SchoolSystemOptionsProps<AnyProvisioningOptions> = schoolSystemOptions.getProps();

		const mapped: SchoolSystemOptionsEntityProps = {
			id: props.id,
			school: em.getReference(SchoolEntity, props.schoolId),
			system: em.getReference(SystemEntity, props.systemId),
			provisioningOptions: { ...props.provisioningOptions },
		};

		return mapped;
	}

	static mapEntityToDomainObjectProperties(
		entity: SchoolSystemOptionsEntity,
		provisioningOptions: AnyProvisioningOptions
	): SchoolSystemOptionsProps<AnyProvisioningOptions> {
		const mapped: SchoolSystemOptionsProps<AnyProvisioningOptions> = {
			id: entity.id,
			schoolId: entity.school.id,
			systemId: entity.system.id,
			provisioningOptions,
		};

		return mapped;
	}
}
