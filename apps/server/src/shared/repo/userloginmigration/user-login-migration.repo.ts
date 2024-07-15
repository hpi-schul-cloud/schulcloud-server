import { EntityData, EntityName } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { SystemEntity } from '@modules/system/entity';
import { Injectable } from '@nestjs/common';
import { UserLoginMigrationDO } from '@shared/domain/domainobject';
import { SchoolEntity } from '@shared/domain/entity';
import { UserLoginMigrationEntity } from '@shared/domain/entity/user-login-migration.entity';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { BaseDORepo } from '../base.do.repo';

@Injectable()
export class UserLoginMigrationRepo extends BaseDORepo<UserLoginMigrationDO, UserLoginMigrationEntity> {
	constructor(protected readonly _em: EntityManager, protected readonly logger: LegacyLogger) {
		super(_em, logger);
	}

	get entityName(): EntityName<UserLoginMigrationEntity> {
		return UserLoginMigrationEntity;
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

	mapDOToEntityProperties(entityDO: UserLoginMigrationDO): EntityData<UserLoginMigrationEntity> {
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
