import { Entity, ManyToOne, OneToOne, Property } from '@mikro-orm/core';
import { SystemEntity } from '@modules/system/entity/system.entity';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { BaseEntityWithTimestamps } from './base.entity';

export type IUserLoginMigration = Readonly<Omit<UserLoginMigrationEntity, keyof BaseEntityWithTimestamps>>;

@Entity({ tableName: 'user-login-migrations' })
export class UserLoginMigrationEntity extends BaseEntityWithTimestamps {
	@OneToOne(() => SchoolEntity, (school) => school.userLoginMigration, { nullable: false, owner: true })
	school: SchoolEntity;

	// undefined, if migrating from 'local'
	@ManyToOne(() => SystemEntity, { nullable: true })
	sourceSystem?: SystemEntity;

	@ManyToOne(() => SystemEntity)
	targetSystem: SystemEntity;

	@Property({ nullable: true })
	mandatorySince?: Date;

	@Property()
	startedAt: Date;

	@Property({ nullable: true })
	closedAt?: Date;

	@Property({ nullable: true })
	finishedAt?: Date;

	constructor(props: IUserLoginMigration) {
		super();
		this.school = props.school;
		this.sourceSystem = props.sourceSystem;
		this.targetSystem = props.targetSystem;
		this.mandatorySince = props.mandatorySince;
		this.startedAt = props.startedAt;
		this.closedAt = props.closedAt;
		this.finishedAt = props.finishedAt;
	}
}
