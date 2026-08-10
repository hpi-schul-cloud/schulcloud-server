import { type AnyEntity, type EntityClass, MikroORM } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import { AccountEntity } from '@modules/account/repo';
import { CourseEntity } from '@modules/course/repo/course.entity';
import { CourseGroupEntity } from '@modules/course/repo/coursegroup.entity';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { SchoolEntity, SchoolRolePermission, SchoolRoles, SchoolYearEntity, StorageProviderEntity } from '@modules/school/repo';
import { SystemEntity } from '@modules/system/repo';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';
import { User } from '@modules/user/repo';

const CORE_TEST_ENTITIES = [
	User,
	AccountEntity,
	SchoolEntity,
	SchoolRolePermission,
	SchoolRoles,
	SchoolSystemOptionsEntity,
	SchoolYearEntity,
	StorageProviderEntity,
	CourseEntity,
	CourseGroupEntity,
	SystemEntity,
	UserLoginMigrationEntity,
];

const dedupeByEntityName = (entities: EntityClass<AnyEntity>[]): EntityClass<AnyEntity>[] => {
	const uniqueByName = new Map<string, EntityClass<AnyEntity>>();

	for (const entity of entities) {
		uniqueByName.set(entity.name, entity);
	}

	return [...uniqueByName.values()];
};

/**
 * Test-Setup to make all entities available without a database connection.
 * @returns
 */
export const setupEntities = async (entities: EntityClass<AnyEntity>[]): Promise<MikroORM> => {
	const orm = await MikroORM.init({
		driver: MongoDriver,
		dbName: 'dummy',
		entities: dedupeByEntityName([...entities, ...CORE_TEST_ENTITIES]),
		allowGlobalContext: true,
		connect: false,
	});
	return orm;
};
