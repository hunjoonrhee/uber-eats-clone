import {Field, InputType, ObjectType, PartialType, PickType} from '@nestjs/graphql';
import {CoreOutput} from 'src/common/dtos/output.dto';

@InputType()
export class DeleteRestaurantInput {
    @Field(type => Number)
    restaurantId: number;
}

@ObjectType()
export class DeleteRestaurantOutput extends CoreOutput {}
