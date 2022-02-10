import {
	Entity,
	ManyToOne,
	Enum,
	Property,
	Index,
	IdentifiedReference,
	Reference,
	Embeddable,
	Embedded,
} from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { BaseEntityWithTimestamps } from './base.entity';
import type { User } from './user.entity';
import type { School } from './school.entity';
import type { Course } from './course.entity';
import type { Team } from './team.entity';
import type { DashboardModelEntity } from './dashboard.model.entity';
import type { Task } from './task.entity';

export enum FileSecurityCheckStatus {
	PENDING = 'pending',
	VERIFIED = 'verified',
	BLOCKED = 'blocked',
	WONTCHECK = 'wont-check',
}

export enum FileRecordTargetType {
	'User' = 'users',
	'School' = 'schools',
	'Course' = 'courses',
	'Team' = 'teams',
	'DashboardModel' = 'dashboard', // without s
	'Task' = 'tasks',
	// card
}

export type FileRecordTarget = School | User | Course | Task | DashboardModelEntity | Team;

export interface IFileSecurityCheckProperties {
	status?: FileSecurityCheckStatus;
	reason?: string;
	requestToken?: string;
}
@Embeddable()
export class FileSecurityCheck {
	@Enum()
	status: FileSecurityCheckStatus = FileSecurityCheckStatus.PENDING;

	@Property()
	reason = 'not yet scanned';

	@Property()
	requestToken: string = uuid();

	@Property()
	createdAt = new Date();

	@Property({ onUpdate: () => new Date() })
	updatedAt = new Date();

	constructor(props: IFileSecurityCheckProperties) {
		if (props.status !== undefined) {
			this.status = props.status;
		}
		if (props.reason !== undefined) {
			this.reason = props.reason;
		}
		if (props.requestToken !== undefined) {
			this.requestToken = props.requestToken;
		}
	}
}

export interface IFileRecordProperties {
	size: number;
	name: string;
	type: string; // TODO mime-type enum?
	securityCheck?: FileSecurityCheck;
	targetType: FileRecordTargetType;
	target: FileRecordTarget;
	creator: User;
	lockedForUser?: User;
	school: School;
}

@Entity({
	tableName: 'filerecord',
	discriminatorColumn: 'targetType',
	abstract: true,
})
@Index({ name: 'FileRecordTargetRelationship', properties: ['target', 'targetType'] })
export abstract class FileRecord extends BaseEntityWithTimestamps {
	@Property()
	size: number;

	@Index()
	@Property()
	name: string;

	@Property()
	type: string; // TODO mime-type enum?

	@Embedded(() => FileSecurityCheck, { object: true, nullable: true })
	securityCheck?: FileSecurityCheck;

	@Enum()
	targetType: FileRecordTargetType;

	target!: FileRecordTarget;

	@Index()
	@ManyToOne('User')
	creator: IdentifiedReference<User>;

	// todo: permissions

	// for wopi, is this still needed?
	@ManyToOne('User')
	lockedForUser?: IdentifiedReference<User>;

	@ManyToOne('School')
	school: IdentifiedReference<School>;

	constructor(props: IFileRecordProperties) {
		super();
		this.size = props.size;
		this.name = props.name;
		this.type = props.type;
		this.securityCheck = props.securityCheck;
		this.targetType = props.targetType;
		this.target = props.target;
		this.creator = Reference.create(props.creator);
		if (props.lockedForUser !== undefined) {
			this.lockedForUser = Reference.create(props.lockedForUser);
		}
		this.school = Reference.create(props.school);
	}

	// static createInstance(targetType: FileRecordTargetType, props: IFileRecordProperties): FileRecord {
	// 	let fileRecord: FileRecord;
	// 	if (targetType === FileRecordTargetType.User) {
	// 		// eslint-disable-next-line @typescript-eslint/no-use-before-define
	// 		fileRecord = new UserFileRecord(props);
	// 	} else if (targetType === FileRecordTargetType.Course) {
	// 		// eslint-disable-next-line @typescript-eslint/no-use-before-define
	// 		fileRecord = new CourseFileRecord(props);
	// 	} else if (targetType === FileRecordTargetType.Team) {
	// 		// eslint-disable-next-line @typescript-eslint/no-use-before-define
	// 		fileRecord = new TeamFileRecord(props);
	// 	} else if (targetType === FileRecordTargetType.Task) {
	// 		// eslint-disable-next-line @typescript-eslint/no-use-before-define
	// 		fileRecord = new TaskFileRecord(props);
	// 	} else if (targetType === FileRecordTargetType.DashboardModelEntity) {
	// 		// eslint-disable-next-line @typescript-eslint/no-use-before-define
	// 		fileRecord = new DashboardModelFileRecord(props);
	// 	} else {
	// 		// eslint-disable-next-line @typescript-eslint/no-use-before-define
	// 		fileRecord = new SchoolFileRecord(props);
	// 	}

	// 	return fileRecord;
	// }

	updateSecurityCheckStatus(status: FileSecurityCheckStatus, reason: string): void {
		if (!this.securityCheck) {
			this.securityCheck = new FileSecurityCheck({ status, reason });
		} else {
			this.securityCheck.status = status;
			this.securityCheck.reason = reason;
		}
	}
}

@Entity({ tableName: 'filerecord', discriminatorValue: FileRecordTargetType.School })
export class SchoolFileRecord extends FileRecord {
	@ManyToOne('School', { wrappedReference: true })
	target!: IdentifiedReference<School>;
}

@Entity({ tableName: 'filerecord', discriminatorValue: FileRecordTargetType.Course })
export class CourseFileRecord extends FileRecord {
	@ManyToOne('Course', { wrappedReference: true })
	target!: IdentifiedReference<Course>;
}

@Entity({ tableName: 'filerecord', discriminatorValue: FileRecordTargetType.Team })
export class TeamFileRecord extends FileRecord {
	@ManyToOne('Team', { wrappedReference: true })
	target!: IdentifiedReference<Team>;
}

@Entity({ tableName: 'filerecord', discriminatorValue: FileRecordTargetType.DashboardModel })
export class DashboardModelFileRecord extends FileRecord {
	@ManyToOne('DashboardModelEntity', { wrappedReference: true })
	target!: IdentifiedReference<DashboardModelEntity>;
}

@Entity({ tableName: 'filerecord', discriminatorValue: FileRecordTargetType.Task })
export class TaskFileRecord extends FileRecord {
	@ManyToOne('Task', { wrappedReference: true })
	target!: IdentifiedReference<Task>;
}

@Entity({ tableName: 'filerecord', discriminatorValue: FileRecordTargetType.User })
export class UserFileRecord extends FileRecord {
	@ManyToOne('User', { wrappedReference: true })
	target!: IdentifiedReference<User>;
}
