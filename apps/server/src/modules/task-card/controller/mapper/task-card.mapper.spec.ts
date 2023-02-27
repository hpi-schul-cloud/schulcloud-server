import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { ValidationError } from '@shared/common';
import {
	CardElementResponse,
	CardElementType,
	CardTitleElementResponse,
	InputFormat,
	RichText,
	RichTextCardElement,
	TaskWithStatusVo,
	TitleCardElement,
} from '@shared/domain';
import {
	courseFactory,
	richTextCardElementFactory,
	setupEntities,
	taskCardFactory,
	titleCardElementFactory,
	userFactory,
} from '@shared/testing';
import { RichTextCardElementParam, TitleCardElementParam } from '@src/modules/task-card/controller/dto';
import { TaskMapper } from '@src/modules/task/mapper';
import { TaskCardMapper } from './task-card.mapper';

describe('task-card mapper', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('mapToResponse', () => {
		it('should map task-card to response', () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const tomorrow = new Date(Date.now() + 86400000);
			const inTwoDays = new Date(Date.now() + 172800000);

			const taskCard = taskCardFactory.buildWithId({
				creator: user,
				course,
				visibleAtDate: tomorrow,
				dueDate: inTwoDays,
			});
			const status = taskCard.task.createTeacherStatusForUser(user);

			const taskWithStatusVo = new TaskWithStatusVo(taskCard.task, status);
			const taskResponse = TaskMapper.mapToResponse(taskWithStatusVo);

			const mapper = new TaskCardMapper();
			const result = mapper.mapToResponse(taskCard, taskWithStatusVo);

			expect(result).toEqual({
				id: taskCard.id,
				draggable: true,
				cardElements: [],
				courseId: taskCard.course?.id,
				courseName: course.name,
				task: taskResponse,
				visibleAtDate: tomorrow,
				dueDate: inTwoDays,
			});
		});
		it('should map card elements to response', () => {
			const user = userFactory.buildWithId();
			const richTextCardElement: RichTextCardElement = richTextCardElementFactory.buildWithId();
			const titleCardElement: TitleCardElement = titleCardElementFactory.buildWithId();
			const titleCardElementResponse: CardElementResponse = {
				id: titleCardElement.id,
				cardElementType: CardElementType.Title,
				content: new CardTitleElementResponse(titleCardElement),
			};

			const taskCard = taskCardFactory.buildWithId({
				creator: user,
				cardElements: [titleCardElement, richTextCardElement],
			});

			const status = taskCard.task.createTeacherStatusForUser(user);
			const taskWithStatusVo = new TaskWithStatusVo(taskCard.task, status);

			const mapper = new TaskCardMapper();
			const result = mapper.mapToResponse(taskCard, taskWithStatusVo);

			expect(result.cardElements[0]).toEqual(expect.objectContaining({ ...titleCardElementResponse }));
		});
	});

	describe('mapToDomain', () => {
		it('should throw if title is not given', () => {
			const cardElementRichText = new RichTextCardElementParam();
			cardElementRichText.type = CardElementType.RichText;
			cardElementRichText.value = 'update richtext';
			cardElementRichText.inputFormat = InputFormat.RICH_TEXT_CK5;

			const params = {
				cardElements: [
					{
						content: cardElementRichText,
					},
				],
			};
			expect(() => TaskCardMapper.mapToDomain(params)).toThrowError(ValidationError);
		});
		it('should throw if more than one title given', () => {
			const cardElementTitle1 = new TitleCardElementParam();
			cardElementTitle1.type = CardElementType.Title;
			cardElementTitle1.value = 'update title';
			const cardElementTitle2 = new TitleCardElementParam();
			cardElementTitle2.type = CardElementType.Title;
			cardElementTitle2.value = 'update title';

			const params = {
				cardElements: [
					{
						content: cardElementTitle1,
					},
					{
						content: cardElementTitle2,
					},
				],
			};
			expect(() => TaskCardMapper.mapToDomain(params)).toThrowError(ValidationError);
		});
		it('should map params to domain', () => {
			const tomorrow = new Date(Date.now() + 86400000);
			const inTwoDays = new Date(Date.now() + 172800000);

			const cardElementTitle = new TitleCardElementParam();
			cardElementTitle.type = CardElementType.Title;
			cardElementTitle.value = 'title';

			const cardElementRichText = new RichTextCardElementParam();
			cardElementRichText.type = CardElementType.RichText;
			cardElementRichText.value = 'richtext';
			cardElementRichText.inputFormat = InputFormat.RICH_TEXT_CK5;

			const params = {
				cardElements: [
					{
						content: cardElementTitle,
					},
					{
						content: cardElementRichText,
					},
				],
				courseId: new ObjectId().toHexString(),
				visibleAtDate: tomorrow,
				dueDate: inTwoDays,
			};
			const result = TaskCardMapper.mapToDomain(params);

			const expectedDto = {
				title: 'title',
				text: [new RichText({ content: 'richtext', type: InputFormat.RICH_TEXT_CK5 })],
				courseId: params.courseId,
				visibleAtDate: tomorrow,
				dueDate: inTwoDays,
			};
			expect(result).toEqual(expectedDto);
		});
		it('should map update params to domain', () => {
			const tomorrow = new Date(Date.now() + 86400000);
			const inTwoDays = new Date(Date.now() + 172800000);

			const cardElementTitle = new TitleCardElementParam();
			cardElementTitle.type = CardElementType.Title;
			cardElementTitle.value = 'update title';

			const cardElementRichText1 = new RichTextCardElementParam();
			cardElementRichText1.type = CardElementType.RichText;
			cardElementRichText1.value = 'update richtext 1';
			cardElementRichText1.inputFormat = InputFormat.RICH_TEXT_CK5;

			const cardElementRichText2 = new RichTextCardElementParam();
			cardElementRichText2.type = CardElementType.RichText;
			cardElementRichText2.value = 'update richtext 2';
			cardElementRichText2.inputFormat = InputFormat.RICH_TEXT_CK5;

			const params = {
				cardElements: [
					{
						content: cardElementTitle,
					},
					{
						content: cardElementRichText1,
					},
					{
						content: cardElementRichText2,
					},
				],
				visibleAtDate: tomorrow,
				dueDate: inTwoDays,
			};
			const result = TaskCardMapper.mapToDomain(params);

			const expectedDto = {
				title: 'update title',
				text: [
					new RichText({ content: 'update richtext 1', type: InputFormat.RICH_TEXT_CK5 }),
					new RichText({ content: 'update richtext 2', type: InputFormat.RICH_TEXT_CK5 }),
				],
				visibleAtDate: tomorrow,
				dueDate: inTwoDays,
			};
			expect(result).toEqual(expectedDto);
		});
	});
});
