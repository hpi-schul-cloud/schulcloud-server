import { EntityName } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, SchoolEntity, SystemEntity, UserLoginMigrationDO } from '@shared/domain';
import { IUserLoginMigration, UserLoginMigrationEntity } from '@shared/domain/entity/user-login-migration.entity';
import { LegacyLogger } from '@src/core/logger';
import { BaseDORepo } from '../base.do.repo';

@Injectable()
export class UserLoginMigrationRepo extends BaseDORepo<
	UserLoginMigrationDO,
	UserLoginMigrationEntity,
	IUserLoginMigration
> {
	constructor(protected readonly _em: EntityManager, protected readonly logger: LegacyLogger) {
		super(_em, logger);
	}

	get entityName(): EntityName<UserLoginMigrationEntity> {
		return UserLoginMigrationEntity;
	}

	entityFactory(props: IUserLoginMigration): UserLoginMigrationEntity {
		return new UserLoginMigrationEntity(props);
	}

	async findBySchoolId(schoolId: EntityId): Promise<UserLoginMigrationDO | null> {
		const userLoginMigration: UserLoginMigrationEntity | null = await this._em.findOne(UserLoginMigrationEntity, {
			school: schoolId,
		});

		if (userLoginMigration) {
			const userLoginMigrationDO = this.mapEntityToDO(userLoginMigration);
			return userLoginMigrationDO;
		}

		return null;
	}

	mapEntityToDO(entity: UserLoginMigrationEntity): UserLoginMigrationDO {
		const userLoginMigrationDO: UserLoginMigrationDO = new UserLoginMigrationDO({
			id: entity.id,
			schoolId: entity.school.id,
			sourceSystemId: entity.sourceSystem?.id,
			targetSystemId: entity.targetSystem.id,
			mandatorySince: entity.mandatorySince,
			startedAt: entity.startedAt,
			closedAt: entity.closedAt,
			finishedAt: entity.finishedAt,
		});

		return userLoginMigrationDO;
	}

	mapDOToEntityProperties(entityDO: UserLoginMigrationDO): IUserLoginMigration {
		const userLoginMigrationProps: IUserLoginMigration = {
			school: this._em.getReference(SchoolEntity, entityDO.schoolId),
			sourceSystem: entityDO.sourceSystemId ? this._em.getReference(SystemEntity, entityDO.sourceSystemId) : undefined,
			targetSystem: this._em.getReference(SystemEntity, entityDO.targetSystemId),
			mandatorySince: entityDO.mandatorySince,
			startedAt: entityDO.startedAt,
			closedAt: entityDO.closedAt,
			finishedAt: entityDO.finishedAt,
		};

		return userLoginMigrationProps;
	}
}
