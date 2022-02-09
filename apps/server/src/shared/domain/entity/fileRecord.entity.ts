import { Entity, ManyToOne, Enum, Property, Index } from '@mikro-orm/core';
// import uuid from 'uuid';

import { BaseEntityWithTimestamps } from './base.entity';
import type { User } from './user.entity';
import type { School } from './school.entity';
import type { Course } from './course.entity';
import type { Team } from './team.entity';
import type { DashboardModelEntity } from './dashboard.model.entity';
import type { Task } from './task.entity';

export enum SecurityCheckStatusTypes {
	PENDING = 'pending',
	VERIFIED = 'verified',
	BLOCKED = 'blocked',
	WONTCHECK = 'wont-check',
}

export interface ISecurityCheck {
	status: SecurityCheckStatusTypes;
	reason: string; // default 'not yet scanned'
	requestToken: string; // default: uuidv4
	createdAt: Date;
	updatedAt: Date;
}

export enum FileRecordTargetEntity {
	'User' = 'users',
	'School' = 'schools',
	'Course' = 'courses',
	'Team' = 'teams',
	'DashboardModelEntity' = 'dashboard', // without s
	'Task' = 'tasks',
	// card
}

export type FileRecordTarget = School | User | Course | Task | DashboardModelEntity | Team;

export interface IFileRecordProperties {
	size: number;
	name: string;
	type: string;
	securityCheck?: ISecurityCheck;
	targetEntity: FileRecordTargetEntity;
	target: FileRecordTarget;
	creator: User;
	lockedForUser?: User;
	school: School;
}

@Entity({
	tableName: 'filerecord',
	discriminatorColumn: 'targetEntity',
	abstract: true,
})
@Index({ name: 'FileRecordTargetRelationship', properties: ['target', 'targetEntity'] })
export abstract class FileRecord extends BaseEntityWithTimestamps {
	@Property()
	size: number;

	@Index()
	@Property()
	name: string;

	@Property()
	type: string; // make enum sense on this place?

	@Property()
	securityCheck: ISecurityCheck | null;

	@Index()
	@Enum()
	targetEntity!: FileRecordTargetEntity;

	@Index()
	@Property()
	target!: FileRecordTarget;

	@Index()
	@ManyToOne('User')
	creator: User;

	// todo: permissions

	// for wopi, is this still needed?
	@Property()
	lockedForUser: User | null;

	@Property()
	school: School;

	constructor(props: IFileRecordProperties) {
		super();
		this.size = props.size;
		this.name = props.name;
		this.type = props.type;
		this.securityCheck = props.securityCheck || null;
		this.targetEntity = props.targetEntity;
		this.target = props.target;
		this.creator = props.creator;
		this.lockedForUser = props.lockedForUser || null;
		this.school = props.school;
	}

	static createInstance(targetEntity: FileRecordTargetEntity, props: IFileRecordProperties): FileRecord {
		let fileRecord: FileRecord;
		if (targetEntity === FileRecordTargetEntity.User) {
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			fileRecord = new UserFileRecord(props);
		} else if (targetEntity === FileRecordTargetEntity.Course) {
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			fileRecord = new CourseFileRecord(props);
		} else if (targetEntity === FileRecordTargetEntity.Team) {
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			fileRecord = new TeamFileRecord(props);
		} else if (targetEntity === FileRecordTargetEntity.Task) {
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			fileRecord = new TaskFileRecord(props);
		} else if (targetEntity === FileRecordTargetEntity.DashboardModelEntity) {
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			fileRecord = new DashboardModelFileRecord(props);
		} else {
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			fileRecord = new SchoolFileRecord(props);
		}

		return fileRecord;
	}

	initilizeSecurityCheck(requestToken?: string): ISecurityCheck {
		const check: ISecurityCheck = {
			createdAt: new Date(),
			updatedAt: new Date(),
			reason: 'not yet scanned',
			requestToken: requestToken || 'uuidv4', // todo import right package
			status: SecurityCheckStatusTypes.PENDING,
		};

		this.securityCheck = check;

		return check;
	}

	updateSecurityCheckStatus(status: SecurityCheckStatusTypes, reason: string): void {
		if (!this.securityCheck) {
			this.initilizeSecurityCheck();
		}
		if (this.securityCheck) {
			this.securityCheck.status = status;
			this.securityCheck.reason = reason;
		}
	}
}

@Entity({ discriminatorValue: FileRecordTargetEntity.School })
export class SchoolFileRecord extends FileRecord {
	@ManyToOne('School')
	target!: School;
}

@Entity({ discriminatorValue: FileRecordTargetEntity.Course })
export class CourseFileRecord extends FileRecord {
	@ManyToOne('Course')
	target!: Course;
}

@Entity({ discriminatorValue: FileRecordTargetEntity.Team })
export class TeamFileRecord extends FileRecord {
	@ManyToOne('Team')
	target!: Team;
}

@Entity({ discriminatorValue: FileRecordTargetEntity.DashboardModelEntity })
export class DashboardModelFileRecord extends FileRecord {
	@ManyToOne('DashboardModelEntity')
	target!: DashboardModelEntity;
}

@Entity({ discriminatorValue: FileRecordTargetEntity.Task })
export class TaskFileRecord extends FileRecord {
	@ManyToOne('Task')
	target!: Task;
}

@Entity({ discriminatorValue: FileRecordTargetEntity.User })
export class UserFileRecord extends FileRecord {
	@ManyToOne('User')
	target!: User;
}
