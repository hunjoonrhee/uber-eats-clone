import {BeforeInsert, BeforeUpdate, Column, Entity, OneToMany} from 'typeorm';
import {CoreEntity} from '../../common/entities/core.entity';
import {Field, InputType, ObjectType, registerEnumType} from '@nestjs/graphql';
import * as bcrypt from 'bcrypt';
import {InternalServerErrorException} from '@nestjs/common';
import {IsBoolean, IsEmail, IsEnum, IsString} from 'class-validator';
import {Restaurant} from 'src/restaurants/entities/restaurant.entity';
import {Order} from 'src/orders/entities/order.entity';

export enum UserRole {
    Owner = 'Owner',
    Client = 'Client',
    Delivery = 'Delivery',
}

registerEnumType(UserRole, {name: 'UserRole'});

@InputType('UserInputType', {isAbstract: true})
@ObjectType()
@Entity()
export class User extends CoreEntity {
    @Column({unique: true})
    @Field(type => String)
    @IsEmail()
    email: string;

    @Column({select: false})
    @Field(type => String)
    @IsString()
    password: string;

    @Column({type: 'enum', enum: UserRole})
    @Field(type => UserRole)
    @IsEnum(UserRole)
    role: UserRole;

    @Column({default: false})
    @Field(type => Boolean)
    @IsBoolean()
    verified: boolean;

    @OneToMany(type => Restaurant, restaurant => restaurant.category)
    @Field(type => [Restaurant])
    restaurants: Restaurant[];

    @OneToMany(type => Order, order => order.customer)
    @Field(type => [Order])
    orders: Order[];

    @OneToMany(type => Order, order => order.driver)
    @Field(type => [Order])
    rides: Order[];

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword(): Promise<void> {
        if (this.password) {
            try {
                this.password = await bcrypt.hash(this.password, 10);
            } catch (e) {
                console.log(e);
                throw new InternalServerErrorException();
            }
        }
    }

    async checkPassword(aPassword: string): Promise<boolean> {
        try {
            return await bcrypt.compare(aPassword, this.password);
        } catch (e) {
            console.log(e);
            throw new InternalServerErrorException();
        }
    }
}
