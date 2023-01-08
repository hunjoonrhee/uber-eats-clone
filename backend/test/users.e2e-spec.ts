import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication} from '@nestjs/common';
import * as request from 'supertest';
import {AppModule} from '../src/app.module';
import {DataSource, Repository} from 'typeorm';
import {getRepositoryToken} from '@nestjs/typeorm';
import {User} from 'src/users/entities/user.entity';
import {Verification} from 'src/users/entities/verification.entity';

const GRAPHQL_ENDPOINT = '/graphql';
const testUser = {
    email: 'dev.master0917@gmail.com',
    password: '12345',
};

jest.mock('got', () => {
    return {
        post: jest.fn(),
    };
});

describe('UserModule (e2e)', () => {
    let app: INestApplication;
    let usersRepository: Repository<User>;
    let verificationRepository: Repository<Verification>;
    let jwtToken: string;

    const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
    const publicTest = (query: string) => baseTest().send({query});
    const privateTest = (query: string) => baseTest().set('X-JWT', jwtToken).send({query});

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = module.createNestApplication();
        usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
        verificationRepository = module.get<Repository<Verification>>(getRepositoryToken(Verification));
        await app.init();
    });

    const testDataSource = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'hunjoonrhee',
        password: '12345',
        database: 'uber-eats-test',
    });
    afterAll(async () => {
        const connection = await testDataSource.initialize();
        await connection.dropDatabase();
        await connection.destroy();
        app.close();
    });

    describe('createAccount', () => {
        it('should create account', () => {
            return publicTest(`
        mutation {
          createAccount(input: {
            email:"${testUser.email}",
            password:"${testUser.password}",
            role:Owner
          }) {
            ok
            error
          }
        }
        `)
                .expect(200)
                .expect(res => {
                    expect(res.body.data.createAccount.ok).toBe(true);
                    expect(res.body.data.createAccount.error).toBe(null);
                });
        });

        it('should fail if account already exists', () => {
            return publicTest(`
          mutation {
            createAccount(input: {
              email:"${testUser.email}",
              password:"${testUser.password}",
              role:Owner
            }) {
              ok
              error
            }
          }
        `)
                .expect(200)
                .expect(res => {
                    const {
                        body: {
                            data: {
                                createAccount: {ok, error},
                            },
                        },
                    } = res;
                    expect(ok).toBe(false);
                    expect(error).toBe('There is a user with that email already');
                });
        });
    });

    describe('login', () => {
        it('should login with correct credentials', () => {
            return publicTest(`
          mutation {
            login(input:{
              email:"${testUser.email}",
              password:"${testUser.password}",
            }) {
              ok
              error
              token
            }
          }
        `)
                .expect(200)
                .expect(res => {
                    const {
                        body: {
                            data: {login},
                        },
                    } = res;
                    expect(login.ok).toBe(true);
                    expect(login.error).toBe(null);
                    expect(login.token).toEqual(expect.any(String));
                    jwtToken = login.token;
                });
        });
        it('should not be able to login with wrong credentials', () => {
            return publicTest(`
          mutation {
            login(input:{
              email:"${testUser.email}",
              password:"xxx",
            }) {
              ok
              error
              token
            }
          }
        `)
                .expect(200)
                .expect(res => {
                    const {
                        body: {
                            data: {login},
                        },
                    } = res;
                    expect(login.ok).toBe(false);
                    expect(login.error).toBe('Wrong password');
                    expect(login.token).toBe(null);
                });
        });
    });

    describe('userProfile', () => {
        let userId: number;
        beforeAll(async () => {
            const [user] = await usersRepository.find();
            userId = user.id;
        });
        it("should see a user's profile", () => {
            return privateTest(`
          {
            userProfile(userId:${userId}){
              ok
              error
              user {
                id
              }
            }
          }
        `)
                .expect(200)
                .expect(res => {
                    const {
                        body: {
                            data: {
                                userProfile: {
                                    ok,
                                    error,
                                    user: {id},
                                },
                            },
                        },
                    } = res;
                    expect(ok).toBe(true);
                    expect(error).toBe(null);
                    expect(id).toBe(userId);
                });
        });
        it('should not find a profile', () => {
            return privateTest(`
          {
            userProfile(userId:666){
              ok
              error
              user {
                id
              }
            }
          }
        `)
                .expect(200)
                .expect(res => {
                    const {
                        body: {
                            data: {
                                userProfile: {ok, error, user},
                            },
                        },
                    } = res;
                    expect(ok).toBe(false);
                    expect(error).toBe('User Not Found');
                    expect(user).toBe(null);
                });
        });
    });

    describe('me', () => {
        it('should find my profile', () => {
            return privateTest(`
                    {
                        me {
                          email
                        }
                      }
                    `)
                .expect(200)
                .expect(res => {
                    const {
                        body: {
                            data: {
                                me: {email},
                            },
                        },
                    } = res;
                    expect(email).toEqual(testUser.email);
                });
        });
        it('should not allow logged out user', () => {
            return publicTest(`
          {
            me {
              email
            }
          }
        `)
                .expect(200)
                .expect(res => {
                    const {
                        body: {errors},
                    } = res;
                    const [error] = errors;
                    expect(error.message).toBe('Forbidden resource');
                });
        });
    });

    describe('editProfile', () => {
        const NEW_EMAIL = 'nico@new.com';
        it('should change email', () => {
            return privateTest(`
            mutation {
              editProfile(input:{
                email: "${NEW_EMAIL}"
              }) {
                ok
                error
              }
            }
        `)
                .expect(200)
                .expect(res => {
                    const {
                        body: {
                            data: {
                                editProfile: {ok, error},
                            },
                        },
                    } = res;
                    expect(ok).toBe(true);
                    expect(error).toBe(null);
                });
        });
        it('should have new email', () => {
            return privateTest(`
          {
            me {
              email
            }
          }
        `)
                .expect(200)
                .expect(res => {
                    const {
                        body: {
                            data: {
                                me: {email},
                            },
                        },
                    } = res;
                    expect(email).toBe(NEW_EMAIL);
                });
        });
    });

    describe('verifyEmail', () => {
        let verificationCode: string;
        beforeAll(async () => {
            const [verification] = await verificationRepository.find();
            verificationCode = verification.code;
        });
        it('should verify email', () => {
            return publicTest(`
          mutation {
            verifyEmail(input:{
              code:"${verificationCode}"
            }){
              ok
              error
            }
          }
        `)
                .expect(200)
                .expect(res => {
                    const {
                        body: {
                            data: {
                                verifyEmail: {ok, error},
                            },
                        },
                    } = res;
                    expect(ok).toBe(true);
                    expect(error).toBe(null);
                });
        });
        it('should fail on verification code not found', () => {
            return publicTest(`
          mutation {
            verifyEmail(input:{
              code:"xxxxx"
            }){
              ok
              error
            }
          }
        `)
                .expect(200)
                .expect(res => {
                    const {
                        body: {
                            data: {
                                verifyEmail: {ok, error},
                            },
                        },
                    } = res;
                    expect(ok).toBe(false);
                    expect(error).toBe('Verification not found.');
                });
        });
    });
});
