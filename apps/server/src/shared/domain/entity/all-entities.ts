import { Account } from './account.entity';
import { Board } from './board.entity';
import { BoardElement, LessonBoardElement, TaskBoardElement } from './boardelement.entity';
import { Course } from './course.entity';
import { CourseGroup } from './coursegroup.entity';
import { DashboardGridElementModel, DashboardModelEntity } from './dashboard.model.entity';
import { File } from './file.entity';
import { FileRecord, FileSecurityCheck } from './filerecord.entity';
import { ImportUser } from './import-user.entity';
import { Lesson } from './lesson.entity';
import { LtiTool } from './ltitool.entity';
import { Material } from './materials.entity';
import { CourseNews, News, SchoolNews, TeamNews } from './news.entity';
import { Pseudonym } from './pseudonym.entity';
import { Role } from './role.entity';
import { School, SchoolRolePermission, SchoolRoles } from './school.entity';
import { SchoolYear } from './schoolyear.entity';
import { Shareable } from './shareable.entity';
import { StorageProvider } from './storageprovider.entity';
import { Submission } from './submission.entity';
import { System } from './system.entity';
import { Task } from './task.entity';
import { Team, TeamUser } from './team.entity';
import { User } from './user.entity';
import { VideoConference } from './video-conference.entity';

export const ALL_ENTITIES = [
	Account,
	Course,
	CourseGroup,
	Board,
	BoardElement,
	TaskBoardElement,
	LessonBoardElement,
	DashboardModelEntity,
	DashboardGridElementModel,
	File,
	StorageProvider,
	Lesson,
	LtiTool,
	Material,
	Role,
	School,
	SchoolRoles,
	SchoolRolePermission,
	SchoolYear,
	Submission,
	Task,
	Team,
	TeamUser,
	User,
	CourseNews,
	News,
	Pseudonym,
	SchoolNews,
	Shareable,
	TeamNews,
	System,
	ImportUser,
	FileRecord,
	FileSecurityCheck,
	VideoConference,
];
