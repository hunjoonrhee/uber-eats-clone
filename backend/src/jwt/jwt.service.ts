import {Inject, Injectable} from '@nestjs/common';
import {JwtInterfaces} from './jwt.interfaces';
import * as jwt from 'jsonwebtoken';
import {CONFIG_OPTIONS} from '../common/common.constants';

@Injectable()
export class JwtService {
    constructor(@Inject(CONFIG_OPTIONS) private readonly options: JwtInterfaces) {}
    sign(userId: number): string {
        return jwt.sign({id: userId}, this.options.privateKey);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    verify(token: string) {
        return jwt.verify(token, this.options.privateKey);
    }
}
