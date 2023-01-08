/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import {GqlExecutionContext} from '@nestjs/graphql';

@Injectable()
export class AuthGuard implements CanActivate {
    canActivate(context: ExecutionContext) {
        const gqlContext = GqlExecutionContext.create(context).getContext();
        const user = gqlContext['user'];
        return !user ? false : true;
    }
}
