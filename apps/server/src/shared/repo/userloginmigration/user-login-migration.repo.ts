import { EntityName } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, School, System, UserLoginMigrationDO } from '@shared/domain';
import { IUserLoginMigration, UserLoginMigration } from '@shared/domain/entity/user-login-migration.entity';
import { LegacyLogger } from '@src/core/logger';
import { BaseDORepo } from '../base.do.repo';

@Injectable()
export class UserLoginMigrationRepo extends BaseDORepo<UserLoginMigrationDO, UserLoginMigration, IUserLoginMigration> {
	constructor(protected readonly _em: EntityManager, protected readonly logger: LegacyLogger) {
		super(_em, logger);
	}

	get entityName(): EntityName<UserLoginMigration> {
		return UserLoginMigration;
	}

	entityFactory(props: IUserLoginMigration): UserLoginMigration {
		return new UserLoginMigration(props);
	}

	async findBySchoolId(schoolId: EntityId): Promise<UserLoginMigrationDO | null> {
		const userLoginMigration: UserLoginMigration | null = await this._em.findOne(UserLoginMigration, {
			school: schoolId,
		});

		if (userLoginMigration) {
			const userLoginMigrationDO: UserLoginMigrationDO = this.mapEntityToDO(userLoginMigration);
			return userLoginMigrationDO;
		}

		return null;
	}

	async findBySourceSystemId(sourceSystemId: EntityId): Promise<UserLoginMigrationDO | null> {
		const userLoginMigration: UserLoginMigration | null = await this._em.findOne(UserLoginMigration, {
			sourceSystem: sourceSystemId,
		});

		if (userLoginMigration) {
			const userLoginMigrationDO: UserLoginMigrationDO = this.mapEntityToDO(userLoginMigration);
			return userLoginMigrationDO;
		}

		return null;
	}

	mapEntityToDO(entity: UserLoginMigration): UserLoginMigrationDO {
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
			school: this._em.getReference(School, entityDO.schoolId),
			sourceSystem: entityDO.sourceSystemId ? this._em.getReference(System, entityDO.sourceSystemId) : undefined,
			targetSystem: this._em.getReference(System, entityDO.targetSystemId),
			mandatorySince: entityDO.mandatorySince,
			startedAt: entityDO.startedAt,
			closedAt: entityDO.closedAt,
			finishedAt: entityDO.finishedAt,
		};

		return userLoginMigrationProps;
	}
}
