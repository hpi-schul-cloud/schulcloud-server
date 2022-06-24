import { Injectable } from '@nestjs/common';

@Injectable()
export class NameCopyService {
	deriveCopyName(name: string): string {
		let number = 1;
		const matches = name.match(/^(?<name>.*) \((?<number>\d+)\)$/);
		if (matches && matches.groups) {
			name = matches.groups.name;
			number = Number(matches.groups.number) + 1;
		}
		return `${name} (${number})`;
	}
}
