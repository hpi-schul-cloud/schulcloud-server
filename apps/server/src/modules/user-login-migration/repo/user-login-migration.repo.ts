import { LegacyLogger } from '@core/logger';
import { EntityData, EntityName } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { SchoolEntity } from '@modules/school/repo';
import { SystemEntity } from '@modules/system/repo';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BaseDORepo } from '@shared/repo/base.do.repo';
import { UserLoginMigrationDO } from '../domain';
import { UserLoginMigrationEntity } from './user-login-migration.entity';

@Injectable()
export class UserLoginMigrationRepo extends BaseDORepo<UserLoginMigrationDO, UserLoginMigrationEntity> {
	constructor(protected readonly _em: EntityManager, protected readonly logger: LegacyLogger) {
		super(_em, logger);
	}

	get entityName(): EntityName<UserLoginMigrationEntity> {
		return UserLoginMigrationEntity;
	}

	public async findBySchoolId(schoolId: EntityId): Promise<UserLoginMigrationDO | null> {
		const userLoginMigration: UserLoginMigrationEntity | null = await this._em.findOne(UserLoginMigrationEntity, {
			school: schoolId,
		});

		if (userLoginMigration) {
			const userLoginMigrationDO = this.mapEntityToDO(userLoginMigration);
			return userLoginMigrationDO;
		}

		return null;
	}

	public mapEntityToDO(entity: UserLoginMigrationEntity): UserLoginMigrationDO {
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

	public mapDOToEntityProperties(entityDO: UserLoginMigrationDO): EntityData<UserLoginMigrationEntity> {
		const userLoginMigrationProps: EntityData<UserLoginMigrationEntity> = {
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
