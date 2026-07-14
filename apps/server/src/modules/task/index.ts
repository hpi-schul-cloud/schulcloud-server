/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { TaskCopyService, TaskCreate, TaskService, TaskStatus } from './domain';
export { TASK_PUBLIC_API_CONFIG_TOKEN, TaskPublicApiConfig } from './task.config';
export { TaskModule } from './task.module';
