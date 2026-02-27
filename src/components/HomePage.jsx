import React, { useEffect, useState, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CartContext } from '../App';

const API = 'http://localhost:3001';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const catid = searchParams.get('catid');

  const { addToCart } = useContext(CartContext);
  const [categories, setCategories] = useState([]);
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [quantities, setQuantities] = useState({});

  function getQty(pid) { return quantities[pid] ?? 1; }
  function setQty(pid, val) {
    setQuantities(prev => ({ ...prev, [pid]: Math.max(1, parseInt(val) || 1) }));
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
      <button className="all-button" onClick={() => setSearchParams({})}>All</button>
      {categories.map(cat => (
        <button
          key={cat.catid}
          className="sports-button"
          onClick={() => setSearchParams({ catid: cat.catid })}
        >
          {cat.name}
        </button>
      ))}

      {/* Breadcrumb */}
      <div>
        <Link to="/"><label>/Home</label></Link>
        {activeCategory && <label> / {activeCategory.name}</label>}
      </div>

      {loading && <p>Loading...</p>}

      <div className="flex flex-wrap justify-center gap-4 max-w-6xl mx-auto p-4 product-grid">
        {products.map(product => (
          <Card key={product.pid} className="!bg-red-950 product-card">
            <CardContent>
              <Link to={`/product/${product.pid}`}>
                <img
                  src={product.image
                    ? `${API}/uploads/${product.image}_thumb.jpg`
                    : '/assets/legendary.png'}
                  alt={product.name}
                  className="w-72 h-48 object-cover"
                />
              </Link>
              <br />
              <div className="flex justify-between items-center">
                <h3 className="text">{product.name}</h3>
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
                  value={getQty(product.pid)}
                  onChange={e => setQty(product.pid, e.target.value)}
                  className="w-16 px-2 py-1"
                />
              </div>
              <button onClick={() => addToCart(product, getQty(product.pid))}>Add to Cart</button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
