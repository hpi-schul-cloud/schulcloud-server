import { LanguageType } from '@shared/domain/entity';
import { SchoolProps } from '../do';
import { FileStorageType } from '../type';

export interface SchoolUpdateBody extends Partial<SchoolProps> {
	name?: string;
	officialSchoolNumber?: string;
	logo_dataUrl?: string;
	logo_name?: string;
	fileStorageType?: FileStorageType;
	language?: LanguageType;
}
