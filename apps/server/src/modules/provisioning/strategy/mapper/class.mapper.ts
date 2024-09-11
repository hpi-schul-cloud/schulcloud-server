import { Class } from '@modules/class';
import { ExternalClassDto } from '../../dto';

export class ClassMapper {
	public static externalClassToClass(_externalClass: ExternalClassDto): Class {
		throw new Error('Method not implemented.');

		// const classDo = new Class();

		// return classDo;
	}
}
