import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import { CourseCommonCartridgeMetadataDto } from '../common-cartridge-client/course-client';
import { LessonContentDto, LessonDto, LessonLinkedTaskDto } from '../common-cartridge-client/lesson-client/dto';
import { BoardSkeletonDto, CardSkeletonDto, ColumnSkeletonDto } from '../common-cartridge-client/board-client';
import { CardListResponseDto } from '../common-cartridge-client/card-client/dto/card-list-response.dto';
import { CardResponseDto } from '../common-cartridge-client/card-client/dto/card-response.dto';
import { ContentElementType } from '../common-cartridge-client/card-client/enums/content-element-type.enum';
import { BoardTaskDto } from '../common-cartridge-client/room-client/dto/board-task.dto';
import { BoardTaskStatusDto } from '../common-cartridge-client/room-client/dto/board-task-status.dto';
import { RoomBoardDto } from '../common-cartridge-client/room-client/dto/room-board.dto';
import { BoardElementDtoType } from '../common-cartridge-client/room-client/enums/board-element.enum';
import { BoardLessonDto } from '../common-cartridge-client/room-client/dto/board-lesson.dto';
import { BoardColumnBoardDto } from '../common-cartridge-client/room-client/dto/board-column-board.dto';
import { BoardLayout } from '../common-cartridge-client/room-client/enums/board-layout.enum';

export const courseMetadataFactory = Factory.define<CourseCommonCartridgeMetadataDto>(({ sequence }) => {
	return {
		id: sequence.toString(),
		courseName: faker.lorem.sentence(),
		creationDate: faker.date.recent().toISOString(),
		copyRightOwners: [faker.person.fullName(), faker.person.fullName()],
	};
});

export const cardFactory = Factory.define<CardSkeletonDto>(({ sequence }) => {
	return {
		cardId: sequence.toString(),
		height: faker.number.int(),
	};
});

export const columnFactory = Factory.define<ColumnSkeletonDto>(({ sequence }) => {
	return {
		columnId: sequence.toString(),
		title: faker.lorem.sentence(),
		cards: [cardFactory.build(), cardFactory.build()],
	};
});

export const columnBoardFactory = Factory.define<BoardSkeletonDto>(({ sequence }) => {
	return {
		boardId: sequence.toString(),
		title: faker.lorem.sentence(),
		columns: [columnFactory.build(), columnFactory.build()],
		isVisible: faker.datatype.boolean(),
		layout: faker.lorem.word(),
	};
});

export const cardResponseFactory = Factory.define<CardResponseDto>(({ sequence }) => {
	return {
		id: sequence.toString(),
		height: faker.number.int(),
		elements: [
			{
				id: faker.string.uuid(),
				type: ContentElementType.RICH_TEXT,
				content: {
					text: 'text',
					inputFormat: 'plainText',
				},
				timestamps: {
					lastUpdatedAt: faker.date.recent().toISOString(),
					createdAt: faker.date.recent().toISOString(),
					deletedAt: undefined,
				},
			},
			{
				id: faker.string.uuid(),
				type: ContentElementType.LINK,
				content: {
					url: faker.internet.url(),
					title: faker.lorem.word(),
					description: faker.lorem.sentence(),
				},
				timestamps: {
					lastUpdatedAt: faker.date.recent().toISOString(),
					createdAt: faker.date.recent().toISOString(),
					deletedAt: undefined,
				},
			},
		],
		visibilitySettings: {
			publishedAt: faker.date.recent().toISOString(),
		},
		timeStamps: {
			lastUpdatedAt: faker.date.recent().toISOString(),
			createdAt: faker.date.recent().toISOString(),
			deletedAt: undefined,
		},
		title: faker.lorem.sentence(),
	};
});

export const listOfCardResponseFactory = Factory.define<CardListResponseDto>(() => {
	return {
		data: [cardResponseFactory.build(), cardResponseFactory.build()],
	};
});

