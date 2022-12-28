import {DynamicModule, Global, Module} from '@nestjs/common';
import {JwtService} from './jwt.service';
import {JwtInterfaces} from './jwt.interfaces';
import {CONFIG_OPTIONS} from './jwt.constants';

@Module({})
@Global()
export class JwtModule {
  static forRoot(options: JwtInterfaces): DynamicModule {
    return {
      module: JwtModule,
      exports: [JwtService],
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options
        },
        JwtService
      ]
    };
  }
}
