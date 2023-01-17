import { MikroORM } from '@mikro-orm/core';
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
			const tomorrow = new Date(Date.now() + 86400000);
			const taskCard = taskCardFactory.dueInOneDay().buildWithId({ creator: user });
			const status = taskCard.task.createTeacherStatusForUser(user);

			const taskWithStatusVo = new TaskWithStatusVo(taskCard.task, status);
			const taskResponse = TaskMapper.mapToResponse(taskWithStatusVo);

			const mapper = new TaskCardMapper();
			const result = mapper.mapToResponse(taskCard, taskWithStatusVo);

			expect(result).toEqual({
				id: taskCard.id,
				draggable: true,
				cardElements: [],
				task: taskResponse,
				completionDate: tomorrow,
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

	describe('mapCreateToDomain', () => {
		it('should map create to domain', () => {
			const tomorrow = new Date(Date.now() + 86400000);
			const params = {
				title: 'test title',
				text: ['rich text 1', 'rich text 2'],
				completionDate: tomorrow,
			};
			const result = TaskCardMapper.mapCreateToDomain(params);
			const expectedDto = {
				title: params.title,
				text: [
					new RichText({ content: 'rich text 1', type: InputFormat.RICH_TEXT_CK5 }),
					new RichText({ content: 'rich text 2', type: InputFormat.RICH_TEXT_CK5 }),
				],
				completionDate: tomorrow,
			};
			expect(result).toEqual(expectedDto);
		});
	});

	describe('mapUpdateToDomain', () => {
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
			expect(() => TaskCardMapper.mapUpdateToDomain(params)).toThrowError(ValidationError);
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
			expect(() => TaskCardMapper.mapUpdateToDomain(params)).toThrowError(ValidationError);
		});
		it('should map update params to domain', () => {
			const tomorrow = new Date(Date.now() + 86400000);

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
				completionDate: tomorrow,
			};
			const result = TaskCardMapper.mapUpdateToDomain(params);

			const expectedDto = {
				title: 'update title',
				text: [
					new RichText({ content: 'update richtext 1', type: InputFormat.RICH_TEXT_CK5 }),
					new RichText({ content: 'update richtext 2', type: InputFormat.RICH_TEXT_CK5 }),
				],
				completionDate: tomorrow,
			};
			expect(result).toEqual(expectedDto);
		});
	});
});
