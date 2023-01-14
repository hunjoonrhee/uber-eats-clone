import {Module} from '@nestjs/common';
import {CategoryResolver, RestaurantsResolver} from './restaurants.resolver';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Restaurant} from './entities/restaurant.entity';
import {RestaurantsService} from './restaurants.service';
import {CategoryRepository} from './repositories/category.repository';

@Module({
    imports: [TypeOrmModule.forFeature([Restaurant, CategoryRepository])],
    providers: [RestaurantsResolver, RestaurantsService, CategoryRepository, CategoryResolver],
})
export class RestaurantsModule {}
