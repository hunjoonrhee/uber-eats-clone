import {BeforeInsert, Column, Entity} from 'typeorm';
import {CoreEntity} from '../../common/entities/core.entity';
import {Field, InputType, ObjectType, registerEnumType} from '@nestjs/graphql';
import * as bcrypt from 'bcrypt';
import {InternalServerErrorException} from '@nestjs/common';
import {IsEmail, IsEnum, IsString} from 'class-validator';

enum UserRole {
  Owner,
  Client,
  Delivery
}

registerEnumType(UserRole, {name: 'UserRole'});

@InputType({isAbstract: true})
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column()
  @Field((type) => String)
  @IsEmail()
  email: string;

  @Column()
  @Field((type) => String)
  @IsString()
  password: string;

  @Column({type: 'enum', enum: UserRole})
  @Field((type) => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @BeforeInsert()
  async hashPassword(): Promise<void> {
    try {
      this.password = await bcrypt.hash(this.password, 10);
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException();
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
