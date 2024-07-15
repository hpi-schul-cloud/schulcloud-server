import { RatingDataDto } from './rating-data.dto';

export interface RatingDetailsDto {
	affiliation?: {
		[key: string]: RatingDataDto;
	};
	overall?: RatingDataDto;
	user?: number;
}
