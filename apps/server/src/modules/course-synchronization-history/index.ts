/** **********************************************************
 * This is a module facade!                                  *
 * Please export only what is allowed to be used externally. *
 * Please do not use wildcard exports.                       *
 *********************************************************** */

export { CourseSynchronizationHistoryModule } from './course-synchronization-history.module';
export {
	CourseSynchronizationHistory,
	CourseSynchronizationHistoryFactory,
	CourseSynchronizationHistoryProps,
	CourseSynchronizationHistoryService,
} from './domain';
