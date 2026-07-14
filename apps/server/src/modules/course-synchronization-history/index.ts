/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { CourseSynchronizationHistoryModule } from './course-synchronization-history.module';
export {
	CourseSynchronizationHistory,
	CourseSynchronizationHistoryFactory,
	CourseSynchronizationHistoryProps,
	CourseSynchronizationHistoryService,
} from './domain';
