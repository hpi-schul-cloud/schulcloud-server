import { ShareToken } from '@src/modules/sharing/entity/share-token.entity';
import { ExternalToolPseudonymEntity, PseudonymEntity } from '@src/modules/pseudonym/entity';
import { ExternalToolEntity } from '@src/modules/tool/external-tool/entity';
import { ContextExternalToolEntity } from '@src/modules/tool/context-external-tool/entity';
import { SchoolExternalToolEntity } from '@src/modules/tool/school-external-tool/entity';
import { ClassEntity } from '@src/modules/classes/entity';
import { Account } from './account.entity';
import {
	CardNode,
	ColumnBoardNode,
	ColumnNode,
	FileElementNode,
	RichTextElementNode,
	SubmissionContainerElementNode,
	SubmissionItemNode,
} from './boardnode';
import { BoardNode } from './boardnode/boardnode.entity';
import { Course } from './course.entity';
import { CourseGroup } from './coursegroup.entity';
import { DashboardGridElementModel, DashboardModelEntity } from './dashboard.model.entity';
import { FederalState } from './federal-state.entity';
import { File } from './file.entity';
import { ImportUser } from './import-user.entity';
import {
	Board,
	BoardElement,
	ColumnBoardTarget,
	ColumnboardBoardElement,
	LessonBoardElement,
	TaskBoardElement,
} from './legacy-board';
import { Lesson } from './lesson.entity';
import { LtiTool } from './ltitool.entity';
import { Material } from './materials.entity';
import { CourseNews, News, SchoolNews, TeamNews } from './news.entity';
import { Role } from './role.entity';
import { School, SchoolRolePermission, SchoolRoles } from './school.entity';
import { SchoolYear } from './schoolyear.entity';
import { StorageProvider } from './storageprovider.entity';
import { Submission } from './submission.entity';
import { System } from './system.entity';
import { Task } from './task.entity';
import { Team, TeamUser } from './team.entity';
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
	Course,
	ContextExternalToolEntity,
	CourseGroup,
	CourseNews,
	DashboardGridElementModel,
	DashboardModelEntity,
	ExternalToolEntity,
	FederalState,
	File,
	ImportUser,
	Lesson,
	LessonBoardElement,
	LtiTool,
	Material,
	News,
	PseudonymEntity,
	ExternalToolPseudonymEntity,
	Role,
	School,
	SchoolExternalToolEntity,
	SchoolNews,
	SchoolRolePermission,
	SchoolRoles,
	SchoolYear,
	ShareToken,
	StorageProvider,
	Submission,
	System,
	Task,
	TaskBoardElement,
	Team,
	TeamNews,
	TeamUser,
	User,
	UserLoginMigration,
	VideoConference,
];
