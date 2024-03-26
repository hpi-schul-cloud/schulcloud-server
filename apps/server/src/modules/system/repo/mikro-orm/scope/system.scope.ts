import { SystemEntity } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types/entity-id';
import { Scope } from '@shared/repo/scope';

export class SystemScope extends Scope<SystemEntity> {
	byIds(ids?: EntityId[]) {
		if (ids) {
			this.addQuery({ id: { $in: ids } });
		}
	}
}
