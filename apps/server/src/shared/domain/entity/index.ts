export { ALL_ENTITIES } from './all-entities';
export { BaseEntity, BaseEntityReference, BaseEntityWithTimestamps, baseEntityProperties } from './base.entity';
export { ColumnBoardNodeProps, ColumnBoardNode } from './column-board-node.entity';
export { Course, CourseFeatures, CourseProperties, UsersList, SyncAttribute } from './course.entity';
export { CourseGroup, CourseGroupProperties } from './coursegroup.entity';
export {
	DashboardEntity,
	DashboardProps,
	GridElement,
	GridElementContent,
	GridElementWithPosition,
	GridPosition,
	GridPositionWithGroupIndex,
	IGridElement,
} from './dashboard.entity';
export {
	DashboardGridElementModel,
	DashboardGridElementModelProperties,
	DashboardModelEntity,
	DashboardModelProperties,
} from './dashboard.model.entity';
export { CountyEmbeddable, FederalStateEntity, FederalStateProperties } from './federal-state.entity';
export {
	BoardProps,
	ColumnboardBoardElement,
	LegacyBoard,
	LegacyBoardElement,
	LegacyBoardElementProps,
	LegacyBoardElementReference,
	LegacyBoardElementType,
	LessonBoardElement,
	TaskBoardElement,
} from './legacy-board';
export {
	ComponentEtherpadProperties,
	ComponentGeogebraProperties,
	ComponentInternalProperties,
	ComponentLernstoreProperties,
	ComponentNexboardProperties,
	ComponentProperties,
	ComponentTextProperties,
	ComponentType,
	LessonEntity,
	LessonParent,
	LessonProperties,
	isLesson,
} from './lesson.entity';
export { CustomLtiProperty, ILtiToolProperties, LtiPrivacyPermission, LtiRoleType, LtiTool } from './ltitool.entity';
export { Material, MaterialProperties, RelatedResourceProperties, TargetGroupProperties } from './materials.entity';
export { CourseNews, News, NewsProperties, SchoolNews, TeamNews } from './news.entity';
export { Role, RoleProperties } from './role.entity';
export { SchoolEntity, SchoolProperties, SchoolRolePermission, SchoolRoles } from './school.entity';
export { SchoolYearEntity, SchoolYearProperties } from './schoolyear.entity';
export { StorageProviderEntity, StorageProviderProperties } from './storageprovider.entity';
export { Submission, SubmissionProperties } from './submission.entity';
export { Task, TaskParent, TaskParentDescriptions, TaskWithStatusVo, isTask } from './task.entity';
export { TeamEntity, TeamProperties, TeamUserEntity, TeamUserProperties } from './team.entity';
export { IUserLoginMigration, UserLoginMigrationEntity } from './user-login-migration.entity';
export { User, UserProperties, UserSchoolEmbeddable } from './user.entity';
export {
	IVideoConferenceProperties,
	TargetModels,
	VideoConference,
	VideoConferenceOptions,
} from './video-conference.entity';
export { ConsentEntity, ParentConsentEntity, UserConsentEntity } from './consent';
