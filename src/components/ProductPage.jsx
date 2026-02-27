import React, { useEffect, useState, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CartContext } from '../App';

const API = 'http://localhost:3001';

export default function ProductPage() {
  const { pid } = useParams();
  const { addToCart } = useContext(CartContext);
  const [product, setProduct] = useState(null);
  const [error, setError]     = useState(null);
  const [qty, setQty]         = useState(1);

  useEffect(() => {
    fetch(`${API}/api/products/${pid}`)
      .then(r => {
        if (!r.ok) throw new Error('Product not found');
        return r.json();
      })
      .then(setProduct)
      .catch(e => setError(e.message));
  }, [pid]);

  if (error)   return <main className="product-page-container"><p>{error}</p></main>;
  if (!product) return <main className="product-page-container"><p>Loading...</p></main>;

  const fullImg = product.image
    ? `${API}/uploads/${product.image}_full.jpg`
    : '/assets/legendary.png';

  return (
    <main className="product-page-container">
      <nav className="breadcrumb">
        <div className="breadcrumb-item">
          <Link to="/">Home</Link>
          <span className="separator">/</span>
        </div>
        <div className="breadcrumb-item">
          <Link to={`/?catid=${product.catid}`}>{product.catname}</Link>
          <span className="separator">/</span>
        </div>
        <div className="breadcrumb-item">
          <span>{product.name}</span>
        </div>
      </nav>

      <div className="product-detail-layout">

        {/* Image gallery */}
        <div className="product-gallery">
          <input type="radio" name="gallery" id="gal-1" defaultChecked />

          <div className="gallery-display">
            <figure className="gallery-slide slide-1">
              <img src={fullImg} alt={product.name} />
            </figure>
          </div>

          <div className="gallery-thumbnails">
            <label htmlFor="gal-1" className="thumb thumb-1">
              <img src={fullImg} alt={product.name} />
            </label>
          </div>
        </div>

        {/* Product info */}
        <div className="product-info-section">
          <h1 className="product-title">{product.name}</h1>
          <div className="product-meta">
            <span className="category-label">Category: {product.catname}</span>
            <span className="sku">SKU: PROD-{String(product.pid).padStart(4, '0')}</span>
          </div>

          <div className="product-price">${Number(product.price).toLocaleString()}</div>

          <div className="product-description">
            <p>{product.description}</p>
          </div>

          <div className="product-actions">
            <div className="quantity-selector">
              <label htmlFor="qty" className="quantity-label">Qty:</label>
              <input
                type="number"
                id="qty"
                name="qty"
                min="1"
                value={qty}
                onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <button className="add-cart-btn" onClick={() => addToCart(product, qty)}>Add to Cart</button>
          </div>
        </div>

      </div>
    </main>
  );
}
