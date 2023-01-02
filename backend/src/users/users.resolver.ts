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
import {EditProfileInput, EditProfileOutput} from './dtos/edit-profile.dto';

@Resolver((of) => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}
  @Query((returns) => [User])
  users(): Promise<User[]> {
    return null;
  }
  @Mutation((returns) => CreateAccountOutput)
  async createAccount(
    @Args('input') createAccountInput: CreateAccountInput
  ): Promise<CreateAccountOutput> {
    try {
      const [ok, error] = await this.usersService.createAccount(
        createAccountInput
      );
      return {ok, error};
    } catch (e) {
      return {
        error: e,
        ok: false
      };
    }
  }

  @Mutation((returns) => LoginOutput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    try {
      return this.usersService.login(loginInput);
    } catch (e) {
      return {
        ok: false,
        error: e
      };
    }
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
    try {
      const user = await this.usersService.findById(userProfileInput.userId);
      if (!user) {
        throw Error();
      }
      return {
        ok: true,
        user
      };
    } catch (e) {
      return {
        ok: false,
        error: 'User Not Found'
      };
    }
  }

  @UseGuards(AuthGuard)
  @Mutation((returns) => EditProfileOutput)
  async editProfile(
    @AuthUserDecorator() authUser: User,
    @Args('input') editProfileInput: EditProfileInput
  ): Promise<EditProfileOutput> {
    try {
      await this.usersService.editProfile(authUser.id, editProfileInput);
      return {
        ok: true
      };
    } catch (error) {
      return {
        ok: false,
        error
      };
    }
  }
}
