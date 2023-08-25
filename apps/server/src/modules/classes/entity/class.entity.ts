import { Embedded, Entity, Property, Unique } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain';
import { ClassSourceOptionsEntity } from './class-source-options.entity';

export interface IClassEntityProps {
	id?: EntityId;
	name: string;
	schoolId: ObjectId;
	userIds?: ObjectId[];
	teacherIds: ObjectId[];
	invitationLink?: string;
	year?: ObjectId;
	gradeLevel?: number;
	ldapDN?: string;
	successor?: ObjectId;
	source?: string;
	sourceOptions?: ClassSourceOptionsEntity;
}

@Entity({ tableName: 'classes' })
@Unique({ properties: ['name'] })
export class ClassEntity extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Property()
	schoolId: ObjectId;

	@Property({ nullable: true })
	userIds?: ObjectId[];

	@Property()
	teacherIds: ObjectId[];

	@Property({ nullable: true })
	invitationLink?: string;

	@Property({ nullable: true })
	year?: ObjectId;

	@Property({ nullable: true })
	gradeLevel?: number;

	@Property({ nullable: true })
	ldapDN?: string;

	@Property({ nullable: true })
	successor?: ObjectId;

	@Property({ nullable: true })
	source?: string;

	@Embedded(() => ClassSourceOptionsEntity, { object: true, nullable: true })
	sourceOptions?: ClassSourceOptionsEntity;

	private validate(props: IClassEntityProps) {
		if (props.gradeLevel !== undefined && (props.gradeLevel < 1 || props.gradeLevel > 13)) {
			throw new Error('gradeLevel must be value beetween 1 and 13');
		}
	}

	constructor(props: IClassEntityProps) {
		super();
		this.validate(props);

		this.name = props.name;
		this.schoolId = props.schoolId;

		if (props.userIds !== undefined) {
			this.userIds = props.userIds;
		}

		this.teacherIds = props.teacherIds;

		if (props.invitationLink !== undefined) {
			this.invitationLink = props.invitationLink;
		}

		if (props.year !== undefined) {
			this.year = props.year;
		}
		if (props.gradeLevel !== undefined) {
			this.gradeLevel = props.gradeLevel;
		}
		if (props.ldapDN !== undefined) {
			this.ldapDN = props.ldapDN;
		}

		if (props.successor !== undefined) {
			this.successor = props.successor;
		}

		if (props.source !== undefined) {
			this.source = props.source;
		}

		if (props.sourceOptions !== undefined) {
			this.sourceOptions = props.sourceOptions;
		}
	}
}
