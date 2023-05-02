import { CourseGroupRule } from './course-group.rule';
import { CourseRule } from './course.rule';
import { LessonRule } from './lesson.rule';
import { SchoolRule } from './school.rule';
import { SubmissionRule } from './submission.rule';
import { TaskCardRule } from './task-card.rule';
import { TaskRule } from './task.rule';
import { TeamRule } from './team.rule';
import { UserRule } from './user.rule';
import { SchoolExternalToolRule } from './school-external-tool.rule';

export * from './course-group.rule';
export * from './course.rule';
export * from './lesson.rule';
export * from './school.rule';
export * from './submission.rule';
export * from './task-card.rule';
export * from './task.rule';
export * from './team.rule';
export * from './user.rule';
export * from './school-external-tool.rule';

export const ALL_RULES = [
	LessonRule,
	CourseRule,
	CourseGroupRule,
	SchoolRule,
	SubmissionRule,
	TaskRule,
	TaskCardRule,
	TeamRule,
	UserRule,
	SchoolExternalToolRule,
];
