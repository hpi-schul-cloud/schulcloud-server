import { EntityId } from '@shared/domain/types/entity-id';
import { Scope } from '@shared/repo/scope';
import { SystemType } from '../../../domain';
import { SystemEntity } from '../../../entity';

export class SystemScope extends Scope<SystemEntity> {
	byIds(ids?: EntityId[]): this {
		if (ids) {
			this.addQuery({ id: { $in: ids } });
		}

		return this;
	}

	byTypes(types?: SystemType[]): this {
		if (types) {
			this.addQuery({ type: { $in: types } });
		}

		return this;
	}
}
