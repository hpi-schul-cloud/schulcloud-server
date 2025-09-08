import { faker } from '@faker-js/faker';
import {
	MaterialResponse,
	LessonContentResponse,
	LessonResponse,
	LessonLinkedTaskResponse,
	LessonLinkedTaskResponseDescriptionInputFormatEnum,
	ComponentEtherpadPropsImpl,
	ComponentGeogebraPropsImpl,
	ComponentInternalPropsImpl,
	ComponentTextPropsImpl,
	ComponentLernstorePropsImpl,
	LessonContentResponseComponentEnum,
} from '../lessons-api-client';
import { LessonDtoMapper } from './lesson-dto.mapper';
import { LessonDto } from '../dto';
import { ComponentGeogebraPropsDto } from '../dto/component-geogebra-props.dto';
import { ComponentTextPropsDto } from '../dto/component-text-props.dto';
import { ComponentInternalPropsDto } from '../dto/component-internal-props.dto';
import { ComponentLernstorePropsDto } from '../dto/component-lernstore-props.dto';

describe('LessonDtoMapper', () => {
	describe('mapToLessonDto', () => {
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

		describe('when mapping LessonResponse to lesson DTO with etherpad contnet', () => {
			const setup = () => {
				const lessonContentResponse: LessonContentResponse = {
					content: { title: faker.lorem.sentence() } as ComponentEtherpadPropsImpl,
					_id: faker.string.uuid(),
					id: faker.string.uuid(),
					title: faker.lorem.sentence(),
					component: faker.helpers.arrayElement(['Etherpad']),
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

				return { lessonResponse, lessonContentResponse };
			};

			it('should return LessonDto with etherpad content', () => {
				const { lessonResponse } = setup();

				const result = LessonDtoMapper.mapToLessonDto(lessonResponse);

				expect(result).toBeInstanceOf(LessonDto);
			});
		});

		describe('when mapping LessonResponse to lesson DTO with GeoGebra content', () => {
			const setup = () => {
				const lessonContentResponse: LessonContentResponse = {
					content: { materialId: faker.string.uuid() } as ComponentGeogebraPropsImpl,
					_id: faker.string.uuid(),
					id: faker.string.uuid(),
					title: faker.lorem.sentence(),
					component: faker.helpers.arrayElement(['geoGebra']),
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

				return { lessonResponse, lessonContentResponse };
			};

			it('should return LessonDto with GeoGebra content', () => {
				const { lessonResponse } = setup();

				const result = LessonDtoMapper.mapToLessonDto(lessonResponse);

				expect(result).toBeInstanceOf(LessonDto);
				expect(result.contents[0].component).toEqual('geoGebra');
				expect(result.contents[0].content).toBeInstanceOf(ComponentGeogebraPropsDto);
			});
		});

		describe('when mapping LessonResponse to lesson DTO with Text content', () => {
			const setup = () => {
				const lessonContentResponse: LessonContentResponse = {
					content: { text: faker.lorem.sentence() } as ComponentTextPropsImpl,
					_id: faker.string.uuid(),
					id: faker.string.uuid(),
					title: faker.lorem.sentence(),
					component: faker.helpers.arrayElement(['text']),
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

				return { lessonResponse, lessonContentResponse };
			};

			it('should return LessonDto with text content', () => {
				const { lessonResponse } = setup();

				const result = LessonDtoMapper.mapToLessonDto(lessonResponse);

				expect(result).toBeInstanceOf(LessonDto);
				expect(result.contents[0].component).toEqual('text');
				expect(result.contents[0].content).toBeInstanceOf(ComponentTextPropsDto);
			});
		});

		describe('when mapping LessonResponse to lesson DTO with internal content', () => {
			const setup = () => {
				const lessonContentResponse: LessonContentResponse = {
					content: { url: faker.internet.url() } as ComponentInternalPropsImpl,
					_id: faker.string.uuid(),
					id: faker.string.uuid(),
					title: faker.lorem.sentence(),
					component: faker.helpers.arrayElement(['internal']),
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

				return { lessonResponse, lessonContentResponse };
			};

			it('should return LessonDto with internal content', () => {
				const { lessonResponse } = setup();

				const result = LessonDtoMapper.mapToLessonDto(lessonResponse);

				expect(result).toBeInstanceOf(LessonDto);
				expect(result.contents[0].component).toEqual('internal');
				expect(result.contents[0].content).toBeInstanceOf(ComponentInternalPropsDto);
			});
		});

		describe('when mapping LessonResponse to lesson DTO with lernstore content', () => {
			const setup = () => {
				const lessonContentResponse: LessonContentResponse = {
					content: {
						resources: [{ url: faker.internet.url(), description: faker.lorem.text() }],
					} as ComponentLernstorePropsImpl,
					_id: faker.string.uuid(),
					id: faker.string.uuid(),
					title: faker.lorem.sentence(),
					component: faker.helpers.arrayElement(['resources']),
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

				return { lessonResponse, lessonContentResponse };
			};

			it('should return LessonDto with lernstore content', () => {
				const { lessonResponse } = setup();

				const result = LessonDtoMapper.mapToLessonDto(lessonResponse);

				expect(result).toBeInstanceOf(LessonDto);
				expect(result.contents[0].component).toEqual('resources');
				expect(result.contents[0].content).toBeInstanceOf(ComponentLernstorePropsDto);
			});
		});

		describe('when mapping LessonResponse to lesson DTO without lernstore content', () => {
			const setup = () => {
				const lessonContentResponse: LessonContentResponse = {
					content: undefined,
					_id: faker.string.uuid(),
					id: faker.string.uuid(),
					title: faker.lorem.sentence(),
					component: faker.helpers.arrayElement(['resources']),
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

				return { lessonResponse, lessonContentResponse };
			};

			it('should return LessonDto without lernstore content', () => {
				const { lessonResponse } = setup();

				const result = LessonDtoMapper.mapToLessonDto(lessonResponse);

				expect(result).toBeInstanceOf(LessonDto);
				expect(result.contents[0].component).toEqual('resources');
			});
		});

		describe('when mapping LessonResponse to lesson DTO with an empty content', () => {
			const setup = () => {
				const lessonContentResponse: LessonContentResponse = {
					content: {
						text: faker.lorem.text(),
					} as ComponentTextPropsImpl,
					_id: faker.string.uuid(),
					id: faker.string.uuid(),
					title: faker.lorem.sentence(),
					component: faker.helpers.arrayElement(['unknown']) as LessonContentResponseComponentEnum,
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
					materials: [],
				};

				return { lessonResponse };
			};
			it('should return an empty array of contents', () => {
				const { lessonResponse } = setup();

				const result = LessonDtoMapper.mapToLessonDto(lessonResponse);

				expect(result).toBeInstanceOf(LessonDto);
				expect(result.contents).toEqual([]);
			});
		});
	});

	describe('mapToLessonLinkedTaskDto', () => {
		describe('when mapping to LessonLinkedTaskResponse', () => {
			const setup = () => {
				const lessonLinkedTaskResponse: LessonLinkedTaskResponse = {
					name: faker.lorem.sentence(),
					description: faker.lorem.sentence(),
					descriptionInputFormat: LessonLinkedTaskResponseDescriptionInputFormatEnum.PlainText,
					availableDate: faker.date.recent().toString(),
					dueDate: faker.date.future().toString(),
					private: faker.datatype.boolean(),
					publicSubmissions: faker.datatype.boolean(),
					teamSubmissions: faker.datatype.boolean(),
					creator: faker.internet.email(),
					courseId: faker.string.uuid(),
					submissionIds: [faker.string.uuid()],
					finishedIds: [faker.string.uuid()],
				};

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
