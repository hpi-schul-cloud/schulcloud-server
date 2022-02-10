import {
	CourseFileRecord,
	FileRecordTargetType,
	FileSecurityCheck,
	IFileRecordProperties,
	SchoolFileRecord,
	TaskFileRecord,
	TeamFileRecord,
	UserFileRecord,
} from '@shared/domain';

import { BaseFactory } from './base.factory';
import { courseFactory } from './course.factory';
import { schoolFactory } from './school.factory';
import { taskFactory } from './task.factory';
import { teamFactory } from './team.factory';
import { userFactory } from './user.factory';

const buildDefaultProperties = () => {
	return {
		size: Math.round(Math.random() * 100000),
		type: 'application/octet-stream',
		securityCheck: new FileSecurityCheck({}),
		creator: userFactory.build(),
		school: schoolFactory.build(),
	};
};

export const schoolFileRecordFactory = BaseFactory.define<SchoolFileRecord, IFileRecordProperties>(
	SchoolFileRecord,
	({ sequence }) => {
		return {
			...buildDefaultProperties(),
			name: `file-record #${sequence}`,
			targetType: FileRecordTargetType.School,
			target: schoolFactory.build(),
		};
	}
);

export const courseFileRecordFactory = BaseFactory.define<CourseFileRecord, IFileRecordProperties>(
	CourseFileRecord,
	({ sequence }) => {
		return {
			...buildDefaultProperties(),
			name: `file-record #${sequence}`,
			targetType: FileRecordTargetType.Course,
			target: courseFactory.build(),
		};
	}
);

export const teamFileRecordFactory = BaseFactory.define<TeamFileRecord, IFileRecordProperties>(
	TeamFileRecord,
	({ sequence }) => {
		return {
			...buildDefaultProperties(),
			name: `file-record #${sequence}`,
			targetType: FileRecordTargetType.Team,
			target: teamFactory.build(),
		};
	}
);

// TODO Dashboard?

export const taskFileRecordFactory = BaseFactory.define<TaskFileRecord, IFileRecordProperties>(
	TaskFileRecord,
	({ sequence }) => {
		return {
			...buildDefaultProperties(),
			name: `file-record #${sequence}`,
			targetType: FileRecordTargetType.Task,
			target: taskFactory.build(),
		};
	}
);

export const userFileRecordFactory = BaseFactory.define<UserFileRecord, IFileRecordProperties>(
	UserFileRecord,
	({ sequence }) => {
		return {
			...buildDefaultProperties(),
			name: `file-record #${sequence}`,
			targetType: FileRecordTargetType.User,
			target: userFactory.build(),
		};
	}
);
