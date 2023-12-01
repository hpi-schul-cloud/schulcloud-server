import { MikroORM } from '@mikro-orm/core';
import { ComponentProperties, ComponentType } from '@shared/domain';
import { courseFactory, lessonFactory, setupEntities, taskFactory } from '@shared/testing';
import {
	CommonCartridgeMetadataElementProps,
	CommonCartridgeOrganizationBuilderOptions,
	CommonCartridgeResourceProps,
	CommonCartridgeResourceType,
	OmitVersion,
} from '../common-cartridge';
import { CommonCartridgeMapper } from './common-cartridge.mapper';

describe('CommonCartridgeMapper', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('mapCourseToMetadata', () => {
		describe('when mapping course to metadata', () => {
			const course = courseFactory.buildWithId();

			it('should map to metadata', () => {
				const metadataProps = CommonCartridgeMapper.mapCourseToMetadata(course);

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
			const lesson = lessonFactory.buildWithId();

			it('should map to organization', () => {
				const organizationProps = CommonCartridgeMapper.mapLessonToOrganization(lesson);

				expect(organizationProps).toStrictEqual<OmitVersion<CommonCartridgeOrganizationBuilderOptions>>({
					identifier: lesson.id,
					title: lesson.name,
				});
			});
		});
	});

	describe('mapContentToOrganization', () => {
		describe('when mapping content to organization', () => {
			const componentProps: ComponentProperties = {
				_id: 'id',
				title: 'title',
				hidden: false,
				component: ComponentType.TEXT,
				content: {
					text: 'text',
				},
			};

			it('should map to organization', () => {
				const organizationProps = CommonCartridgeMapper.mapContentToOrganization(componentProps);

				expect(organizationProps).toStrictEqual<OmitVersion<CommonCartridgeOrganizationBuilderOptions>>({
					identifier: componentProps._id as string,
					title: componentProps.title,
				});
			});
		});
	});

	describe('mapTaskToResource', () => {
		describe('when mapping task', () => {
			const task = taskFactory.buildWithId();

			it('should map to web content', () => {
				const resourceProps = CommonCartridgeMapper.mapTaskToResource(task);

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
			const componentProps: ComponentProperties = {
				_id: 'id',
				title: 'title',
				hidden: false,
				component: ComponentType.TEXT,
				content: {
					text: 'text',
				},
			};

			it('should map to web content', () => {
				const resourceProps = CommonCartridgeMapper.mapContentToResources(componentProps);

				expect(resourceProps).toStrictEqual<CommonCartridgeResourceProps>({
					type: CommonCartridgeResourceType.WEB_CONTENT,
					identifier: componentProps._id as string,
					title: componentProps.title,
					html: `<h1>${componentProps.title}</h1><p>${componentProps?.content.text}</p>`,
				});
			});
		});

		describe('when mapping geogebra content', () => {
			const componentProps: ComponentProperties = {
				_id: 'id',
				title: 'title',
				hidden: false,
				component: ComponentType.GEOGEBRA,
				content: {
					materialId: 'material-id',
				},
			};

			it('should map to web link', () => {
				const resourceProps = CommonCartridgeMapper.mapContentToResources(componentProps);

				expect(resourceProps).toStrictEqual<CommonCartridgeResourceProps>({
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: componentProps._id as string,
					title: componentProps.title,
					url: `https://www.geogebra.org/m/${componentProps.content.materialId}`,
				});
			});
		});

		describe('when mapping etherpad content', () => {
			const componentProps: ComponentProperties = {
				_id: 'id',
				title: 'title',
				hidden: false,
				component: ComponentType.ETHERPAD,
				content: {
					description: 'description',
					title: 'title',
					url: 'url',
				},
			};

			it('should map to web link', () => {
				const resourceProps = CommonCartridgeMapper.mapContentToResources(componentProps);

				expect(resourceProps).toStrictEqual<CommonCartridgeResourceProps>({
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: componentProps._id as string,
					title: `${componentProps.content.title} - ${componentProps.content.description}`,
					url: componentProps.content.url,
				});
			});
		});

		describe('when mapping learning store content to resources', () => {
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

			it('should map to web link', () => {
				const resourceProps = CommonCartridgeMapper.mapContentToResources(componentProps);

				expect(resourceProps).toStrictEqual<CommonCartridgeResourceProps[]>([
					{
						type: CommonCartridgeResourceType.WEB_LINK,
						identifier: componentProps._id as string,
						title: componentProps.content?.resources[0].description as string,
						url: componentProps.content?.resources[0].url as string,
					},
				]);
			});
		});
	});
});
