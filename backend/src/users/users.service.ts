import {InjectRepository} from '@nestjs/typeorm';
import {User} from './entities/user.entity';
import {Injectable} from '@nestjs/common';
import {Repository} from 'typeorm';
import {CreateAccountInput, CreateAccountOutput} from './dtos/create-account.dto';
import {LoginInput, LoginOutput} from './dtos/login.dto';
import {JwtService} from '../jwt/jwt.service';
import {EditProfileInput, EditProfileOutput} from './dtos/edit-profile.dto';
import {Verification} from './entities/verification.entity';
import {UserProfileOutput} from './dtos/use-profile.dto';
import {VerifyEmailOutput} from './dtos/verify-email.dto';
import {MailService} from '../mail/mail.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private readonly usersRepo: Repository<User>,
        @InjectRepository(Verification)
        private readonly verificationRepo: Repository<Verification>,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService
    ) {}

    async createAccount({email, password, role}: CreateAccountInput): Promise<CreateAccountOutput> {
        try {
            const exists = await this.usersRepo.findOne({where: {email}});
            if (exists) {
                return {
                    ok: false,
                    error: 'There is a user with that email already',
                };
            }
            const user = await this.usersRepo.save(this.usersRepo.create({email, password, role}));
            const verification = await this.verificationRepo.save(
                this.verificationRepo.create({
                    user,
                })
            );
            this.mailService.sendVerificationEmail(user.email, verification.code);
            return {
                ok: true,
            };
        } catch (e) {
            return {
                ok: false,
                error: "Couldn't create account",
            };
        }
    }
    async login({email, password}: LoginInput): Promise<LoginOutput> {
        try {
            const user = await this.usersRepo.findOne({
                where: {email},
                select: ['id', 'password'],
            });
            if (!user) {
                return {
                    ok: false,
                    error: 'User not found',
                };
            }
            const passwordCorrect = await user.checkPassword(password);
            if (!passwordCorrect) {
                return {
                    ok: false,
                    error: 'Wrong password',
                };
            }
            const token = this.jwtService.sign(user.id);
            return {
                ok: true,
                token,
            };
        } catch (error) {
            return {
                ok: false,
                error: 'Could not log in',
            };
        }
    }

    async findById(id: number): Promise<UserProfileOutput> {
        try {
            const user = await this.usersRepo.findOneOrFail({where: {id}});
            return {
                ok: true,
                user,
            };
        } catch (e) {
            return {
                ok: false,
                error: 'User Not Found',
            };
        }
    }

    async editProfile(id: number, {email, password}: EditProfileInput): Promise<EditProfileOutput> {
        try {
            const user = await this.usersRepo.findOne({where: {id}});
            if (email) {
                user.email = email;
                user.verified = false;
                this.verificationRepo.delete({user: {id: user.id}});
                const verification = await this.verificationRepo.save(this.verificationRepo.create({user}));
                this.mailService.sendVerificationEmail(user.email, verification.code);
            }
            if (password) {
                user.password = password;
            }
            await this.usersRepo.save(user);
            return {
                ok: true,
            };
        } catch (error) {
            return {
                ok: false,
                error: 'Could not update profile',
            };
        }
    }

    async verifyEmail(code: string): Promise<VerifyEmailOutput> {
        try {
            const verification = await this.verificationRepo.findOne({
                where: {code},
                relations: ['user'],
            });
            if (verification) {
                verification.user.verified = true;
                await this.usersRepo.save(verification.user);
                await this.verificationRepo.delete(verification.id);
                return {
                    ok: true,
                };
            }
            return {ok: false, error: 'Verification not found.'};
        } catch (error) {
            return {
                ok: false,
                error: 'Could not verify email.',
            };
        }
    }
}
