import React, { useEffect, useState, useContext } from 'react';
import { Link, useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CartContext } from '../App';
import {
  clampQuantityInput,
  MAX_QTY,
  sanitizeDisplayText,
  sanitizeImageIdForPath,
} from '../lib/validation';

const API = '';

export default function HomePage() {
  const { categoryIdName } = useParams();
  const navigate = useNavigate();
  const catid = categoryIdName ? categoryIdName.split('-')[0] : null;

  const { addToCart } = useContext(CartContext);
  const [categories, setCategories] = useState([]);
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [quantities, setQuantities] = useState({});

  function getQty(pid) { return quantities[pid] ?? 1; }
  function setQty(pid, val) {
    setQuantities(prev => ({ ...prev, [pid]: clampQuantityInput(val) }));
  }

  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then(r => r.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = catid
      ? `${API}/api/products?catid=${catid}`
      : `${API}/api/products`;
    fetch(url)
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [catid]);

  const activeCategory = categories.find(c => String(c.catid) === catid);

  return (
    <main className="home-page">
      <div className="red-separator"></div>

      {/* Category nav */}
      <button className="all-button" onClick={() => navigate('/')}>All</button>
      {categories.map(cat => (
        <button
          key={cat.catid}
          className="sports-button"
          onClick={() => navigate(`/${cat.catid}-${cat.name.replace(/\s+/g, '-')}`)}
        >
          {sanitizeDisplayText(cat.name, 255)}
        </button>
      ))}

      {/* Breadcrumb */}
      <div>
        <Link to="/"><label>/Home</label></Link>
        {activeCategory && <label> / {sanitizeDisplayText(activeCategory.name, 255)}</label>}
      </div>

      {loading && <p>Loading...</p>}

      <div className="flex flex-wrap justify-start gap-4 max-w-6xl mx-auto p-4 product-grid">
        {products.map(product => {
          const safeImageId = sanitizeImageIdForPath(product.image);
          const safeName = sanitizeDisplayText(product.name, 255);
          const cat = activeCategory || categories.find(c => c.catid === product.catid);
          const catSlug = cat ? `${cat.catid}-${cat.name.replace(/\s+/g, '-')}` : '0-Category';
          const prodSlug = `${product.pid}-${product.name.replace(/\s+/g, '-')}`;

          return (
            <Card key={product.pid} className="!bg-red-950 product-card">
              <CardContent>
                <Link to={`/${catSlug}/${prodSlug}`}>
                  <img
                    src={safeImageId
                      ? `${API}/uploads/${encodeURIComponent(safeImageId)}_thumb.jpg`
                      : '/assets/legendary.png'}
                    alt={safeName}
                    className="w-72 h-48 object-cover"
                  />
                </Link>
                <br />
                <div className="flex justify-between items-center">
                  <h3 className="text">{safeName}</h3>
                  <span className="text">${Number(product.price).toLocaleString()}</span>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <label className="text-white">Qty:</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    max={MAX_QTY}
                    inputMode="numeric"
                    value={getQty(product.pid)}
                    onChange={e => setQty(product.pid, e.target.value)}
                    className="w-16 px-2 py-1"
                  />
                </div>
                <button onClick={() => addToCart(product, getQty(product.pid))}>Add to Cart</button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <iframe src="https://www.facebook.com/plugins/share_button.php?href=https%3A%2F%2Fgoogle.com%2F&amp;layout=button_count&amp;size=small" width="106" height="28" style={{border: "none", overflow: "hidden"}} scrolling="no" frameBorder="0" allowFullScreen={true} allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
      </div>
    </main>
  );
}
