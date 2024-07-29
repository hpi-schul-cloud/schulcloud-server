import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { MongoPatterns } from '@shared/repo';
import { Scope } from '@shared/repo/scope';
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
			this.addQuery({ externalSource: { system: new ObjectId(id) } });
		}
		return this;
	}

	byUserId(id: EntityId | undefined): this {
		if (id) {
			this.addQuery({ users: { user: new ObjectId(id) } });
		}
		return this;
	}

	byNameQuery(nameQuery: string | undefined): this {
		if (nameQuery) {
			const escapedName = nameQuery.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();
			this.addQuery({ name: new RegExp(escapedName, 'i') });
		}
		return this;
	}
}
