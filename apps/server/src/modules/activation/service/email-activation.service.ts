import { Injectable } from '@nestjs/common';
import {ActivationRepo} from "@modules/activation/repo";

@Injectable()
export class EmailActivationService {

    constructor(private readonly activationRepo: ActivationRepo) {
    }


}
