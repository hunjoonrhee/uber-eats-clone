import {Inject, Injectable} from '@nestjs/common';
import {JwtInterfaces} from './jwt.interfaces';
import * as jwt from 'jsonwebtoken';
import {CONFIG_OPTIONS} from '../common/common.constants';

@Injectable()
export class JwtService {
  constructor(@Inject(CONFIG_OPTIONS) private readonly options: JwtInterfaces) {
    console.log(options);
  }
  sign(userId: number): string {
    return jwt.sign({id: userId}, this.options.privateKey);
  }

  verify(token: string) {
    return jwt.verify(token, this.options.privateKey);
  }
}
