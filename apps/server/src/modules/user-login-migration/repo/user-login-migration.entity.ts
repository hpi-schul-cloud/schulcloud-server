import { Entity, ManyToOne, OneToOne, Property } from '@mikro-orm/core';
import { SchoolEntity } from '@modules/school/repo';
import { SystemEntity } from '@modules/system/repo';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';

export type UserLoginMigrationEntityProps = {
	school: SchoolEntity;

	sourceSystem?: SystemEntity;

	targetSystem: SystemEntity;

	mandatorySince?: Date;

	startedAt: Date;

	closedAt?: Date;

	finishedAt?: Date;
};

@Entity({ tableName: 'user-login-migrations' })
export class UserLoginMigrationEntity extends BaseEntityWithTimestamps {
	@OneToOne(() => SchoolEntity, (school) => school.userLoginMigration, { nullable: false, owner: true })
	school: SchoolEntity;

	// undefined, if migrating from 'local'
	@ManyToOne(() => SystemEntity, { nullable: true })
	sourceSystem?: SystemEntity;

	@ManyToOne(() => SystemEntity)
	targetSystem!: SystemEntity;

	@Property({ nullable: true })
	mandatorySince?: Date;

	@Property()
	startedAt: Date;

	@Property({ nullable: true })
	closedAt?: Date;

	@Property({ nullable: true })
	finishedAt?: Date;

	constructor(props: UserLoginMigrationEntityProps) {
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
