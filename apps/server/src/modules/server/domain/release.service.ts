import { Injectable } from '@nestjs/common';
import { ReleaseRepo } from '../repo/release.repo';
import { Release } from './types';

@Injectable()
export class ReleaseService {
	constructor(private readonly releaseRepo: ReleaseRepo) {}

	public async getAllReleases(): Promise<Release[]> {
		return await this.releaseRepo.findAllReleases();
	}
}
