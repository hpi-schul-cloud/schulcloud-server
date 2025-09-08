import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { MongoPatterns } from '@shared/repo/mongo.patterns';
import { Scope } from '@shared/repo/scope';
import { GroupEntity, GroupEntityTypes } from '../entity';

export class GroupScope extends Scope<GroupEntity> {
	public byTypes(types: GroupEntityTypes[] | undefined): this {
		if (types) {
			this.addQuery({ type: { $in: types } });
		}
		return this;
	}

	public byOrganizationId(id: EntityId | undefined): this {
		if (id) {
			this.addQuery({ organization: id });
		}
		return this;
	}

	public bySystemId(id: EntityId | undefined): this {
		if (id) {
			this.addQuery({ externalSource: { system: new ObjectId(id) } });
		}
		return this;
	}

	public byUserId(id: EntityId | undefined): this {
		if (id) {
			this.addQuery({ users: { user: new ObjectId(id) } });
		}
		return this;
	}

	public byUserIds(ids: EntityId[] | undefined): this {
		if (ids) {
			this.addQuery({ users: { user: { $in: ids.map((id) => new ObjectId(id)) } } });
		}
		return this;
	}

	public byNameQuery(nameQuery: string | undefined): this {
		if (nameQuery) {
			const escapedName = nameQuery.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();
			this.addQuery({ name: new RegExp(escapedName, 'i') });
		}
		return this;
	}
}
