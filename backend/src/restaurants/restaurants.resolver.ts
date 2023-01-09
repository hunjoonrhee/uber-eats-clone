import {Args, Mutation, Query, Resolver} from '@nestjs/graphql';
import {Restaurant} from './entities/restaurant.entity';
import {CreateRestaurantInput, CreateRestaurantOutput} from './dtos/create-restaurant.dto';
import {RestaurantsService} from './restaurants.service';
import {AuthUserDecorator} from 'src/auth/auth-user.decorator';
import {User} from 'src/users/entities/user.entity';

@Resolver(of => Restaurant)
export class RestaurantsResolver {
    constructor(private readonly restaurantService: RestaurantsService) {}
    @Mutation(returns => CreateRestaurantOutput)
    async createRestaurant(
        @AuthUserDecorator() authUser: User,
        @Args('input') createRestaurantInput: CreateRestaurantInput
    ): Promise<CreateRestaurantOutput> {
        return this.restaurantService.createRestaurant(authUser, createRestaurantInput);
    }
}
