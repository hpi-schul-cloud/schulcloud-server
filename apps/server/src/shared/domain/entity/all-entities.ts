import { ImportUser } from './import-user.entity';
import { Course } from './course.entity';
import { CourseGroup } from './coursegroup.entity';
import { BoardElement, TaskBoardElement, LessonBoardElement } from './boardelement.entity';
import { Board } from './board.entity';
import { DashboardGridElementModel, DashboardModelEntity } from './dashboard.model.entity';
import { BaseFile, Directory, File } from './file.entity';
import { Lesson } from './lesson.entity';
import { CourseNews, News, TeamNews, SchoolNews } from './news.entity';
import { Role } from './role.entity';
import { School, SchoolRoles, SchoolRolePermission } from './school.entity';
import { StorageProvider } from './storageprovider.entity';
import { Submission } from './submission.entity';
import { Task } from './task.entity';
import { Team } from './team.entity';
import { User } from './user.entity';
import { System } from './system.entity';
import { FileRecord, FileSecurityCheck } from './filerecord.entity';
import { Account } from './account.entity';

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
	BaseFile,
	File,
	Directory,
	StorageProvider,
	Lesson,
	Role,
	School,
	SchoolRoles,
	SchoolRolePermission,
	Submission,
	Task,
	Team,
	User,
	CourseNews,
	News,
	SchoolNews,
	TeamNews,
	System,
	ImportUser,
	FileRecord,
	FileSecurityCheck,
];
