import { Platform, Type } from '@mikro-orm/core';
import { EntityId } from '@shared/domain/types';
import { MongoPlatform, ObjectId } from '@mikro-orm/mongodb';

export class ObjectIdType extends Type<EntityId, ObjectId> {
	convertToDatabaseValue(value: EntityId, platform: Platform): ObjectId {
		this.validatePlatformSupport(platform);
		return new ObjectId(value);
	}

	convertToJSValue(value: ObjectId, platform: Platform): EntityId {
		this.validatePlatformSupport(platform);
		return value.toHexString();
	}

	private validatePlatformSupport(platform: Platform): void {
		if (!(platform instanceof MongoPlatform)) {
			throw new Error('ObjectId custom type implemented only for Mongo.');
		}
	}
}
