export enum CommonCartridgeVersion {
	V_1_0_0 = '1.0.0',
	V_1_1_0 = '1.1.0',
	V_1_2_0 = '1.2.0',
	V_1_3_0 = '1.3.0',
	V_1_4_0 = '1.4.0',
}

// TODO: think about if there is a way to ensure that an implementation that is dependent on these versions has implementations for all versions. (HINT: helper class, composable, abstract class...)

export enum CommonCartridgeResourceType {
	UNKNOWN = 'unknown',
	LTI = 'lti',
	MANIFEST = 'manifest',
	WEB_CONTENT = 'webcontent',
	WEB_LINK = 'weblink',
}

export enum CommonCartridgeIntendedUseType {
	ASSIGNMENT = 'assignment',
	LESSON_PLAN = 'lessonplan',
	SYLLABUS = 'syllabus',
	UNSPECIFIED = 'unspecified',
}

export enum CommonCartridgeElementType {
	METADATA = 'metadata',
	ORGANIZATION = 'organization',
	RESOURCES_WRAPPER = 'resourceswrapper',
	ORGANIZATIONS_WRAPPER = 'organizationswrapper',
}
