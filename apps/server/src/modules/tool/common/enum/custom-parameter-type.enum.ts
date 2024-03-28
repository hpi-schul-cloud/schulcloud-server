export enum CustomParameterType {
	STRING = 'string',
	NUMBER = 'number',
	BOOLEAN = 'boolean',
	AUTO_CONTEXTID = 'auto_contextid',
	AUTO_CONTEXTNAME = 'auto_contextname',
	AUTO_SCHOOLID = 'auto_schoolid',
	AUTO_SCHOOLNUMBER = 'auto_schoolnumber',
	AUTO_MEDIUMID = 'auto_mediumid',
}

export const autoParameters: CustomParameterType[] = [
	CustomParameterType.AUTO_CONTEXTID,
	CustomParameterType.AUTO_CONTEXTNAME,
	CustomParameterType.AUTO_SCHOOLID,
	CustomParameterType.AUTO_SCHOOLNUMBER,
	CustomParameterType.AUTO_MEDIUMID,
];
