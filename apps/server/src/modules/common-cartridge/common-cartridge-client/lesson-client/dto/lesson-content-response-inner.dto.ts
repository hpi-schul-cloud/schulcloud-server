import { ComponentEtherpadPropsDto } from './component-etherpad-props.dto';
import { ComponentGeogebraPropsDto } from './component-geogebra-props.dto';
import { ComponentInternalPropsDto } from './component-internal-props.dto';
import { ComponentLernstorePropsDto } from './component-lernstore-props.dto';
import { ComponentNexboardPropsDto } from './component-nexboard-props-dto';
import { ComponentTextPropsDto } from './component-text-props.dto';

export type LessonContentResponseContentInnerDto =
	| ComponentEtherpadPropsDto
	| ComponentGeogebraPropsDto
	| ComponentInternalPropsDto
	| ComponentLernstorePropsDto
	| ComponentTextPropsDto
	| ComponentNexboardPropsDto;
