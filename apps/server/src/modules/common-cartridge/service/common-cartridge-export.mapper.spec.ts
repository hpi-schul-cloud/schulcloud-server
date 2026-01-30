import { faker } from '@faker-js/faker';
import { FileDto, FileRecordParentType } from '@modules/files-storage-client';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import {
	LessonContentDtoComponent,
	LessonContentDtoComponentValues,
} from '../common-cartridge-client/lesson-client/dto';
import { ComponentEtherpadPropsDto } from '../common-cartridge-client/lesson-client/dto/component-etherpad-props.dto';
import { ComponentGeogebraPropsDto } from '../common-cartridge-client/lesson-client/dto/component-geogebra-props.dto';
import { ComponentLernstorePropsDto } from '../common-cartridge-client/lesson-client/dto/component-lernstore-props.dto';
import { LessonContentResponseContentInnerDto } from '../common-cartridge-client/lesson-client/dto/lesson-content-response-inner.dto';
import {
	CommonCartridgeElementType,
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../export/common-cartridge.enums';
import { CommonCartridgeResourceProps } from '../export/resources/common-cartridge-resource-factory';
import { createIdentifier } from '../export/utils';
import {
	boardTaskFactory,
	courseMetadataFactory,
	lessonContentFactory,
	lessonFactory,
	lessonLinkedTaskFactory,
} from '../testing/common-cartridge-dtos.factory';
import { linkElementFactory } from '../testing/link-element.factory';
import { richTextElementFactroy } from '../testing/rich-text-element.factory';
import { CommonCartridgeExportMapper } from './common-cartridge-export.mapper';

const GEOGEBRA_BASE_URL = 'https://geogebra.org';

describe('CommonCartridgeExportMapper', () => {
	let module: TestingModule;
	let sut: CommonCartridgeExportMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [CommonCartridgeExportMapper],
		}).compile();

		sut = module.get(CommonCartridgeExportMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('mapCourseToManifest', () => {
		const setup = () => {
			const courseId = faker.string.uuid();
			const version = CommonCartridgeVersion.V_1_1_0;
			return { courseId, version };
		};

		describe('when mapping course to manifest', () => {
			const { courseId, version } = setup();
			it('should map course to manifest', () => {
				const result = sut.mapCourseToManifest(version, courseId);

				expect(result).toEqual({
					version,
					identifier: createIdentifier(courseId),
				});
			});
		});
	});

	describe('mapCourseToMetadata', () => {
		const setup = () => {
			const courseMetadata = courseMetadataFactory.build();
			return { courseMetadata };
		};

		describe('when mapping metadata of a course to DTO', () => {
			const { courseMetadata } = setup();
			it('should map metadata to a CourseCommonCartridgeMetadataDto', () => {
				const result = sut.mapCourseToMetadata(courseMetadata);

				expect(result).toEqual({
					type: CommonCartridgeElementType.METADATA,
					title: courseMetadata.title,
					copyrightOwners: courseMetadata.copyRightOwners,
					creationDate: courseMetadata.creationDate ? new Date(courseMetadata.creationDate) : new Date(),
				});
			});
		});
	});

	describe('mapLessonToOrganization', () => {
		const setup = () => {
			const lesson = lessonFactory.build();

			return { lesson };
		};

		describe('when mapping lesson to organization', () => {
			const { lesson } = setup();

			it('should map lesson identifier and title to organization', () => {
				const result = sut.mapLessonToOrganization(lesson);

				expect(result).toEqual({
					identifier: createIdentifier(lesson.lessonId),
					title: lesson.name,
				});
			});
		});
	});

	describe('mapContentToResources', () => {
		describe('when lesson content is GeoGebra', () => {
			const setup = () => {
				const lessonContent = lessonContentFactory.build();
				lessonContent.component = LessonContentDtoComponentValues.GEO_GEBRA;
				lessonContent.content = {
					materialId: faker.string.uuid(),
				};
				return { lessonContent };
			};

			it('should map lesson content to GeoGebra resources', () => {
				const { lessonContent } = setup();
				const result = sut.mapContentToResources(lessonContent);

				expect(result).toEqual({
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: `i${lessonContent.id ?? ''}`,
					title: lessonContent.title,
					url: `${GEOGEBRA_BASE_URL}/m/${(lessonContent.content as ComponentGeogebraPropsDto).materialId}`,
				});
			});
		});

		describe('when lesson content is Etherpad', () => {
			const setup = () => {
				const lessonContent = lessonContentFactory.build();
				lessonContent.component = LessonContentDtoComponentValues.ETHERPAD;
				lessonContent.content = {
					description: faker.lorem.sentence(),
					title: faker.lorem.sentence(),
					url: faker.internet.url(),
				};
				return { lessonContent };
			};

			it('should map lesson content to Etherpad resources', () => {
				const { lessonContent } = setup();
				const result = sut.mapContentToResources(lessonContent);

				expect(result).toEqual({
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: `i${lessonContent.id ?? ''}`,
					title: `${lessonContent.title} - ${(lessonContent.content as ComponentEtherpadPropsDto).description}`,
					url: (lessonContent.content as ComponentEtherpadPropsDto).url,
				});
			});
		});

		describe('when lesson content is Lernstore', () => {
			const setup = () => {
				const lessonContent = lessonContentFactory.build();
				lessonContent.component = LessonContentDtoComponentValues.RESOURCES;
				lessonContent.content = {
					resources: [
						{
							url: faker.internet.url(),
							title: faker.lorem.sentence(),
							client: faker.company.name(),
							description: faker.lorem.sentence(),
						},
						{
							url: faker.internet.url(),
							title: faker.lorem.sentence(),
							client: faker.company.name(),
							description: faker.lorem.sentence(),
						},
					],
				};
				return { lessonContent };
			};

			it('should map lesson content to Lernstore resources', () => {
				const { lessonContent } = setup();
				const result = sut.mapContentToResources(lessonContent);

				expect(result[0]).toEqual({
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: `i${lessonContent.id ?? ''}`,
					title: (lessonContent.content as ComponentLernstorePropsDto).resources[0].title,
					url: (lessonContent.content as ComponentLernstorePropsDto).resources[0].url,
				});
				expect(result[1]).toEqual({
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: `i${lessonContent.id ?? ''}`,
					title: (lessonContent.content as ComponentLernstorePropsDto).resources[1].title,
					url: (lessonContent.content as ComponentLernstorePropsDto).resources[1].url,
				});
			});
		});

		describe('when lesson has no content', () => {
			const setup = () => {
				const lessonContent = lessonContentFactory.build();
				lessonContent.content = {} as unknown as LessonContentResponseContentInnerDto;
				lessonContent.component = {} as unknown as LessonContentDtoComponent;

				return { lessonContent };
			};

			it('should return an empty array of contents', () => {
				const { lessonContent } = setup();
				const result = sut.mapContentToResources(lessonContent);

				expect(result).toBeInstanceOf(Array);
			});
		});
	});

	describe('mapContentToOrganization', () => {
		const setup = () => {
			const lessonContent = lessonContentFactory.build();
			return { lessonContent };
		};
		describe('when mapping lesson to organization', () => {
			it('should map lesson identifier and title to organization', () => {
				const { lessonContent } = setup();
				const result = sut.mapContentToOrganization(lessonContent);

				expect(result).toEqual({
					identifier: `i${lessonContent.id ?? ''}`,
					title: lessonContent.title,
				});
			});
		});
	});

	describe('mapTaskToResources', () => {
		const setup = () => {
			const task = boardTaskFactory.build();

			return { task };
		};

		describe('when mapping task to resources with version 1.1.0', () => {
			const { task } = setup();
			it('should map task to resources with version 1.1.0', () => {
				const result = sut.mapTaskToResource(task, CommonCartridgeVersion.V_1_1_0);

				expect(result).toEqual({
					identifier: `i${task.id}`,
					title: task.name,
					html: `<p>${task.description ?? ''}</p>`,
					intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
					type: CommonCartridgeResourceType.WEB_CONTENT,
				});
			});
		});

		describe('when mapping task to resources with version 1.3.0', () => {
			const { task } = setup();
			it('should map task to resources with version 1.3.0', () => {
				const result = sut.mapTaskToResource(task, CommonCartridgeVersion.V_1_3_0);

				expect(result).toEqual({
					identifier: `i${task.id}`,
					title: task.name,
					html: `<p>${task.description ?? ''}</p>`,
					intendedUse: CommonCartridgeIntendedUseType.ASSIGNMENT,
					type: CommonCartridgeResourceType.WEB_CONTENT,
				});
			});
		});

		describe('when mapping task to resources with not supported version', () => {
			const { task } = setup();
			it('should map task to resources with version 1.1.0 as default', () => {
				const result = sut.mapTaskToResource(task, CommonCartridgeVersion.V_1_4_0);

				expect(result).toEqual({
					identifier: `i${task.id}`,
					title: task.name,
					html: `<p>${task.description ?? ''}</p>`,
					intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
					type: CommonCartridgeResourceType.WEB_CONTENT,
				});
			});
		});
	});

	describe('mapLinkedTaskToResource', () => {
		const setup = () => {
			const linkedTask = lessonLinkedTaskFactory.build();

			return { linkedTask };
		};

		describe('when mapping linked task to resources with version 1.1.0', () => {
			const { linkedTask } = setup();
			it('should map linked task to resources with version 1.1.0', () => {
				const result = sut.mapLinkedTaskToResource(linkedTask, CommonCartridgeVersion.V_1_1_0);

				expect(result).toStrictEqual(
					expect.objectContaining({
						type: CommonCartridgeResourceType.WEB_CONTENT,
						title: linkedTask.name,
						html: `<h1>${linkedTask.name}</h1><p>${linkedTask.description}</p>`,
						intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
					})
				);
			});
		});

		describe('when mapping linked task to resources with version 1.3.0', () => {
			const { linkedTask } = setup();
			it('should map linked task to resources with version 1.3.0', () => {
				const result = sut.mapLinkedTaskToResource(linkedTask, CommonCartridgeVersion.V_1_3_0);

				expect(result).toStrictEqual(
					expect.objectContaining({
						type: CommonCartridgeResourceType.WEB_CONTENT,
						title: linkedTask.name,
						html: `<h1>${linkedTask.name}</h1><p>${linkedTask.description}</p>`,
						intendedUse: CommonCartridgeIntendedUseType.ASSIGNMENT,
					})
				);
			});
		});

		describe('when mapping linked task to resources with not supported version', () => {
			const { linkedTask } = setup();
			it('should map linked task to resources with version 1.1.0 as default', () => {
				const result = sut.mapLinkedTaskToResource(linkedTask, CommonCartridgeVersion.V_1_4_0);

				expect(result).toStrictEqual(
					expect.objectContaining({
						type: CommonCartridgeResourceType.WEB_CONTENT,
						title: linkedTask.name,
						html: `<h1>${linkedTask.name}</h1><p>${linkedTask.description}</p>`,
						intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
					})
				);
			});
		});
	});

	describe('mapRichTextElementToResource', () => {
		const setup = () => {
			const richTextElement = richTextElementFactroy.build();

			return { richTextElement };
		};

		describe('when mapping rich text element to resources', () => {
			const { richTextElement } = setup();
			it('should map rich text element to resources', () => {
				const result = sut.mapRichTextElementToResource(richTextElement);

				expect(result).toEqual({
					type: CommonCartridgeResourceType.WEB_CONTENT,
					identifier: createIdentifier(richTextElement.id),
					title: richTextElement.content.text,
					html: `<p>${richTextElement.content.text}</p>`,
					intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
				});
			});
		});
	});

	describe('mapLinkElementToResource', () => {
		const setup = () => {
			const linkElement = linkElementFactory.build();

			return { linkElement };
		};

		describe('when mapping link element to resources', () => {
			const { linkElement } = setup();
			it('should map link element to resources', () => {
				const result = sut.mapLinkElementToResource(linkElement);

				expect(result).toEqual({
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: createIdentifier(linkElement.id),
					title: linkElement.content.title,
					url: linkElement.content.url,
				});
			});
		});
	});

	describe('mapFileToResource', () => {
		describe('when mapping file to resource', () => {
			const setup = () => {
				const file = Readable.from(faker.lorem.paragraphs(100));
				const fileRecord: FileDto = {
					id: faker.string.uuid(),
					name: 'file.zip',
					parentId: faker.string.uuid(),
					parentType: FileRecordParentType.Course,
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				return { file, fileRecord };
			};

			it('should return resource', () => {
				const { file, fileRecord } = setup();

				const result = sut.mapFileToResource(fileRecord, file);

				expect(result).toEqual<CommonCartridgeResourceProps>({
					type: CommonCartridgeResourceType.FILE,
					identifier: expect.any(String),
					title: fileRecord.name,
					fileName: fileRecord.name,
					file: file,
				});
			});
		});
	});
});
