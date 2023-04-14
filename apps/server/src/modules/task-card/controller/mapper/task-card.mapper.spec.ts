import { ObjectId } from '@mikro-orm/mongodb';
import {
	CardElementResponse,
	CardElementType,
	CardRichTextElementResponse,
	InputFormat,
	RichText,
	RichTextCardElement,
	TaskWithStatusVo,
} from '@shared/domain';
import {
	courseFactory,
	richTextCardElementFactory,
	setupEntities,
	taskCardFactory,
	userFactory,
} from '@shared/testing';
import { RichTextCardElementParam } from '@src/modules/task-card/controller/dto';
import { TaskMapper } from '@src/modules/task/mapper';
import { TaskCardMapper } from './task-card.mapper';

describe('task-card mapper', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('mapToResponse', () => {
		it('should map task-card to response', () => {
			const user = userFactory.buildWithId();
			const completedUser = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const tomorrow = new Date(Date.now() + 86400000);
			const inTwoDays = new Date(Date.now() + 172800000);

			const taskCard = taskCardFactory.buildWithId({
				creator: user,
				course,
				visibleAtDate: tomorrow,
				dueDate: inTwoDays,
				completedUserIds: [completedUser],
			});
			const status = taskCard.task.createTeacherStatusForUser(user);

			const taskWithStatusVo = new TaskWithStatusVo(taskCard.task, status);
			const taskResponse = TaskMapper.mapToResponse(taskWithStatusVo);

			const mapper = new TaskCardMapper();
			const result = mapper.mapToResponse(taskCard, taskWithStatusVo);

			expect(result).toEqual({
				title: taskCard.title,
				id: taskCard.id,
				draggable: true,
				courseId: course.id,
				courseName: course.name,
				task: taskResponse,
				visibleAtDate: tomorrow,
				dueDate: inTwoDays,
				completedBy: [completedUser.id],
			});
		});
		it('should map card elements to response', () => {
			const user = userFactory.buildWithId();
			const richTextCardElement: RichTextCardElement = richTextCardElementFactory.buildWithId();

			const richtTextCardElementResponse: CardElementResponse = {
				id: richTextCardElement.id,
				cardElementType: CardElementType.RichText,
				content: new CardRichTextElementResponse(richTextCardElement),
			};

			const taskCard = taskCardFactory.buildWithId({
				creator: user,
				cardElements: [richTextCardElement],
			});

			const status = taskCard.task.createTeacherStatusForUser(user);
			const taskWithStatusVo = new TaskWithStatusVo(taskCard.task, status);

			const mapper = new TaskCardMapper();
			const result = mapper.mapToResponse(taskCard, taskWithStatusVo);

			expect(result.cardElements ? result.cardElements[0] : '').toEqual(
				expect.objectContaining({ ...richtTextCardElementResponse })
			);
		});
	});

	describe('mapToDomain', () => {
		it('should map params to domain', () => {
			const tomorrow = new Date(Date.now() + 86400000);
			const inTwoDays = new Date(Date.now() + 172800000);

			const cardElementRichText = new RichTextCardElementParam();
			cardElementRichText.type = CardElementType.RichText;
			cardElementRichText.value = 'richtext';
			cardElementRichText.inputFormat = InputFormat.RICH_TEXT_CK5;

			const params = {
				cardElements: [
					{
						content: cardElementRichText,
					},
				],
				courseId: new ObjectId().toHexString(),
				visibleAtDate: tomorrow,
				dueDate: inTwoDays,
				title: 'test-title',
			};
			const result = TaskCardMapper.mapToDomain(params);

			const expectedDto = {
				title: 'test-title',
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
			const courseId = new ObjectId().toHexString();

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
						content: cardElementRichText1,
					},
					{
						content: cardElementRichText2,
					},
				],
				visibleAtDate: tomorrow,
				dueDate: inTwoDays,
				title: 'update title',
				courseId,
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
				courseId,
			};
			expect(result).toEqual(expectedDto);
		});
		it('should should throw an error if title is empty', () => {
			const tomorrow = new Date(Date.now() + 86400000);
			const inTwoDays = new Date(Date.now() + 172800000);

			const cardElementRichText = new RichTextCardElementParam();
			cardElementRichText.type = CardElementType.RichText;
			cardElementRichText.value = 'richtext';
			cardElementRichText.inputFormat = InputFormat.RICH_TEXT_CK5;

			const params = {
				cardElements: [
					{
						content: cardElementRichText,
					},
				],
				courseId: new ObjectId().toHexString(),
				visibleAtDate: tomorrow,
				dueDate: inTwoDays,
				title: '',
			};
			expect(() => TaskCardMapper.mapToDomain(params)).toThrowError();
		});
		it('should throw an error if courseId is empty', () => {
			const tomorrow = new Date(Date.now() + 86400000);
			const inTwoDays = new Date(Date.now() + 172800000);

			const cardElementRichText = new RichTextCardElementParam();
			cardElementRichText.type = CardElementType.RichText;
			cardElementRichText.value = 'richtext';
			cardElementRichText.inputFormat = InputFormat.RICH_TEXT_CK5;

			const params = {
				cardElements: [
					{
						content: cardElementRichText,
					},
				],
				courseId: '',
				visibleAtDate: tomorrow,
				dueDate: inTwoDays,
				title: 'test-title',
			};
			expect(() => TaskCardMapper.mapToDomain(params)).toThrowError();
		});
		it('should not have a text property if cardElements are missing', () => {
			const tomorrow = new Date(Date.now() + 86400000);
			const inTwoDays = new Date(Date.now() + 172800000);

			const params = {
				courseId: new ObjectId().toHexString(),
				visibleAtDate: tomorrow,
				dueDate: inTwoDays,
				title: 'test-title',
			};
			const result = TaskCardMapper.mapToDomain(params);

			expect(result.text).toBeUndefined();
		});
	});
});
