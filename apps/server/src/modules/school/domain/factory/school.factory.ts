import { School, SchoolProps } from '../do';
import { SchoolUpdateBody } from '../interface';

export class SchoolFactory {
	static build(props: SchoolProps) {
		return new School(props);
	}

	static buildFromPartialBody(school: School, partialBody: SchoolUpdateBody) {
		const props = school.getProps();

		props.name = partialBody.name ?? props.name;
		props.officialSchoolNumber = partialBody.officialSchoolNumber ?? props.officialSchoolNumber;
		props.logo_dataUrl = partialBody.logo_dataUrl ?? props.logo_dataUrl;
		props.logo_name = partialBody.logo_name ?? props.logo_name;
		props.fileStorageType = partialBody.fileStorageType ?? props.fileStorageType;
		props.language = partialBody.language ?? props.language;
		props.features = partialBody.features ?? props.features;

		const result = SchoolFactory.build(props);

		return result;
	}
}
