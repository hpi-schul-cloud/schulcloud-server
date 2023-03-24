import { ShareToken } from '@src/modules/sharing/entity/share-token.entity';
import { Account } from './account.entity';
import { Board } from './board.entity';
import { BoardElement, LessonBoardElement, TaskBoardElement } from './boardelement.entity';
import { Course } from './course.entity';
import { CourseExternalTool, ExternalTool, SchoolExternalTool } from './external-tools';
import { CourseGroup } from './coursegroup.entity';
import { DashboardGridElementModel, DashboardModelEntity } from './dashboard.model.entity';
import { File } from './file.entity';
import { ImportUser } from './import-user.entity';
import { Lesson } from './lesson.entity';
import { LtiTool } from './ltitool.entity';
import { Material } from './materials.entity';
import { CourseNews, News, SchoolNews, TeamNews } from './news.entity';
import { Pseudonym } from './pseudonym.entity';
import { Role } from './role.entity';
import { School, SchoolRolePermission, SchoolRoles } from './school.entity';
import { SchoolYear } from './schoolyear.entity';
import { StorageProvider } from './storageprovider.entity';
import { Submission } from './submission.entity';
import { System } from './system.entity';
import { Task } from './task.entity';
import { TaskCard } from './task-card.entity';
import { Team, TeamUser } from './team.entity';
import { User } from './user.entity';
import { VideoConference } from './video-conference.entity';
import { CardElement, RichTextCardElement } from './card-element.entity';
import { BoardNode } from './boardnode/boardnode.entity';
import { CardNode, ColumnBoardNode, ColumnNode, TextElementNode } from './boardnode';

export const ALL_ENTITIES = [
	Account,
	Board,
	BoardElement,
	BoardNode,
	CardNode,
	ColumnBoardNode,
	ColumnNode,
	TextElementNode,
	Course,
	CourseExternalTool,
	CourseGroup,
	CourseNews,
	DashboardGridElementModel,
	DashboardModelEntity,
	ExternalTool,
	File,
	ImportUser,
	Lesson,
	LessonBoardElement,
	LtiTool,
	Material,
	News,
	Pseudonym,
	Role,
	School,
	SchoolExternalTool,
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
	TaskCard,
	CardElement,
	RichTextCardElement,
	Team,
	TeamNews,
	TeamUser,
	User,
	VideoConference,
];
