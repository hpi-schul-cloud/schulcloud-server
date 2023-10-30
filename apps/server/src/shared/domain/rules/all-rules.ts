import { BoardDoRule } from './board-do.rule';
import { ContextExternalToolRule } from './context-external-tool.rule';
import { CourseGroupRule } from './course-group.rule';
import { CourseRule } from './course.rule';
import { LegacySchoolRule } from './legacy-school.rule';
import { LessonRule } from './lesson.rule';
import { SchoolExternalToolRule } from './school-external-tool.rule';
import { SubmissionRule } from './submission.rule';
import { TaskRule } from './task.rule';
import { TeamRule } from './team.rule';
import { UserLoginMigrationRule } from './user-login-migration.rule';
import { UserRule } from './user.rule';

export const ALL_RULES = [
	LessonRule,
	CourseRule,
	CourseGroupRule,
	LegacySchoolRule,
	SubmissionRule,
	TaskRule,
	TeamRule,
	UserRule,
	SchoolExternalToolRule,
	BoardDoRule,
	ContextExternalToolRule,
	UserLoginMigrationRule,
];
