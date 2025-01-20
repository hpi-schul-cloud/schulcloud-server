import { MeDto } from './me.dto';

export class MeMapper {
	public static mapToDto(id: string, firstName: string, schoolName: string): MeDto {
		const dto = new MeDto(id, firstName, schoolName);

		return dto;
	}
}
