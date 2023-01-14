/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {Args, Mutation, Query, Resolver} from '@nestjs/graphql';
import {User} from './entities/user.entity';
import {UsersService} from './users.service';
import {CreateAccountInput, CreateAccountOutput} from './dtos/create-account.dto';
import {LoginInput, LoginOutput} from './dtos/login.dto';
import {AuthGuard} from '../auth/auth.guard';
import {UseGuards} from '@nestjs/common';
import {AuthUserDecorator} from '../auth/auth-user.decorator';
import {UserProfileInput, UserProfileOutput} from './dtos/use-profile.dto';
import {VerifyEmailInput, VerifyEmailOutput} from './dtos/verify-email.dto';
import {EditProfileInput, EditProfileOutput} from './dtos/edit-profile.dto';
import {Role} from 'src/auth/role.decorator';

@Resolver(of => User)
export class UsersResolver {
    constructor(private readonly usersService: UsersService) {}
    @Mutation(returns => CreateAccountOutput)
    async createAccount(@Args('input') createAccountInput: CreateAccountInput): Promise<CreateAccountOutput> {
        return this.usersService.createAccount(createAccountInput);
    }

    @Mutation(returns => LoginOutput)
    async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
        return this.usersService.login(loginInput);
    }

    @Query(returns => User)
    @Role(['Any'])
    me(@AuthUserDecorator() authUser: User) {
        return authUser;
    }

    @Role(['Any'])
    @Query(returns => UserProfileOutput)
    async userProfile(@Args() userProfileInput: UserProfileInput): Promise<UserProfileOutput> {
        return this.usersService.findById(userProfileInput.userId);
    }

    @Mutation(returns => VerifyEmailOutput)
    async verifyEmail(@Args('input') verifyEmailInput: VerifyEmailInput): Promise<VerifyEmailOutput> {
        return this.usersService.verifyEmail(verifyEmailInput.code);
    }

    @Mutation(returns => EditProfileOutput)
    @Role(['Any'])
    async editProfile(@AuthUserDecorator() authUser: User, @Args('input') editProfileInput: EditProfileInput): Promise<EditProfileOutput> {
        return this.usersService.editProfile(authUser.id, editProfileInput);
    }
}
