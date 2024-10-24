import { EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo/scope';
import { RoomEntity } from './entity';

export class RoomScope extends Scope<RoomEntity> {
	byIds(ids?: EntityId[]): this {
		if (ids) {
			this.addQuery({ id: { $in: ids } });
		}

		return this;
	}
}
