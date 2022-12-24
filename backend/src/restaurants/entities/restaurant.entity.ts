import {Field, ObjectType} from '@nestjs/graphql';
import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';
import {IsBoolean, IsOptional, IsString} from 'class-validator';

@ObjectType()
@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn()
  @Field((type) => Number)
  id: number;

  @Field((type) => String)
  @IsString()
  @Column()
  name: string;

  @Field((type) => Boolean, {defaultValue: false})
  @IsBoolean()
  @IsOptional()
  @Column({default: false})
  isVegan: boolean;

  @Field((type) => String)
  @IsString()
  @Column()
  address: string;

  @Field((type) => String)
  @IsString()
  @Column()
  ownerName: string;

  @Field((type) => String)
  @IsString()
  @Column()
  categoryName: string;
}
