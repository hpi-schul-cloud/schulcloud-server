import { CourseRule } from './course.rule';
import { FileRecordRule } from './file-record.rule';
import { SchoolRule } from './school.rule';
import { TaskRule } from './task.rule';

export * from './actions.enum';
export * from './base.rule';
export * from './course.rule';
export * from './file-record.rule';
export * from './permission.enum';
export * from './rolename.enum';
export * from './school.rule';
export * from './task.rule';

export const ALL_RULES = [TaskRule, CourseRule, FileRecordRule, SchoolRule];
