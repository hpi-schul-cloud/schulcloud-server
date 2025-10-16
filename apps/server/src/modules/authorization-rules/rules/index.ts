/**
 * Rules are currently placed in authorization module to avoid dependency cycles.
 * In future they must be moved to the feature modules and register it in registration service.
 */
export * from './course-group.rule';
export * from './course.rule';
export * from './group.rule';
export { InstanceRule } from './instance.rule';
export * from './legacy-school.rule';
export * from './lesson.rule';
export { SchoolSystemOptionsRule } from './school-system-options.rule';
export * from './school.rule';
export * from './submission.rule';
export { SystemRule } from './system.rule';
export * from './task.rule';
export * from './team.rule';
export * from './user-login-migration.rule';
export * from './user.rule';
