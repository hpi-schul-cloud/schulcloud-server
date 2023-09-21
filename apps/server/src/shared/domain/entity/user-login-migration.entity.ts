import { Entity, ManyToOne, OneToOne, Property } from '@mikro-orm/core';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { SystemEntity } from '@shared/domain/entity/system.entity';
import { BaseEntityWithTimestamps } from './base.entity';

export type IUserLoginMigration = Readonly<Omit<UserLoginMigration, keyof BaseEntityWithTimestamps>>;

@Entity({ tableName: 'user_login_migrations' })
export class UserLoginMigration extends BaseEntityWithTimestamps {
	@OneToOne(() => SchoolEntity, undefined, { nullable: false })
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
