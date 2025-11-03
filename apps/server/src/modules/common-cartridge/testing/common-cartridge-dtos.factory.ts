import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import { CourseCommonCartridgeMetadataDto } from '@infra/courses-client/dto';
import { BoardResponse, ColumnResponse, CardSkeletonResponse } from '@infra/boards-client';
import { LessonContentDto, LessonDto, LessonLinkedTaskDto } from '../common-cartridge-client/lesson-client/dto';
import { CardListResponseDto } from '../common-cartridge-client/card-client/dto/card-list-response.dto';
import { CardResponseDto } from '../common-cartridge-client/card-client/dto/card-response.dto';
import {
	RoomBoardDto,
	BoardTaskStatusDto,
	BoardTaskDto,
	BoardLessonDto,
	BoardColumnBoardDto,
} from '../common-cartridge-client/room-client/dto';
import { BoardElementDtoType } from '../common-cartridge-client/room-client/enums/board-element.enum';
import { BoardLayout } from '../common-cartridge-client/room-client/enums/board-layout.enum';
import { richTextElementFactroy } from './rich-text-element.factory';
import { linkElementFactory } from './link-element.factory';
import { fileElementResponseDtoFactory } from './file-element.factory';
import { fileFolderElementResponseDtoFactory } from './file-folder-element.factory';

export const courseMetadataFactory = Factory.define<CourseCommonCartridgeMetadataDto>(({ sequence }) => {
	return {
		id: sequence.toString(),
		title: faker.lorem.sentence(),
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
		title: faker.lorem.sentence(),
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
		title: faker.lorem.sentence(),
		columns: [columnFactory.build(), columnFactory.build()],
		isVisible: faker.datatype.boolean(),
		layout: BoardLayout.COLUMNS,
		features: [],
		timestamps: {
			createdAt: faker.date.recent().toISOString(),
			lastUpdatedAt: faker.date.recent().toISOString(),
		},
	};
});

export const cardResponseFactory = Factory.define<CardResponseDto>(({ sequence, params }) => {
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
	};
});

type CardListResponseDtoFactoryTransientParams = {
	cardIds: string[];
};

class CardListResponseDtoFactory extends Factory<CardListResponseDto, CardListResponseDtoFactoryTransientParams> {
	public withCardIds(cardIds: string[]): this {
		return this.transient({
			cardIds,
		});
	}
}

export const listOfCardResponseFactory = CardListResponseDtoFactory.define(({ transientParams }) => {
	let data: CardResponseDto[] = [];

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

export const lernstoreContentFactory = Factory.define<LessonContentDto>(({ sequence }) => {
	return {
		id: sequence.toString(),
		type: 'resources',
		content: {
			resources: [
				{
					url: faker.internet.url(),
					client: faker.company.name(),
					description: faker.lorem.sentence(),
					merlinReference: faker.string.uuid(),
					title: faker.lorem.sentence(),
				},
				{
					url: faker.internet.url(),
					client: faker.company.name(),
					description: faker.lorem.sentence(),
					merlinReference: faker.string.uuid(),
					title: faker.lorem.sentence(),
				},
				{
					url: faker.internet.url(),
					client: faker.company.name(),
					description: faker.lorem.sentence(),
					merlinReference: faker.string.uuid(),
					title: faker.lorem.sentence(),
				},
			],
		},
		title: faker.lorem.sentence(),
		component: 'resources',
		hidden: faker.datatype.boolean(),
	};
});

export const lessonContentFactory = Factory.define<LessonContentDto>(({ sequence }) => {
	return {
		id: sequence.toString(),
		type: faker.lorem.word(),
		content: { text: 'text' },
		title: faker.lorem.sentence(),
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
		contents: [lessonContentFactory.build()],
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

export const boardColumnFactory = Factory.define<BoardColumnBoardDto>(() => {
	return {
		id: faker.string.uuid(),
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
				content: boardColumnFactory.build(),
			},
		],
		isArchived: faker.datatype.boolean(),
		isSynchronized: faker.datatype.boolean(),
	};
});
