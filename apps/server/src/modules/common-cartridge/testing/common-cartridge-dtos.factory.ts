import { faker } from '@faker-js/faker';
import {
	BoardColumnBoardResponse,
	BoardLessonResponse,
	BoardResponse,
	BoardTaskResponse,
	CardListResponse,
	CardResponse,
	CardSkeletonResponse,
	ColumnResponse,
	CourseCommonCartridgeMetadataResponse,
	LessonContentResponse,
	LessonContentResponseContent,
	LessonLinkedTaskResponse,
	LessonResponse,
	SingleColumnBoardResponse,
} from '@infra/common-cartridge-clients';
import { Factory } from 'fishery';
import { BoardElementDtoType } from '../../../infra/common-cartridge-clients/enum/board-element.enum';
import { BoardLayout } from '../../../infra/common-cartridge-clients/enum/board-layout.enum';
import { fileElementResponseDtoFactory } from './file-element.factory';
import { fileFolderElementResponseDtoFactory } from './file-folder-element.factory';
import { linkElementFactory } from './link-element.factory';
import { richTextElementFactroy } from './rich-text-element.factory';

export const courseMetadataFactory = Factory.define<CourseCommonCartridgeMetadataResponse>(({ sequence }) => {
	return {
		id: sequence.toString(),
		title: `course-metadata-${faker.lorem.sentence()}`,
		creationDate: faker.date.recent().toISOString(),
		copyRightOwners: [faker.person.fullName(), faker.person.fullName()],
	};
});

export const cardFactory = Factory.define<CardSkeletonResponse>(({ sequence }) => {
	return {
		cardId: sequence.toString(),
		height: faker.number.int(),
	};
});

export const columnFactory = Factory.define<ColumnResponse>(({ sequence }) => {
	return {
		id: sequence.toString(),
		title: `column-${faker.lorem.sentence()}`,
		cards: [cardFactory.build(), cardFactory.build()],
		timestamps: {
			createdAt: faker.date.recent().toISOString(),
			lastUpdatedAt: faker.date.recent().toISOString(),
		},
	};
});

export const columnBoardFactory = Factory.define<BoardResponse>(({ sequence }) => {
	return {
		id: sequence.toString(),
		title: `column-board- faker.lorem.sentence()`,
		columns: [columnFactory.build(), columnFactory.build()],
		isVisible: faker.datatype.boolean(),
		layout: BoardLayout.COLUMNS,
		features: [],
		permissions: [],
		readersCanEdit: false,
		timestamps: {
			createdAt: faker.date.recent().toISOString(),
			lastUpdatedAt: faker.date.recent().toISOString(),
		},
	};
});

