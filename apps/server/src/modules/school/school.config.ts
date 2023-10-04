import { Configuration } from '@hpi-schul-cloud/commons';

export interface SchoolConfig {
	STUDENT_TEAM_CREATION: string;
}

const schoolConfig: SchoolConfig = {
	STUDENT_TEAM_CREATION: Configuration.get('STUDENT_TEAM_CREATION') as string,
};

export const config = () => schoolConfig;
