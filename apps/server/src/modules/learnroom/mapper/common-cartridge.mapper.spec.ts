import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import {
	CommonCartridgeElementProps,
	CommonCartridgeElementType,
	CommonCartridgeFileBuilderProps,
	CommonCartridgeIntendedUseType,
	CommonCartridgeOrganizationBuilderOptions,
	CommonCartridgeResourceProps,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
	OmitVersion,
	createIdentifier,
} from '@modules/common-cartridge';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ComponentProperties, ComponentType } from '@shared/domain/entity';
import { courseFactory, lessonFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';
import { LearnroomConfig } from '../learnroom.config';
import { CommonCartridgeMapper } from './common-cartridge.mapper';

describe('CommonCartridgeMapper', () => {
	let module: TestingModule;
	let sut: CommonCartridgeMapper;
	let configServiceMock: DeepMocked<ConfigService<LearnroomConfig, true>>;

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeMapper,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<LearnroomConfig, true>>(),
				},
			],
		}).compile();
		sut = module.get(CommonCartridgeMapper);
		configServiceMock = module.get(ConfigService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('mapCourseToMetadata', () => {
		describe('when mapping course to metadata', () => {
			const setup = () => {
				const course = courseFactory.buildWithId({
					teachers: userFactory.buildListWithId(2),
				});

				configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());

				return { course };
			};

			it('should map to metadata', () => {
				const { course } = setup();
				const metadataProps = sut.mapCourseToMetadata(course);

				expect(metadataProps).toStrictEqual<CommonCartridgeElementProps>({
					type: CommonCartridgeElementType.METADATA,
					title: course.name,
					copyrightOwners: course.teachers.toArray().map((teacher) => `${teacher.firstName} ${teacher.lastName}`),
					creationDate: course.createdAt,
				});
			});
		});
	});

	describe('mapLessonToOrganization', () => {
		describe('when mapping lesson to organization', () => {
			const setup = () => {
				const lesson = lessonFactory.buildWithId();

				configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());

				return { lesson };
			};

			it('should map to organization', () => {
				const { lesson } = setup();
				const organizationProps = sut.mapLessonToOrganization(lesson);

				expect(organizationProps).toStrictEqual<OmitVersion<CommonCartridgeOrganizationBuilderOptions>>({
					identifier: createIdentifier(lesson.id),
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

				configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());

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
		const setup = () => {
			const task = taskFactory.buildWithId();

			configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());

			return { task };
		};

		describe('when mapping task with version 1.3.0', () => {
			it('should map task to web content', () => {
				const { task } = setup();
				const resourceProps = sut.mapTaskToResource(task, CommonCartridgeVersion.V_1_3_0);

				expect(resourceProps).toStrictEqual<CommonCartridgeResourceProps>({
					type: CommonCartridgeResourceType.WEB_CONTENT,
					identifier: createIdentifier(task.id),
					title: task.name,
					html: `<h1>${task.name}</h1><p>${task.description}</p>`,
					intendedUse: CommonCartridgeIntendedUseType.ASSIGNMENT,
				});
			});
		});

		describe('when using other version than 1.3.0', () => {
			it('should map to web content', () => {
				const { task } = setup();
				const versions = [
					CommonCartridgeVersion.V_1_0_0,
					CommonCartridgeVersion.V_1_1_0,
					CommonCartridgeVersion.V_1_2_0,
					CommonCartridgeVersion.V_1_4_0,
				];

				versions.forEach((version) => {
					const resourceProps = sut.mapTaskToResource(task, version);

					expect(resourceProps).toStrictEqual<CommonCartridgeResourceProps>({
						type: CommonCartridgeResourceType.WEB_CONTENT,
						identifier: createIdentifier(task.id),
						title: task.name,
						html: `<h1>${task.name}</h1><p>${task.description}</p>`,
						intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
					});
				});
			});
		});
	});

	describe('mapTaskToOrganization', () => {
		describe('when mapping task', () => {
			const setup = () => {
				const task = taskFactory.buildWithId();

				configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());

				return { task };
			};

			it('should map to organization', () => {
				const { task } = setup();
				const organizationProps = sut.mapTaskToOrganization(task);

				expect(organizationProps).toStrictEqual<OmitVersion<CommonCartridgeOrganizationBuilderOptions>>({
					identifier: expect.any(String),
					title: task.name,
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

				configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());

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
					intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
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

				configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());

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

				configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());

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

		describe('when mapping learn store content to resources', () => {
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

				configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());

				return { componentProps };
			};

			it('should map to web link', () => {
				const { componentProps } = setup();
				const resourceProps = sut.mapContentToResources(componentProps);

				expect(resourceProps).toStrictEqual<CommonCartridgeResourceProps[]>([
					{
						type: CommonCartridgeResourceType.WEB_LINK,
						identifier: expect.any(String),
						title: componentProps.content?.resources[0].title as string,
						url: componentProps.content?.resources[0].url as string,
					},
				]);
			});
		});

		describe('when no learn store content is provided', () => {
			// AI next 16 lines
			const setup = () => {
				const componentProps: ComponentProperties = {
					_id: 'id',
					title: 'title',
					hidden: false,
					component: ComponentType.LERNSTORE,
				};

				configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());

				return { componentProps };
			};

			it('should map to empty array', () => {
				const { componentProps } = setup();
				const resourceProps = sut.mapContentToResources(componentProps);

				expect(resourceProps).toEqual([]);
			});
		});

		describe('when mapping unknown content', () => {
			const setup = () => {
				const unknownComponentProps: ComponentProperties = {
					title: 'title',
					hidden: false,
					component: ComponentType.INTERNAL,
					content: {
						url: 'url',
					},
				};

				configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());

				return { unknownComponentProps };
			};

			it('should map to empty array', () => {
				const { unknownComponentProps } = setup();
				const resourceProps = sut.mapContentToResources(unknownComponentProps);

				expect(resourceProps).toEqual([]);
			});
		});
	});

	describe('mapCourseToManifest', () => {
		describe('when mapping course', () => {
			const setup = () => {
				const course = courseFactory.buildWithId();
				const version = CommonCartridgeVersion.V_1_1_0;

				configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());

				return { course, version };
			};

			it('should map to manifest', () => {
				const { course, version } = setup();
				const fileBuilderProps = sut.mapCourseToManifest(version, course);

				expect(fileBuilderProps).toStrictEqual<CommonCartridgeFileBuilderProps>({
					version: CommonCartridgeVersion.V_1_1_0,
					identifier: createIdentifier(course.id),
				});
			});
		});
	});
});
