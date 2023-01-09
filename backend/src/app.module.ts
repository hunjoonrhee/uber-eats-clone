import {MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import {GraphQLModule} from '@nestjs/graphql';
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo';
import {TypeOrmModule} from '@nestjs/typeorm';
import {ConfigModule} from '@nestjs/config';
import * as Joi from 'joi';
import {UsersModule} from './users/users.module';
import {User} from './users/entities/user.entity';
import {JwtModule} from './jwt/jwt.module';
import {JwtMiddleware} from './jwt/jwt.middleware';
import {Verification} from './users/entities/verification.entity';
import {MailModule} from './mail/mail.module';
import {Restaurant} from './restaurants/entities/restaurant.entity';
import {Category} from './restaurants/entities/category.entity';
import {RestaurantsModule} from './restaurants/restaurants.module';

@Module({
    imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: true,
            context: ({req}) => ({user: req['user']}),
        }),
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
            ignoreEnvFile: process.env.NODE_ENV === 'prod',
            validationSchema: Joi.object({
                NODE_ENV: Joi.string().valid('dev', 'prod', 'test').required(),
                DB_HOST: Joi.string().required(),
                DB_PORT: Joi.string().required(),
                DB_USERNAME: Joi.string().required(),
                DB_PASSWORD: Joi.string().required(),
                DB_NAME: Joi.string().required(),
                PRIVATE_KEY: Joi.string().required(),
                MAILGUN_API_KEY: Joi.string().required(),
                MAILGUN_DOMAIN_NAME: Joi.string().required(),
                MAILGUN_FROM_EMAIL: Joi.string().required(),
            }),
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST,
            port: +process.env.DB_PORT,
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            synchronize: process.env.NODE_NEV !== 'prod',
            logging: process.env.NODE_ENV !== 'prod' && process.env.NODE_ENV !== 'test',
            entities: [User, Verification, Restaurant, Category],
        }),
        UsersModule,
        RestaurantsModule,
        JwtModule.forRoot({
            privateKey: process.env.PRIVATE_KEY,
        }),
        MailModule.forRoot({
            apiKey: process.env.MAILGUN_API_KEY,
            domain: process.env.MAILGUN_DOMAIN_NAME,
            fromEmail: process.env.MAILGUN_FROM_EMAIL,
        }),
    ],
    controllers: [],
    providers: [],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(JwtMiddleware).forRoutes({
            path: '/graphql',
            method: RequestMethod.POST,
        });
    }
}
