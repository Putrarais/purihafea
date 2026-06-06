import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Store } from 'lucide-react';
import { API_URL } from '../../../utils/api';

interface CustomerStorefrontProps {
  shopId: string;
  onCheckout: (cart: CartItem[], paymentMethods: any[]) => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  photoUrl: string;
}

interface CartItem extends Product {
  quantity: number;
}

export function CustomerStorefront({ shopId, onCheckout }: CustomerStorefrontProps) {
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchShopData();
  }, [shopId]);

  const fetchShopData = async () => {
    try {
      const response = await fetch(
        `${API_URL}/shop/${shopId}`,
        {
          
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Shop not found');
      }

      setShop(data.shop);
      setProducts(data.products || []);
      setPaymentMethods(data.paymentMethods || []);
    } catch (err: any) {
      console.error('Error fetching shop:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          return prevCart;
        }
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === productId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prevCart.filter(item => item.id !== productId);
    });
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Memuat toko...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Toko Tidak Ditemukan</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Store size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{shop?.name}</h1>
              <p className="text-sm text-gray-600">Toko Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Produk</h2>

        {products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-600">Belum ada produk tersedia</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const cartItem = cart.find(item => item.id === product.id);
              const quantityInCart = cartItem?.quantity || 0;

              return (
                <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <img
                    src={product.photoUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">{product.name}</h3>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-blue-600 font-bold text-xl">
                        Rp {product.price.toLocaleString('id-ID')}
                      </span>
                      <span className="text-sm text-gray-600">
                        Stok: {product.stock}
                      </span>
                    </div>

                    {quantityInCart > 0 ? (
                      <div className="flex items-center justify-between bg-blue-50 rounded-lg p-2">
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="bg-white text-blue-600 p-2 rounded-lg hover:bg-gray-100 transition"
                        >
                          <Minus size={18} />
                        </button>
                        <span className="font-semibold text-gray-900">{quantityInCart}</span>
                        <button
                          onClick={() => addToCart(product)}
                          disabled={quantityInCart >= product.stock}
                          className="bg-white text-blue-600 p-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {product.stock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">{getTotalItems()} item</p>
                <p className="text-xl font-bold text-blue-600">
                  Rp {getTotalAmount().toLocaleString('id-ID')}
                </p>
              </div>
              <button
                onClick={() => onCheckout(cart, paymentMethods)}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
              >
                <ShoppingCart size={20} />
                Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
