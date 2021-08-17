// make it sense to move it to shared?
import { BaseEntity, EntityId } from '@shared/domain';

export class EntityCollection<T extends BaseEntity> extends Array<T> {
	constructor(entityCollection: T[]) {
		super(...entityCollection);
	}

	getById(id: EntityId): T {
		const element = this.find((e) => e.id === id);
		return element || ({} as T);
	}

	getIds(): EntityId[] {
		const ids = this.map((e) => e.id);
		return ids;
	}

	isEmpty(): boolean {
		return this.length === 0;
	}

	hasOneOrMoreEntitys(): boolean {
		return this.length > 0;
	}
}
