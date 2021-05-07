import taskModel = require('../../../../../../src/services/homework/model');
const { homeworkSchema: taskSchema } = taskModel;

// TODO export type and use factory instead
export const TaskSchema = taskSchema;
