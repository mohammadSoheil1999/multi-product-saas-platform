import React, { useEffect, useState } from 'react';
import { getProducts } from '../api/api';
import './productList.css'
import { useSite } from '../context/SiteContext';

const ProductList = () => {
  const { t } = useSite();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const products = await getProducts();
        setProducts(products);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="product-list">
      <h2>{t('ourProducts')}</h2>
      {products.length === 0 ? (
        <p>{t('noProducts')}</p>
      ) : (
        <div className="product-items">
          {products.map((product) => (
            <div key={product._id} className="product-item">
              <img src={product.imageUrl} alt={product.name} />
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p>{product.price} USD</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;
