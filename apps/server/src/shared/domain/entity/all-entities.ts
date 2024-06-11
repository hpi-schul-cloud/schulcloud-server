import { ClassEntity } from '@modules/class/entity';
import { GroupEntity } from '@modules/group/entity';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { ExternalToolPseudonymEntity, PseudonymEntity } from '@modules/pseudonym/entity';
import { RegistrationPinEntity } from '@modules/registration-pin/entity';
import { ShareToken } from '@modules/sharing/entity/share-token.entity';
import { TldrawDrawing } from '@modules/tldraw/entities';
import { ContextExternalToolEntity } from '@modules/tool/context-external-tool/entity';
import { ExternalToolEntity } from '@modules/tool/external-tool/entity';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/entity';
import { MediaSourceEntity, MediaUserLicenseEntity, UserLicenseEntity } from '@modules/user-license/entity';
import { AccountEntity } from '@src/modules/account/domain/entity/account.entity';
import { DeletionLogEntity } from '@src/modules/deletion/repo/entity/deletion-log.entity';
import { DeletionRequestEntity } from '@src/modules/deletion/repo/entity/deletion-request.entity';
import { RocketChatUserEntity } from '@src/modules/rocketchat-user/entity';
import {
	BoardNode,
	CardNode,
	CollaborativeTextEditorElementNode,
	ColumnBoardNode,
	ColumnNode,
	DrawingElementNode,
	ExternalToolElementNodeEntity,
	FileElementNode,
	LinkElementNode,
	MediaBoardNode,
	MediaExternalToolElementNode,
	MediaLineNode,
	RichTextElementNode,
	SubmissionContainerElementNode,
	SubmissionItemNode,
} from './boardnode';
import { Course } from './course.entity';
import { CourseGroup } from './coursegroup.entity';
import { DashboardGridElementModel, DashboardModelEntity } from './dashboard.model.entity';
import { CountyEmbeddable, FederalStateEntity } from './federal-state.entity';
import { ImportUser } from './import-user.entity';
import {
	ColumnboardBoardElement,
	LegacyBoard,
	LegacyBoardElement,
	LessonBoardElement,
	TaskBoardElement,
} from './legacy-board';
import { LessonEntity } from './lesson.entity';
import { LtiTool } from './ltitool.entity';
import { Material } from './materials.entity';
import { CourseNews, News, SchoolNews, TeamNews } from './news.entity';
import { Role } from './role.entity';
import { SchoolEntity, SchoolRolePermission, SchoolRoles } from './school.entity';
import { SchoolYearEntity } from './schoolyear.entity';
import { StorageProviderEntity } from './storageprovider.entity';
import { Submission } from './submission.entity';
import { SystemEntity } from './system.entity';
import { Task } from './task.entity';
import { TeamEntity, TeamUserEntity } from './team.entity';
import { UserLoginMigrationEntity } from './user-login-migration.entity';
import { User } from './user.entity';
import { VideoConference } from './video-conference.entity';

export const ALL_ENTITIES = [
	AccountEntity,
	LegacyBoard,
	LegacyBoardElement,
	BoardNode,
	CardNode,
	ColumnboardBoardElement,
	ColumnBoardNode,
	ColumnNode,
	ClassEntity,
	DeletionRequestEntity,
	DeletionLogEntity,
	FileElementNode,
	LinkElementNode,
	RichTextElementNode,
	DrawingElementNode,
	SubmissionContainerElementNode,
	SubmissionItemNode,
	ExternalToolElementNodeEntity,
	CollaborativeTextEditorElementNode,
	MediaBoardNode,
	MediaLineNode,
	MediaExternalToolElementNode,
	ContextExternalToolEntity,
	CountyEmbeddable,
	Course,
	CourseGroup,
	CourseNews,
	DashboardGridElementModel,
	DashboardModelEntity,
	ExternalToolEntity,
	FederalStateEntity,
	ImportUser,
	LessonEntity,
	LessonBoardElement,
	LtiTool,
	Material,
	News,
	PseudonymEntity,
	ExternalToolPseudonymEntity,
	RocketChatUserEntity,
	Role,
	SchoolEntity,
	SchoolExternalToolEntity,
	SchoolNews,
	SchoolRolePermission,
	SchoolRoles,
	SchoolSystemOptionsEntity,
	SchoolYearEntity,
	ShareToken,
	StorageProviderEntity,
	Submission,
	SystemEntity,
	Task,
	TaskBoardElement,
	TeamEntity,
	TeamNews,
	TeamUserEntity,
	User,
	UserLoginMigrationEntity,
	VideoConference,
	GroupEntity,
	RegistrationPinEntity,
	TldrawDrawing,
	UserLicenseEntity,
	MediaUserLicenseEntity,
	MediaSourceEntity,
];
