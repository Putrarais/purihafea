import { useState, useEffect } from 'react';
import { ShoppingBag, MapPin, CreditCard, Image as ImageIcon } from 'lucide-react';
import { API_URL } from '../../../utils/api';

interface OwnerOrdersProps {
  accessToken: string;
}

interface Order {
  id: string;
  customerName: string;
  address: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  paymentMethod: string;
  paymentProofUrl?: string;
  status: string;
  createdAt: string;
}

export function OwnerOrders({ accessToken }: OwnerOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(
        `${API_URL}/orders`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalAmount = (items: any[]) => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Memuat pesanan...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Daftar Pesanan</h2>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum ada pesanan</h3>
          <p className="text-gray-600">Pesanan pelanggan akan muncul di sini</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{order.customerName}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                    {order.status === 'pending' ? 'Menunggu' : order.status}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Address */}
                <div className="flex gap-3">
                  <MapPin size={20} className="text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Alamat Pengiriman</p>
                    <p className="text-gray-900">{order.address}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="flex gap-3">
                  <ShoppingBag size={20} className="text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-2">Produk yang Dipesan</p>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <p className="font-semibold text-blue-600">
                            Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                          </p>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <p className="font-semibold text-gray-900">Total</p>
                        <p className="text-xl font-bold text-blue-600">
                          Rp {getTotalAmount(order.items).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="flex gap-3">
                  <CreditCard size={20} className="text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</p>
                    <p className="text-gray-900 font-medium uppercase">{order.paymentMethod}</p>
                  </div>
                </div>

                {/* Payment Proof */}
                {order.paymentProofUrl && (
                  <div className="flex gap-3">
                    <ImageIcon size={20} className="text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Bukti Pembayaran</p>
                      <img
                        src={order.paymentProofUrl}
                        alt="Payment Proof"
                        className="max-w-xs rounded-lg border cursor-pointer hover:opacity-80 transition"
                        onClick={() => setSelectedImage(order.paymentProofUrl!)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Payment Proof"
            className="max-w-full max-h-full rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
