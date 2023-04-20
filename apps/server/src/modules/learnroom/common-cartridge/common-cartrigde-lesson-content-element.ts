import {
	IComponentTextProperties,
	IComponentGeogebraProperties,
	IComponentLernstoreProperties,
	IComponentEtherpadProperties,
	IComponentInternalProperties,
	IComponentNexboardProperties,
} from '@src/shared/domain/entity/lesson.entity';

export type ICommonCartridgeLessonContentProps = {
	title?: string;
	content?:
		| IComponentTextProperties
		| IComponentGeogebraProperties
		| IComponentLernstoreProperties
		| IComponentEtherpadProperties
		| IComponentInternalProperties
		| IComponentNexboardProperties;
};
