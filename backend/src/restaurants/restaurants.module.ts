import {Module} from '@nestjs/common';
import {CategoryResolver, DishResolver, RestaurantsResolver} from './restaurants.resolver';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Restaurant} from './entities/restaurant.entity';
import {RestaurantsService} from './restaurants.service';
import {Dish} from './entities/dish.entity';
import {CategoryRepository} from './repositories/category.repository';

@Module({
    imports: [TypeOrmModule.forFeature([Restaurant, Dish, CategoryRepository])],
    providers: [RestaurantsResolver, CategoryResolver, DishResolver, RestaurantsService],
})
export class RestaurantsModule {}
