/* eslint-disable @typescript-eslint/no-unused-vars */
import {Args, Mutation, Query, Resolver} from '@nestjs/graphql';
import {User} from './entities/user.entity';
import {UsersService} from './users.service';
import {
  CreateAccountInput,
  CreateAccountOutput
} from './dtos/create-account.dto';
import {LoginInput, LoginOutput} from './dtos/login.dto';
import {AuthGuard} from '../auth/auth.guard';
import {UseGuards} from '@nestjs/common';
import {AuthUserDecorator} from '../auth/auth-user.decorator';
import {UserProfileInput, UserProfileOutput} from './dtos/use-profile.dto';
import {VerifyEmailInput, VerifyEmailOutput} from './dtos/verify-email.dto';
import {EditProfileInput, EditProfileOutput} from './dtos/edit-profile.dto';

@Resolver((of) => User)
export class UsersResolver {
    constructor(private readonly usersService: UsersService) {}
    @Query(returns => [User])
    users(): Promise<User[]> {
        return null;
    }
    @Mutation(returns => CreateAccountOutput)
    async createAccount(@Args('input') createAccountInput: CreateAccountInput): Promise<CreateAccountOutput> {
        return this.usersService.createAccount(createAccountInput);
    }

  @Mutation((returns) => LoginOutput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    return this.usersService.login(loginInput);
  }

  @Query((returns) => User)
  @UseGuards(AuthGuard)
  me(@AuthUserDecorator() authUser: User) {
    return authUser;
  }

  @UseGuards(AuthGuard)
  @Query((returns) => UserProfileOutput)
  async userProfile(
    @Args() userProfileInput: UserProfileInput
  ): Promise<UserProfileOutput> {
    return this.usersService.findById(userProfileInput.userId);
  }

  @Mutation((returns) => VerifyEmailOutput)
  async verifyEmail(
    @Args('input') verifyEmailInput: VerifyEmailInput
  ): Promise<VerifyEmailOutput> {
    return this.usersService.verifyEmail(verifyEmailInput.code);
  }

  @Mutation((returns) => EditProfileOutput)
  async editProfile(
    @AuthUserDecorator() authUser: User,
    @Args('input') editProfileInput: EditProfileInput
  ): Promise<EditProfileOutput> {
    return this.usersService.editProfile(authUser.id, editProfileInput);
  }
}
