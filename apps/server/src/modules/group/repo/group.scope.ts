import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo';
import { GroupEntity, GroupEntityTypes } from '../entity';

export class GroupScope extends Scope<GroupEntity> {
	byTypes(types: GroupEntityTypes[] | undefined): this {
		if (types) {
			this.addQuery({ type: { $in: types } });
		}
		return this;
	}

	byOrganizationId(id: EntityId | undefined): this {
		if (id) {
			this.addQuery({ organization: id });
		}
		return this;
	}

	bySystemId(id: EntityId | undefined): this {
		if (id) {
			this.addQuery({ externalSource: { system: id } });
		}
		return this;
	}

	byUserId(id: EntityId | undefined): this {
		if (id) {
			this.addQuery({ users: { user: new ObjectId(id) } });
		}
		return this;
	}

	byNameQuery(nameQuery: string): this {
		if (nameQuery) {
			this.addQuery({ name: new RegExp(nameQuery, 'i') });
		}
		return this;
	}
}
