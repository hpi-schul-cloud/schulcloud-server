import taskModel = require('../../../../../../src/services/homework/model');
import courseModel = require('../../../../../../src/services/user-group/model');
import lessonModel = require('../../../../../../src/services/lesson/model');
const { homeworkSchema: taskSchema, SubmissionSchema: submissionSchema } = taskModel;
const { courseSchema } = courseModel;
const { lessonSchema } = lessonModel;

// TODO export type and use factory instead
export const TaskSchema = taskSchema;
export const SubmissionSchema = submissionSchema;
export const CourseSchema = courseSchema;
export const LessonSchema = lessonSchema;