export const lessonLinkedTaskFactory = Factory.define<LessonLinkedTaskDto>(() => {
	return {
		name: faker.lorem.word(),
		description: faker.lorem.paragraph(),
		descriptionInputFormat: 'plainText',
		availableDate: faker.date.recent().toISOString(),
		dueDate: faker.date.future().toISOString(),
		private: faker.datatype.boolean(),
		publicSubmissions: faker.datatype.boolean(),
		teamSubmissions: faker.datatype.boolean(),
		creator: faker.internet.email(),
		courseId: null,
		submissionIds: [faker.string.uuid(), faker.string.uuid()],
		finishedIds: [faker.string.uuid(), faker.string.uuid()],
	};
});

export const lessonContentFactory = Factory.define<LessonContentDto>(({ sequence }) => {
	return {
		id: sequence.toString(),
		type: faker.lorem.word(),
		content: { text: 'text' },
		title: faker.lorem.word(),
		component: 'text',
		hidden: faker.datatype.boolean(),
	};
});

export const lessonFactory = Factory.define<LessonDto>(({ sequence }) => {
	return {
		lessonId: sequence.toString(),
		name: faker.lorem.word(),
		courseId: undefined,
		courseGroupId: faker.string.uuid(),
		hidden: faker.datatype.boolean(),
		position: faker.number.int(),
		contents: lessonContentFactory.buildList(2),
		materials: [],
		linkedTasks: [lessonLinkedTaskFactory.build(), lessonLinkedTaskFactory.build()],
	};
});

export const boardLessonFactory = Factory.define<BoardLessonDto>(() => {
	return {
		id: faker.string.uuid(),
		name: faker.lorem.word(),
		courseName: undefined,
		hidden: faker.datatype.boolean(),
		numberOfPublishedTasks: faker.number.int(),
		numberOfDraftTasks: faker.number.int(),
		numberOfPlannedTasks: faker.number.int(),
		createdAt: faker.date.recent().toISOString(),
		updatedAt: faker.date.recent().toISOString(),
	};
});

export const boardTaskFactory = Factory.define<BoardTaskDto>(({ sequence }) => {
	return {
		id: sequence.toString(),
		name: faker.lorem.word(),
		createdAt: faker.date.recent().toISOString(),
		updatedAt: faker.date.recent().toISOString(),
		availableDate: faker.date.recent().toISOString(),
		courseName: undefined,
		description: faker.lorem.word(),
		displayColor: faker.lorem.word(),
		dueDate: faker.date.recent().toISOString(),
		status: new BoardTaskStatusDto({
			submitted: faker.number.int(),
			maxSubmissions: faker.number.int(),
			graded: faker.number.int(),
			isDraft: faker.datatype.boolean(),
			isSubstitutionTeacher: faker.datatype.boolean(),
			isFinished: faker.datatype.boolean(),
		}),
	};
});

export const boardCloumnBoardFactory = Factory.define<BoardColumnBoardDto>(({ sequence }) => {
	return {
		id: sequence.toString(),
		title: faker.lorem.word(),
		published: faker.datatype.boolean(),
		createdAt: faker.date.recent().toISOString(),
		updatedAt: faker.date.recent().toISOString(),
		columnBoardId: faker.string.uuid(),
		layout: BoardLayout.COLUMNS,
	};
});

export const roomFactory = Factory.define<RoomBoardDto>(({ sequence }) => {
	return {
		roomId: sequence.toString(),
		title: faker.lorem.word(),
		displayColor: faker.lorem.word(),
		elements: [
			{
				type: BoardElementDtoType.TASK,
				content: boardTaskFactory.build(),
			},
			{
				type: BoardElementDtoType.LESSON,
				content: boardLessonFactory.build(),
			},
			{
				type: BoardElementDtoType.COLUMN_BOARD,
				content: boardCloumnBoardFactory.build(),
			},
		],
		isArchived: faker.datatype.boolean(),
		isSynchronized: faker.datatype.boolean(),
	};
});
