import { Account } from './account.entity';
import { Board } from './board.entity';
import { BoardElement, LessonBoardElement, TaskBoardElement } from './boardelement.entity';
import { Course } from './course.entity';
import { CourseExternalTool } from './course-external-tool.entity';
import { CourseGroup } from './coursegroup.entity';
import { DashboardGridElementModel, DashboardModelEntity } from './dashboard.model.entity';
import { ExternalTool } from './external-tool/external-tool.entity';
import { File } from './file.entity';
import { ImportUser } from './import-user.entity';
import { Lesson } from './lesson.entity';
import { LtiTool } from './ltitool.entity';
import { Material } from './materials.entity';
import { CourseNews, News, SchoolNews, TeamNews } from './news.entity';
import { Pseudonym } from './pseudonym.entity';
import { Role } from './role.entity';
import { School, SchoolRolePermission, SchoolRoles } from './school.entity';
import { SchoolExternalTool } from './school-external-tool.entity';
import { SchoolYear } from './schoolyear.entity';
import { ShareToken } from './share-token.entity';
import { StorageProvider } from './storageprovider.entity';
import { Submission } from './submission.entity';
import { System } from './system.entity';
import { Task } from './task.entity';
import { Team, TeamUser } from './team.entity';
import { User } from './user.entity';
import { VideoConference } from './video-conference.entity';

export const ALL_ENTITIES = [
	Account,
	Board,
	BoardElement,
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
	Team,
	TeamNews,
	TeamUser,
	User,
	VideoConference,
];
