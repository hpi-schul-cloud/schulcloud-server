import { Entity, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { Registration, RegistrationProps } from '../../domain/do/registration.do';

@Entity({ tableName: 'registrations' })
export class RegistrationEntity extends BaseEntityWithTimestamps implements RegistrationProps {
	@Property({ unique: true, nullable: false })
	email!: string;

	@Property({ nullable: false })
	firstName!: string;

	@Property({ nullable: false })
	lastName!: string;

	@Index()
	@Property({ type: 'ObjectId', fieldName: 'roomIds', nullable: false })
	roomIds!: EntityId[];

	@Index()
	@Property({ nullable: false })
	registrationSecret!: string;

	@Property({ persist: false })
	domainObject: Registration | undefined;
}
