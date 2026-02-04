import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <main className="home-page">
      <div className="red-separator"></div>
      <Link to="/">
        <button className="all-button">All</button>
      </Link>
      <Link to="/sports-car">
        <button className="sports-button">Sports Car</button>
      </Link>
      <Link to="/muscle-car">
        <button className="muscle-button">Muscle Car</button>
      </Link>
      <Link to="/motorcycle">
        <button className="motorcycle-button">Motorcycle</button>
      </Link>
      <Link to="/">
        <label>/Home</label>
      </Link>
      <div className="flex flex-wrap justify-center gap-4 max-w-6xl mx-auto p-4 product-grid">
        {/* Cars of Different Categories */}
        {/* All Product Pages lead to Hardcoded Demo page /sports-car/product/3 For Now*/}
        <Card className="!bg-red-950 product-card" data-category="sports" product="1">
            <CardContent>
              <Link to="/sports-car/product/3">
                <img src="../assets/811A-GTAO-front.webp" className='w-72 h-48 object-cover' />
              </Link>
              <br></br>       
              <div className="flex justify-between items-center">
                <h3 className="text">PFISTER 811</h3>
                <span className="text">$1,135,220</span>
              </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-1">
              <div className="flex items-center gap-2">
                <label htmlFor="qty-1" className="text-white">Qty:</label>
                <input type="number" id="qty-1" name="quantity" min="1" defaultValue="1" className="w-16 px-2 py-1" />
              </div>
              <button>Add to Cart</button>
              <form></form>
            </CardFooter>
        </Card>
        <Card className="!bg-red-950 product-card" data-category="muscle" product="1">
            <CardContent>
            <Link to="/sports-car/product/3">
              <img src="../assets/190z-GTAO-front.webp" className='w-72 h-48 object-cover' />
            </Link>
            <br></br>       
            <div className="flex justify-between items-center">
              <h3 className="text">KARIN 190Z</h3>
              <span className="text">$1,900,220</span>
            </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <label htmlFor="qty-2" className="text-white">Qty:</label>
              <input type="number" id="qty-2" name="quantity" min="1" defaultValue="1" className="w-16 px-2 py-1" />
            </div>
            <button>Add to Cart</button>
            </CardFooter>
        </Card>
        
    
        <Card className="!bg-red-950 product-card" data-category="muscle" product="2">
            <CardContent>
            <Link to="/sports-car/product/3">
              <img src="../assets/Deviant-GTAO-front.webp" className='w-72 h-48 object-cover' />
            </Link>
            <br></br>       
            <div className="flex justify-between items-center">
              <h3 className="text">Deviant</h3>
              <span className="text">$512,000</span>
            </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <label htmlFor="qty-3" className="text-white">Qty:</label>
              <input type="number" id="qty-3" name="quantity" min="1" defaultValue="1" className="w-16 px-2 py-1" />
            </div>
            <button>Add to Cart</button>
            </CardFooter>
        </Card>
         <Card className="!bg-red-950 product-card" data-category="sports" product="2">
            <CardContent>
            <Link to="/sports-car/product/3">
              <img src="../assets/pariah.jpg.jpg" className='w-72 h-48 object-cover' />
            </Link>
            <br></br>       
            <div className="flex justify-between items-center">
              <h3 className="text">Ocelot Pariah</h3>
              <span className="text">$2,100,220</span>
            </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <label htmlFor="qty-4" className="text-white">Qty:</label>
              <input type="number" id="qty-4" name="quantity" min="1" defaultValue="1" className="w-16 px-2 py-1" />
            </div>
            <button>Add to Cart</button>
            </CardFooter>
        </Card>
        
        
        <Card className="!bg-red-950 product-card" data-category="sports" product="3">
            <CardContent>
            <Link to="/sports-car/product/3">
              <img src="../assets/StingerTT-GTAOe-front.png.jpg" className='w-72 h-48 object-cover' />
            </Link>
            <br></br>       
            <div className="flex justify-between items-center">
              <h3 className="text">Grotti Itali GTO Stinger TT</h3>
              <span className="text">$2,380,220</span>
            </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <label htmlFor="qty-5" className="text-white">Qty:</label>
              <input type="number" id="qty-5" name="quantity" min="1" defaultValue="1" className="w-16 px-2 py-1" />
            </div>
            <button>Add to Cart</button>
            </CardFooter>
        </Card>
        

        <Card className="!bg-red-950 product-card" data-category="motorcycle" product="1">
            <CardContent>
            <Link to="/sports-car/product/3">
              <img src="../assets/Bagger-GTAV-front.webp" className='w-72 h-48 object-cover' />
            </Link>
            <br></br>       
            <div className="flex justify-between items-center">
              <h3 className="text">Bagger</h3>
              <span className="text">$16,000</span>
            </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <label htmlFor="qty-6" className="text-white">Qty:</label>
              <input type="number" id="qty-6" name="quantity" min="1" defaultValue="1" className="w-16 px-2 py-1" />
            </div>
            <button>Add to Cart</button>
            </CardFooter>
        </Card>
      </div>
    </main>
  );
}
