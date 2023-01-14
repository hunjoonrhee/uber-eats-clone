import {Injectable} from '@nestjs/common';
import {DataSource, Repository} from 'typeorm';
import {Category} from '../entities/category.entity';

@Injectable()
export class CategoryRepository extends Repository<Category> {
    constructor(private readonly dataSource: DataSource) {
        super(Category, dataSource.createEntityManager());
    }

    async getOrCreate(name: string): Promise<Category> {
        const categoryName = name.trim().toLowerCase();
        const categorySlug = categoryName.replace(/ /g, '-');
        let category = await this.findOneBy({slug: categorySlug});
        if (!category) {
            category = await this.save(this.create({slug: categorySlug, name: categoryName}));
        }
        return category;
    }
}
