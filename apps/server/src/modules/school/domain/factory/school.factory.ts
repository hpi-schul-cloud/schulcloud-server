import { School, SchoolProps } from '../do';
import { SchoolUpdateBody } from '../interface';

export class SchoolFactory {
	public static build(props: SchoolProps): School {
		return new School(props);
	}

	public static buildFromPartialBody(school: School, partialBody: SchoolUpdateBody): School {
		const {
			name,
			officialSchoolNumber,
			logo,
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
		props.logo = logo ?? props.logo;
		props.fileStorageType = fileStorageType ?? props.fileStorageType;
		props.language = language ?? props.language;
		props.features = features ?? props.features;
		props.permissions = permissions ?? props.permissions;
		props.enableStudentTeamCreation = enableStudentTeamCreation ?? props.enableStudentTeamCreation;

		const result = SchoolFactory.build(props);

		return result;
	}
}
