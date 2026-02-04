import React from 'react';
import { Link } from 'react-router-dom';

export default function ProductPage() {
  return (
    <main className="product-page-container">
      <nav className="breadcrumb">
        <div className="breadcrumb-item">
          <Link to="/">Home</Link>
          <span className="separator">/</span>
        </div>
        <div className="breadcrumb-item">
          <Link to="/sports-car">Sports Car</Link>
          <span className="separator">/</span>
        </div>
        <div className="breadcrumb-item">
          <span>Grotti Itali GTO Stinger TT</span>
        </div>
      </nav>

      <div className="product-detail-layout">
        
        {/* Image Slider */}
        <div className="product-gallery">
          {/* Radio Inputs to control state */}
          <input type="radio" name="gallery" id="gal-1" defaultChecked />
          <input type="radio" name="gallery" id="gal-2" />
          <input type="radio" name="gallery" id="gal-3" />

          {/* Main Display Area */}
          <div className="gallery-display">
            <figure className="gallery-slide slide-1">
              <img src="../../assets/StingerTT-GTAOe-front.png.jpg" alt="Stinger View 1" />
            </figure>
            <figure className="gallery-slide slide-2">
              <img src="../../assets/StingerTT-GTAOe-front.png.jpg" alt="Stinger View 2" />
            </figure>
            <figure className="gallery-slide slide-3">
              <img src="../../assets/StingerTT-GTAOe-front.png.jpg" alt="Stinger View 3" />
            </figure>
          </div>

          {/* Thumbnails */}
          <div className="gallery-thumbnails">
            <label htmlFor="gal-1" className="thumb thumb-1">
              <img src="../../assets/StingerTT-GTAOe-front.png.jpg" alt="Thumbnail 1" />
            </label>
            <label htmlFor="gal-2" className="thumb thumb-2">
              <img src="../../assets/StingerTT-GTAOe-front.png.jpg" alt="Thumbnail 2" />
            </label>
            <label htmlFor="gal-3" className="thumb thumb-3">
              <img src="../../assets/StingerTT-GTAOe-front.png.jpg" alt="Thumbnail 3" />
            </label>
          </div>
        </div>

        {/* Product Info */}
        <div className="product-info-section">
          <h1 className="product-title">Grotti Itali GTO Stinger TT</h1>
          <div className="product-meta">
            <span className="category-label">Category: Sports Car</span>
            <span className="sku">SKU: STINGER-TT-001</span>
          </div>
          
          <div className="product-price">$2,380,220</div>
          
          <div className="product-description">
            <p>
              The Grotti Itali GTO Stinger TT is a luxury sports car. Runs very fast
            </p>
          </div>

          <div className="product-actions">
            <div className="quantity-selector">
              <label htmlFor="qty" className="quantity-label">Qty:</label>
              <input type="number" id="qty" name="qty" min="1" defaultValue="1" />
            </div>
            <button className="add-cart-btn">Add to Cart</button>
          </div>
        </div>

      </div>
    </main>
  );
}
