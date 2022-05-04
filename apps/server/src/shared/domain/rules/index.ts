import { CourseRule } from './course.rule';
import { TaskRule } from './task.rule';

export * from './actions.enum';
export * from './permission.enum';
export * from './rolenames.enum';
export * from './base.rule';
export * from './course.rule';
export * from './task.rule';

export const ALL_RULES = [TaskRule, CourseRule];
