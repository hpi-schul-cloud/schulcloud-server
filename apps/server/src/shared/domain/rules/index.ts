import { CourseRule } from './course.rule';
import { SchoolRule } from './school.rule';
import { TaskRule } from './task.rule';
import { UserRule } from './user.rule';

export * from './actions.enum';
export * from './base.rule';
export * from './course.rule';
export * from './school.rule';
export * from './task.rule';
export * from './user.rule';

export const ALL_RULES = [TaskRule, CourseRule, SchoolRule, UserRule];
