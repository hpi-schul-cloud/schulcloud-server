import { SchoolProps } from '../do';

export interface SchoolUpdateBody {
	name?: SchoolProps['name'];
	officialSchoolNumber?: SchoolProps['officialSchoolNumber'];
	logo?: SchoolProps['logo'];
	fileStorageType?: SchoolProps['fileStorageType'];
	language?: SchoolProps['language'];
	features?: SchoolProps['features'];
	permissions?: SchoolProps['permissions'];
	countyId?: string;
	enableStudentTeamCreation?: SchoolProps['enableStudentTeamCreation'];
}
