import { SchoolService } from '@modules/school';
import { SystemService } from '@modules/system';
import { Injectable } from '@nestjs/common';

@Injectable()
export class VidisSyncService {
	constructor(private readonly systemService: SystemService, private readonly schoolService: SchoolService) {}
}
