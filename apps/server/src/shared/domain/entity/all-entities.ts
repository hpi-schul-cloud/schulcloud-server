import { ClassEntity } from '@src/modules/class/entity/class.entity';
import { GroupEntity } from '@src/modules/group/entity/group.entity';
import { ExternalToolPseudonymEntity } from '@src/modules/pseudonym/entity/external-tool-pseudonym.entity';
import { PseudonymEntity } from '@src/modules/pseudonym/entity/pseudonym.entity';
import { ShareToken } from '@src/modules/sharing/entity/share-token.entity';
import { ContextExternalToolEntity } from '@src/modules/tool/context-external-tool/entity/context-external-tool.entity';
import { ExternalToolEntity } from '@src/modules/tool/external-tool/entity/external-tool.entity';
import { SchoolExternalToolEntity } from '@src/modules/tool/school-external-tool/entity/school-external-tool.entity';
import { Account } from './account.entity';
import { BoardNode } from './boardnode/boardnode.entity';
import { CardNode } from './boardnode/card-node.entity';
import { ColumnBoardNode } from './boardnode/column-board-node.entity';
import { ColumnNode } from './boardnode/column-node.entity';
import { ExternalToolElementNodeEntity } from './boardnode/external-tool-element-node.entity';
import { FileElementNode } from './boardnode/file-element-node.entity';
import { LinkElementNode } from './boardnode/link-element-node.entity';
import { RichTextElementNode } from './boardnode/rich-text-element-node.entity';
import { SubmissionContainerElementNode } from './boardnode/submission-container-element-node.entity';
import { SubmissionItemNode } from './boardnode/submission-item-node.entity';
import { Course } from './course.entity';
import { CourseGroup } from './coursegroup.entity';
import { DashboardGridElementModel, DashboardModelEntity } from './dashboard.model.entity';
import { FederalStateEntity } from './federal-state.entity';
import { ImportUser } from './import-user.entity';
import { Board } from './legacy-board/board.entity';
import { BoardElement } from './legacy-board/boardelement.entity';
import { ColumnboardBoardElement } from './legacy-board/column-board-boardelement';
import { ColumnBoardTarget } from './legacy-board/column-board-target.entity';
import { LessonBoardElement } from './legacy-board/lesson-boardelement.entity';
import { TaskBoardElement } from './legacy-board/task-boardelement.entity';
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
	LinkElementNode,
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
	FederalStateEntity,
	ImportUser,
	LessonEntity,
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
];
