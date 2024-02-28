import { SchoolProps } from '../do';

export interface SchoolUpdateBody {
	name?: SchoolProps['name'];
	officialSchoolNumber?: SchoolProps['officialSchoolNumber'];
	logo_dataUrl?: SchoolProps['logo_dataUrl'];
	logo_name?: SchoolProps['logo_name'];
	fileStorageType?: SchoolProps['fileStorageType'];
	language?: SchoolProps['language'];
	features?: SchoolProps['features'];
	permissions?: SchoolProps['permissions'];
}
