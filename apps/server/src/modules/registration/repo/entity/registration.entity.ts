import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { Registration, RegistrationProps } from '../../domain/do/registration.do';
import { LanguageType } from '@shared/domain/interface';
import { Consent } from '../../domain/type';

@Entity({ tableName: 'registrations' })
export class RegistrationEntity extends BaseEntityWithTimestamps implements RegistrationProps {
	@Unique()
	@Index()
	@Property({ nullable: false })
	email!: string;

	@Property({ nullable: false })
	firstName!: string;

	@Property({ nullable: false })
	lastName!: string;

	@Property({ nullable: false })
	password!: string;

	@Property({ nullable: false })
	consent!: Consent[];

	@Property({ nullable: false })
	language!: LanguageType;

	@Index()
	@Property({ type: 'ObjectId', fieldName: 'roomIds', nullable: false })
	roomIds!: EntityId[];

	@Index()
	@Property({ nullable: false })
	registrationHash!: string;

	@Property({ persist: false })
	domainObject: Registration | undefined;
}
