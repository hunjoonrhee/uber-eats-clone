import {InjectRepository} from '@nestjs/typeorm';
import {User} from './entities/user.entity';
import {Injectable} from '@nestjs/common';
import {Repository} from 'typeorm';
import {CreateAccountInput} from './dtos/create-account.dto';
import {LoginInput} from './dtos/login.dto';
import {JwtService} from '../jwt/jwt.service';
import {EditProfileInput} from './dtos/edit-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService
  ) {}

  async createAccount({
    email,
    password,
    role
  }: CreateAccountInput): Promise<[boolean, string?]> {
    try {
      const exists = await this.usersRepo.findOneBy({email});
      if (exists) {
        return [false, 'There is a user with that email already'];
      }
      await this.usersRepo.save(this.usersRepo.create({email, password, role}));
      return [true];
    } catch (e) {
      return [false, "Couldn't create account"];
    }

    // ok
  }
  async login({
    email,
    password
  }: LoginInput): Promise<{ok: boolean; error?: string; token?: string}> {
    // find the user with the email
    // check if the password is correct
    // make a JWT and give it to the user
    try {
      const user = await this.usersRepo.findOneBy({email});
      if (!user) {
        return {
          ok: false,
          error: 'User not found'
        };
      }
      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return {
          ok: false,
          error: 'Wrong password'
        };
      }
      const token = this.jwtService.sign(user.id);
      return {
        ok: true,
        token
      };
    } catch (error) {
      return {
        ok: false,
        error
      };
    }
  }

  async findById(id: number): Promise<User> {
    return this.usersRepo.findOneBy({id});
  }

  async editProfile(
    id: number,
    {email, password}: EditProfileInput
  ): Promise<User> {
    const user = await this.usersRepo.findOneBy({id});
    if (email) {
      user.email = email;
    }
    if (password) {
      user.password = password;
    }
    return this.usersRepo.save(user);
  }
}
