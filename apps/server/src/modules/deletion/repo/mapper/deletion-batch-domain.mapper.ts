import { DeletionBatch } from '../../domain/do';
import { DeletionBatchEntity } from '../entity';

export class DeletionBatchDomainMapper {
	public static mapEntityToDo(entity: DeletionBatchEntity): DeletionBatch {
		// check identity map reference
		if (entity.domainObject) {
			return entity.domainObject;
		}

		const domainObject = new DeletionBatch(entity);

		// attach to identity map
		entity.domainObject = domainObject;

		return domainObject;
	}

	public static mapDoToEntity(domainObject: DeletionBatch): DeletionBatchEntity {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { props } = domainObject;

		if (!(props instanceof DeletionBatchEntity)) {
			const entity = new DeletionBatchEntity();
			Object.assign(entity, props);

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			domainObject.props = entity;

			return entity;
		}

		return props;
	}
}
