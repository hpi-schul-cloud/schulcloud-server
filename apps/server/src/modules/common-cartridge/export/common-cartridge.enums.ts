export enum CommonCartridgeVersion {
	V_1_0_0 = '1.0.0',
	V_1_1_0 = '1.1.0',
	V_1_2_0 = '1.2.0',
	V_1_3_0 = '1.3.0',
	V_1_4_0 = '1.4.0',
}

export enum CommonCartridgeResourceType {
	UNKNOWN = 'unknown',
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
	MANIFEST = 'manifest',
	METADATA = 'metadata',
	ORGANIZATION = 'organization',
	ORGANIZATIONS_WRAPPER = 'organizations-wrapper',
	RESOURCES_WRAPPER = 'resources-wrapper',
	RESOURCE = 'resource',
}
