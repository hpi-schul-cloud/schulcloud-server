import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ComponentProperties, ComponentType } from '@shared/domain';
import { courseFactory, lessonFactory, setupEntities, taskFactory } from '@shared/testing';
import {
	CommonCartridgeMetadataElementProps,
	CommonCartridgeOrganizationBuilderOptions,
	CommonCartridgeResourceProps,
	CommonCartridgeResourceType,
	OmitVersion,
} from '../common-cartridge';
import { LearnroomConfig } from '../learnroom.config';
import { CommonCartridgeMapper } from './common-cartridge.mapper';

describe('CommonCartridgeMapper', () => {
	let module: TestingModule;
	let sut: CommonCartridgeMapper;
	let orm: MikroORM;
	let configServiceMock: DeepMocked<ConfigService<LearnroomConfig, true>>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeMapper,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<LearnroomConfig, true>>(),
				},
			],
		}).compile();
		orm = await setupEntities();
		sut = module.get(CommonCartridgeMapper);
		configServiceMock = module.get(ConfigService);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('mapCourseToMetadata', () => {
		describe('when mapping course to metadata', () => {
			const setup = () => {
				const course = courseFactory.buildWithId();

				configServiceMock.getOrThrow.mockReturnValue('https://example.com');

				return { course };
			};

			it('should map to metadata', () => {
				const { course } = setup();
				const metadataProps = sut.mapCourseToMetadata(course);

				expect(metadataProps).toStrictEqual<OmitVersion<CommonCartridgeMetadataElementProps>>({
					title: course.name,
					copyrightOwners: course.teachers
						.toArray()
						.map((teacher) => `${teacher.firstName} ${teacher.lastName}`),
					creationDate: course.createdAt,
				});
			});
		});
	});

	describe('mapLessonToOrganization', () => {
		describe('when mapping lesson to organization', () => {
			const setup = () => {
				const lesson = lessonFactory.buildWithId();

				configServiceMock.getOrThrow.mockReturnValue('https://example.com');

				return { lesson };
			};

			it('should map to organization', () => {
				const { lesson } = setup();
				const organizationProps = sut.mapLessonToOrganization(lesson);

				expect(organizationProps).toStrictEqual<OmitVersion<CommonCartridgeOrganizationBuilderOptions>>({
					identifier: lesson.id,
					title: lesson.name,
				});
			});
		});
	});

	describe('mapContentToOrganization', () => {
		describe('when mapping content to organization', () => {
			const setup = () => {
				const componentProps: ComponentProperties = {
					title: 'title',
					hidden: false,
					component: ComponentType.TEXT,
					content: {
						text: 'text',
					},
				};

				configServiceMock.getOrThrow.mockReturnValue('https://example.com');

				return { componentProps };
			};

			it('should map to organization', () => {
				const { componentProps } = setup();
				const organizationProps = sut.mapContentToOrganization(componentProps);

				expect(organizationProps).toStrictEqual<OmitVersion<CommonCartridgeOrganizationBuilderOptions>>({
					identifier: expect.any(String),
					title: componentProps.title,
				});
			});
		});
	});

	describe('mapTaskToResource', () => {
		describe('when mapping task', () => {
			const setup = () => {
				const task = taskFactory.buildWithId();

				configServiceMock.getOrThrow.mockReturnValue('https://example.com');

				return { task };
			};

			it('should map to web content', () => {
				const { task } = setup();
				const resourceProps = sut.mapTaskToResource(task);

				expect(resourceProps).toStrictEqual<CommonCartridgeResourceProps>({
					type: CommonCartridgeResourceType.WEB_CONTENT,
					identifier: task.id,
					title: task.name,
					html: `<h1>${task.name}</h1><p>${task.description}</p>`,
				});
			});
		});
	});

	describe('mapContentToResources', () => {
		describe('when mapping text content', () => {
			const setup = () => {
				const componentProps: ComponentProperties = {
					title: 'title',
					hidden: false,
					component: ComponentType.TEXT,
					content: {
						text: 'text',
					},
				};

				configServiceMock.getOrThrow.mockReturnValue('https://example.com');

				return { componentProps };
			};

			it('should map to web content', () => {
				const { componentProps } = setup();
				const resourceProps = sut.mapContentToResources(componentProps);

				expect(resourceProps).toStrictEqual<CommonCartridgeResourceProps>({
					type: CommonCartridgeResourceType.WEB_CONTENT,
					identifier: expect.any(String),
					title: componentProps.title,
					html: `<h1>${componentProps.title}</h1><p>${componentProps?.content.text}</p>`,
				});
			});
		});

		describe('when mapping geogebra content', () => {
			const setup = () => {
				const componentProps: ComponentProperties = {
					title: 'title',
					hidden: false,
					component: ComponentType.GEOGEBRA,
					content: {
						materialId: 'material-id',
					},
				};

				configServiceMock.getOrThrow.mockReturnValue('https://example.com');

				return { componentProps };
			};

			it('should map to web link', () => {
				const { componentProps } = setup();
				const resourceProps = sut.mapContentToResources(componentProps);

				expect(resourceProps).toStrictEqual<CommonCartridgeResourceProps>({
					type: CommonCartridgeResourceType.WEB_LINK,
					title: componentProps.title,
					identifier: expect.any(String),
					url: `${configServiceMock.getOrThrow<string>('FEATURE_COMMON_CARTRIDGE_COURSE_EXPORT_ENABLED')}/m/${
						componentProps.content.materialId
					}`,
				});
			});
		});

		describe('when mapping etherpad content', () => {
			const setup = () => {
				const componentProps: ComponentProperties = {
					title: 'title',
					hidden: false,
					component: ComponentType.ETHERPAD,
					content: {
						description: 'description',
						title: 'title',
						url: 'url',
					},
				};

				configServiceMock.getOrThrow.mockReturnValue('https://example.com');

				return { componentProps };
			};

			it('should map to web link', () => {
				const { componentProps } = setup();
				const resourceProps = sut.mapContentToResources(componentProps);

				expect(resourceProps).toStrictEqual<CommonCartridgeResourceProps>({
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: expect.any(String),
					title: `${componentProps.content.title} - ${componentProps.content.description}`,
					url: componentProps.content.url,
				});
			});
		});

		describe('when mapping learning store content to resources', () => {
			const setup = () => {
				const componentProps: ComponentProperties = {
					_id: 'id',
					title: 'title',
					hidden: false,
					component: ComponentType.LERNSTORE,
					content: {
						resources: [
							{
								client: 'client',
								description: 'description',
								title: 'title',
								url: 'url',
							},
						],
					},
				};

				configServiceMock.getOrThrow.mockReturnValue('https://example.com');

				return { componentProps };
			};

			it('should map to web link', () => {
				const { componentProps } = setup();
				const resourceProps = sut.mapContentToResources(componentProps);

				expect(resourceProps).toStrictEqual<CommonCartridgeResourceProps[]>([
					{
						type: CommonCartridgeResourceType.WEB_LINK,
						identifier: expect.any(String),
						title: componentProps.content?.resources[0].description as string,
						url: componentProps.content?.resources[0].url as string,
					},
				]);
			});
		});
	});
});
