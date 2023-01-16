import {Module} from '@nestjs/common';
import {CategoryResolver, DishResolver, RestaurantsResolver} from './restaurants.resolver';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Restaurant} from './entities/restaurant.entity';
import {RestaurantsService} from './restaurants.service';
import {CategoryRepository} from './repositories/category.repository';
import {Dish} from './entities/dish.entity';
import {Order} from 'src/orders/entities/order.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Restaurant, CategoryRepository, Dish, Order])],
    providers: [RestaurantsResolver, RestaurantsService, CategoryRepository, CategoryResolver, DishResolver],
})
export class RestaurantsModule {}