export const cardResponseFactory = Factory.define<CardResponse>(({ sequence, params }) => {
	return {
		id: params.id ?? sequence.toString(),
		height: faker.number.int(),
		elements: [
			richTextElementFactroy.build(),
			linkElementFactory.build(),
			fileElementResponseDtoFactory.build(),
			fileFolderElementResponseDtoFactory.build(),
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
		timestamps: {
			createdAt: faker.date.past().toISOString(),
			lastUpdatedAt: faker.date.recent().toISOString(),
			deletedAt: undefined,
		},
	};
});

type CardListResponseDtoFactoryTransientParams = {
	cardIds: string[];
};

class CardListResponseDtoFactory extends Factory<CardListResponse, CardListResponseDtoFactoryTransientParams> {
	public withCardIds(cardIds: string[]): this {
		return this.transient({
			cardIds,
		});
	}
}

export const listOfCardResponseFactory = CardListResponseDtoFactory.define(({ transientParams }) => {
	let data: CardResponse[] = [];

	if (transientParams.cardIds) {
		data = transientParams.cardIds.map((cardId) =>
			cardResponseFactory.build({
				id: cardId,
			})
		);
	} else {
		data = [cardResponseFactory.build(), cardResponseFactory.build()];
	}

	return {
		data,
	};
});

export const lessonLinkedTaskFactory = Factory.define<LessonLinkedTaskResponse>(() => {
	return {
		name: `lesson-linked-task-${faker.lorem.word()}`,
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

export const lernstoreContentFactory = Factory.define<LessonContentResponseContent>(({ sequence }) => {
	return {
		id: sequence.toString(),
		type: 'resources',
		content: {
			resources: [
				{
					url: faker.internet.url(),
					client: faker.company.name(),
					description: faker.lorem.sentence(),
					title: `lernstore-resource-${faker.lorem.sentence()}`,
				},
				{
					url: faker.internet.url(),
					client: faker.company.name(),
					description: faker.lorem.sentence(),
					title: `lernstore-resource-${faker.lorem.sentence()}`,
				},
				{
					url: faker.internet.url(),
					client: faker.company.name(),
					description: faker.lorem.sentence(),
					title: `lernstore-resource-${faker.lorem.sentence()}`,
				},
			],
		},
		title: `lernstore-content-${faker.lorem.sentence()}`,
		component: 'resources',
		hidden: faker.datatype.boolean(),
		description: faker.lorem.lines(),
		materialId: faker.string.uuid(),
	};
});

export const lessonContentFactory = Factory.define<LessonContentResponse>(({ sequence }) => {
	return {
		_id: sequence.toString(),
		id: sequence.toString(),
		type: faker.lorem.word(),
		content: { text: 'text' },
		title: `lesson-content-${faker.lorem.sentence()}`,
		component: 'text',
		hidden: faker.datatype.boolean(),
	};
});

export const lessonFactory = Factory.define<LessonResponse>(({ sequence }) => {
	return {
		_id: sequence.toString(),
		id: sequence.toString(),
		name: `lesson-${faker.lorem.word()}`,
		courseId: undefined,
		courseGroupId: faker.string.uuid(),
		hidden: faker.datatype.boolean(),
		position: faker.number.int(),
		contents: [lessonContentFactory.build()],
		materials: [],
	};
});

export const boardLessonFactory = Factory.define<BoardLessonResponse>(() => {
	return {
		id: faker.string.uuid(),
		name: `board-lesson-${faker.lorem.word()}`,
		courseName: undefined,
		hidden: faker.datatype.boolean(),
		numberOfPublishedTasks: faker.number.int(),
		numberOfDraftTasks: faker.number.int(),
		numberOfPlannedTasks: faker.number.int(),
		createdAt: faker.date.recent().toISOString(),
		updatedAt: faker.date.recent().toISOString(),
	};
});

export const boardTaskFactory = Factory.define<BoardTaskResponse>(({ sequence }) => {
	return {
		id: sequence.toString(),
		name: `board-task-${faker.lorem.word()}`,
		createdAt: faker.date.recent().toISOString(),
		updatedAt: faker.date.recent().toISOString(),
		availableDate: faker.date.recent().toISOString(),
		courseName: undefined,
		description: faker.lorem.word(),
		displayColor: faker.lorem.word(),
		dueDate: faker.date.recent().toISOString(),
		status: {
			submitted: faker.number.int(),
			maxSubmissions: faker.number.int(),
			graded: faker.number.int(),
			isDraft: faker.datatype.boolean(),
			isSubstitutionTeacher: faker.datatype.boolean(),
			isFinished: faker.datatype.boolean(),
		},
	};
});

export const boardColumnFactory = Factory.define<BoardColumnBoardResponse>(() => {
	return {
		id: faker.string.uuid(),
		title: `board-column-${faker.lorem.word()}`,
		published: faker.datatype.boolean(),
		createdAt: faker.date.recent().toISOString(),
		updatedAt: faker.date.recent().toISOString(),
		columnBoardId: faker.string.uuid(),
		layout: BoardLayout.COLUMNS,
	};
});

export const roomFactory = Factory.define<SingleColumnBoardResponse>(({ sequence }) => {
	return {
		roomId: sequence.toString(),
		title: `room-${faker.lorem.word()}`,
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
				content: boardColumnFactory.build(),
			},
		],
		isArchived: faker.datatype.boolean(),
		isSynchronized: faker.datatype.boolean(),
	};
});
