import React, { useEffect, useState, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CartContext } from '../App';
import {
  clampQuantityInput,
  MAX_QTY,
  sanitizeDisplayText,
  sanitizeDescriptionInput,
  sanitizeImageIdForPath,
} from '../lib/validation';

const API = '';

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

  const safeImageId = sanitizeImageIdForPath(product.image);
  const safeName = sanitizeDisplayText(product.name, 255);
  const safeCategoryName = sanitizeDisplayText(product.catname, 255);
  const safeDescription = sanitizeDescriptionInput(product.description, 1000);

  const fullImg = safeImageId
    ? `${API}/uploads/${encodeURIComponent(safeImageId)}_full.jpg`
    : '/assets/legendary.png';

  return (
    <main className="product-page-container">
      <nav className="breadcrumb">
        <div className="breadcrumb-item">
          <Link to="/">Home</Link>
          <span className="separator">/</span>
        </div>
        <div className="breadcrumb-item">
          <Link to={`/?catid=${product.catid}`}>{safeCategoryName}</Link>
          <span className="separator">/</span>
        </div>
        <div className="breadcrumb-item">
          <span>{safeName}</span>
        </div>
      </nav>

      <div className="product-detail-layout">

        {/* Image gallery */}
        <div className="product-gallery">
          <input type="radio" name="gallery" id="gal-1" defaultChecked />

          <div className="gallery-display">
            <figure className="gallery-slide slide-1">
              <img src={fullImg} alt={safeName} />
            </figure>
          </div>

          <div className="gallery-thumbnails">
            <label htmlFor="gal-1" className="thumb thumb-1">
              <img src={fullImg} alt={safeName} />
            </label>
          </div>
        </div>

        {/* Product info */}
        <div className="product-info-section">
          <h1 className="product-title">{safeName}</h1>
          <div className="product-meta">
            <span className="category-label">Category: {safeCategoryName}</span>
            <span className="sku">SKU: PROD-{String(product.pid).padStart(4, '0')}</span>
          </div>

          <div className="product-price">${Number(product.price).toLocaleString()}</div>

          <div className="product-description">
            <p>{safeDescription}</p>
          </div>

          <div className="product-actions">
            <div className="quantity-selector">
              <label htmlFor="qty" className="quantity-label">Qty:</label>
              <input
                type="number"
                id="qty"
                name="qty"
                min="1"
                max={MAX_QTY}
                inputMode="numeric"
                value={qty}
                onChange={e => setQty(clampQuantityInput(e.target.value))}
              />
            </div>
            <button className="add-cart-btn" onClick={() => addToCart(product, qty)}>Add to Cart</button>
          </div>
        </div>

      </div>
    </main>
  );
}
