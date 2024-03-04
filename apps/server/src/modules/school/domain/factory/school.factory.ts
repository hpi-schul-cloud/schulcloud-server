import { School, SchoolProps } from '../do';
import { SchoolUpdateBody } from '../interface';

export class SchoolFactory {
	static build(props: SchoolProps) {
		return new School(props);
	}

	static buildFromPartialBody(school: School, partialBody: SchoolUpdateBody) {
		const {
			name,
			officialSchoolNumber,
			logo_dataUrl,
			logo_name,
			fileStorageType,
			language,
			features,
			permissions,
			countyId,
			enableStudentTeamCreation,
		} = partialBody;

		if (countyId) {
			school.updateCounty(countyId);
		}

		const props = school.getProps();

		props.name = name ?? props.name;
		props.officialSchoolNumber = officialSchoolNumber ?? props.officialSchoolNumber;
		props.logo_dataUrl = logo_dataUrl ?? props.logo_dataUrl;
		props.logo_name = logo_name ?? props.logo_name;
		props.fileStorageType = fileStorageType ?? props.fileStorageType;
		props.language = language ?? props.language;
		props.features = features ?? props.features;
		props.permissions = permissions ?? props.permissions;
		props.enableStudentTeamCreation =
			enableStudentTeamCreation !== undefined ? enableStudentTeamCreation : props.enableStudentTeamCreation;

		const result = SchoolFactory.build(props);

		return result;
	}
}
