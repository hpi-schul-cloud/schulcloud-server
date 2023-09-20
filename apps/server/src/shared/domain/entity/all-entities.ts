import { ClassEntity } from '@src/modules/class/entity';
import { GroupEntity } from '@src/modules/group/entity';
import { ExternalToolPseudonymEntity, PseudonymEntity } from '@src/modules/pseudonym/entity';
import { ShareToken } from '@src/modules/sharing/entity/share-token.entity';
import { ContextExternalToolEntity } from '@src/modules/tool/context-external-tool/entity';
import { ExternalToolEntity } from '@src/modules/tool/external-tool/entity';
import { SchoolExternalToolEntity } from '@src/modules/tool/school-external-tool/entity';
import { Account } from './account.entity';
import {
	BoardNode,
	CardNode,
	ColumnBoardNode,
	ColumnNode,
	ExternalToolElementNodeEntity,
	FileElementNode,
	RichTextElementNode,
	SubmissionContainerElementNode,
	SubmissionItemNode,
} from './boardnode';
import { Course } from './course.entity';
import { CourseGroup } from './coursegroup.entity';
import { DashboardGridElementModel, DashboardModelEntity } from './dashboard.model.entity';
import { FederalState } from './federal-state.entity';
import { ImportUser } from './import-user.entity';
import {
	Board,
	BoardElement,
	ColumnboardBoardElement,
	ColumnBoardTarget,
	LessonBoardElement,
	TaskBoardElement,
} from './legacy-board';
import { Lesson } from './lesson.entity';
import { LtiTool } from './ltitool.entity';
import { Material } from './materials.entity';
import { CourseNews, News, SchoolNews, TeamNews } from './news.entity';
import { Role } from './role.entity';
import { SchoolEntity, SchoolRolePermission, SchoolRoles } from './school.entity';
import { SchoolYear } from './schoolyear.entity';
import { StorageProviderEntity } from './storageprovider.entity';
import { Submission } from './submission.entity';
import { System } from './system.entity';
import { Task } from './task.entity';
import { TeamEntity, TeamUserEntity } from './team.entity';
import { UserLoginMigration } from './user-login-migration.entity';
import { User } from './user.entity';
import { VideoConference } from './video-conference.entity';

export const ALL_ENTITIES = [
	Account,
	Board,
	BoardElement,
	BoardNode,
	CardNode,
	ColumnboardBoardElement,
	ColumnBoardNode,
	ColumnBoardTarget,
	ColumnNode,
	ClassEntity,
	FileElementNode,
	RichTextElementNode,
	SubmissionContainerElementNode,
	SubmissionItemNode,
	ExternalToolElementNodeEntity,
	Course,
	ContextExternalToolEntity,
	CourseGroup,
	CourseNews,
	DashboardGridElementModel,
	DashboardModelEntity,
	ExternalToolEntity,
	FederalState,
	ImportUser,
	Lesson,
	LessonBoardElement,
	LtiTool,
	Material,
	News,
	PseudonymEntity,
	ExternalToolPseudonymEntity,
	Role,
	SchoolEntity,
	SchoolExternalToolEntity,
	SchoolNews,
	SchoolRolePermission,
	SchoolRoles,
	SchoolYear,
	ShareToken,
	StorageProviderEntity,
	Submission,
	System,
	Task,
	TaskBoardElement,
	TeamEntity,
	TeamNews,
	TeamUserEntity,
	User,
	UserLoginMigration,
	VideoConference,
	GroupEntity,
];
