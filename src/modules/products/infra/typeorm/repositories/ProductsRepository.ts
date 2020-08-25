import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = await this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findName = await this.ormRepository.findOne({ where: { name } });

    return findName;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const findId = products.map(product => product.id);

    const checkIdProduct = await this.ormRepository.find({
      where: {
        id: In(findId),
      },
    });
    return checkIdProduct;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    /* Verificar funcionalidade
    const quantityUpdate = products.map(product =>
      product.id ? { ...products, quantity: product.quantity + 1 } : product,
    );

    return this.ormRepository.save(quantityUpdate);

    */

    return this.ormRepository.save(products);
  }
}

export default ProductsRepository;