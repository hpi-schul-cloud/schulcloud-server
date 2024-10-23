import { faker } from '@faker-js/faker';
import {
	MaterialResponse,
	LessonContentResponse,
	LessonResponse,
	LessonLinkedTaskResponse,
} from '../lessons-api-client';
import { LessonDtoMapper } from './lesson-dto.mapper';

describe('LessonDtoMapper', () => {
	describe('mapToLessonDto', () => {
		describe('when mapping to LessonResponse', () => {
			const setup = () => {
				const materialResponse: MaterialResponse = {
					_id: faker.string.uuid(),
					id: faker.string.uuid(),
					title: faker.lorem.sentence(),
					relatedResources: [faker.lorem.sentence()],
					url: faker.internet.url(),
					client: faker.lorem.sentence(),
					license: [faker.lorem.sentence()],
					merlinReference: faker.lorem.sentence(),
				};

				const lessonContentResponse: LessonContentResponse = {
					content: { text: faker.lorem.sentence() },
					_id: faker.string.uuid(),
					id: faker.string.uuid(),
					title: faker.lorem.sentence(),
					component: faker.helpers.arrayElement(['Etherpad', 'neXboard', 'geoGebra']),
					hidden: faker.datatype.boolean(),
				};

				const lessonResponse: LessonResponse = {
					_id: faker.string.uuid(),
					id: faker.string.uuid(),
					name: faker.lorem.sentence(),
					courseId: faker.string.uuid(),
					courseGroupId: faker.string.uuid(),
					hidden: faker.datatype.boolean(),
					position: faker.number.int(),
					contents: [lessonContentResponse],
					materials: [materialResponse],
				};

				return { lessonResponse };
			};
			it('should return LessonDto', () => {
				const { lessonResponse } = setup();

				const result = LessonDtoMapper.mapToLessonDto(lessonResponse);

				expect(result).toEqual({
					lessonId: lessonResponse.id,
					name: lessonResponse.name,
					courseId: lessonResponse.courseId,
					courseGroupId: lessonResponse.courseGroupId,
					hidden: lessonResponse.hidden,
					position: lessonResponse.position,
					contents: [
						{
							content: lessonResponse.contents[0].content,
							title: lessonResponse.contents[0].title,
							component: lessonResponse.contents[0].component,
							hidden: lessonResponse.contents[0].hidden,
						},
					],
					materials: [
						{
							materialsId: lessonResponse.materials[0].id,
							title: lessonResponse.materials[0].title,
							relatedResources: [lessonResponse.materials[0].relatedResources[0]],
							url: lessonResponse.materials[0].url,
							client: lessonResponse.materials[0].client,
							license: lessonResponse.materials[0].license,
							merlinReference: lessonResponse.materials[0].merlinReference,
						},
					],
				});
			});
		});
	});

	describe('mapToLessonLinkedTaskDto', () => {
		describe('when mapping to LessonLinkedTaskResponse', () => {
			const setup = () => {
				const lessonLinkedTaskResponse = {
					name: faker.lorem.sentence(),
					description: faker.lorem.sentence(),
					descriptionInputFormat: faker.lorem.sentence(),
					availableDate: faker.date.recent().toString(),
					dueDate: faker.date.future().toString(),
					private: faker.datatype.boolean(),
					publicSubmissions: faker.datatype.boolean(),
					teamSubmissions: faker.datatype.boolean(),
					creator: faker.internet.email(),
					courseId: faker.string.uuid(),
					submissionIds: [faker.string.uuid()],
					finishedIds: [faker.string.uuid()],
				} as LessonLinkedTaskResponse;

				return { lessonLinkedTaskResponse };
			};
			it('should return LessonLinkedTaskDto', () => {
				const { lessonLinkedTaskResponse } = setup();

				const result = LessonDtoMapper.mapToLessonLinkedTaskDto(lessonLinkedTaskResponse);

				expect(result).toEqual({
					name: lessonLinkedTaskResponse.name,
					description: lessonLinkedTaskResponse.description,
					descriptionInputFormat: lessonLinkedTaskResponse.descriptionInputFormat,
					availableDate: lessonLinkedTaskResponse.availableDate,
					dueDate: lessonLinkedTaskResponse.dueDate,
					private: lessonLinkedTaskResponse.private,
					publicSubmissions: lessonLinkedTaskResponse.publicSubmissions,
					teamSubmissions: lessonLinkedTaskResponse.teamSubmissions,
					creator: lessonLinkedTaskResponse.creator,
					courseId: lessonLinkedTaskResponse.courseId,
					submissionIds: lessonLinkedTaskResponse.submissionIds,
					finishedIds: lessonLinkedTaskResponse.finishedIds,
				});
			});
		});
	});
});
