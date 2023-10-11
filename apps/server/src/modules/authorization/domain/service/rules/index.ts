/**
 * Rules are currently placed in authorisation module to avoid dependency cycles.
 * In future they must be moved to the feature modules and register it in registration service.
 */
export * from './board-do.rule';
export * from './context-external-tool.rule';
export * from './course-group.rule';
export * from './course.rule';
export * from './legacy-school.rule';
export * from './lesson.rule';
export * from './school-external-tool.rule';
export * from './submission.rule';
export * from './task.rule';
export * from './team.rule';
export * from './user-login-migration.rule';
export * from './user.rule';
