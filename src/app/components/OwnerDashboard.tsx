import { useState, useEffect } from 'react';
import { Store, Package, CreditCard, ShoppingBag, Share2, LogOut } from 'lucide-react';
import { AddProduct } from './AddProduct';
import { PaymentMethods } from './PaymentMethods';
import { OwnerOrders } from './OwnerOrders';

interface OwnerDashboardProps {
  accessToken: string;
  owner: any;
  onLogout: () => void;
}

export function OwnerDashboard({ accessToken, owner, onLogout }: OwnerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'payments' | 'orders'>('products');
  const [showShareLink, setShowShareLink] = useState(false);

  const shopUrl = `${window.location.origin}/shop/${owner.shopId}`;

  const copyShopLink = () => {
    navigator.clipboard.writeText(shopUrl);
    setShowShareLink(true);
    setTimeout(() => setShowShareLink(false), 3000);
  };

  const shareShopLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kunjungi Toko Saya',
          text: `Lihat produk-produk terbaik di toko online saya!`,
          url: shopUrl
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      copyShopLink();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Store size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard Toko</h1>
                <p className="text-sm text-gray-600">{owner.name}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <LogOut size={20} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Share Link Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Link Toko Anda</h2>
              <p className="text-sm text-blue-100">Bagikan link ini kepada pelanggan</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-mono truncate max-w-xs">
                {shopUrl}
              </div>
              <button
                onClick={shareShopLink}
                className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center justify-center gap-2"
              >
                <Share2 size={18} />
                {navigator.share ? 'Bagikan' : 'Salin Link'}
              </button>
            </div>
          </div>
          {showShareLink && (
            <div className="mt-3 bg-green-500 text-white px-4 py-2 rounded-lg text-sm text-center">
              Link berhasil disalin!
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition ${
                activeTab === 'products'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package size={20} />
              Produk
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition ${
                activeTab === 'payments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <CreditCard size={20} />
              Metode Pembayaran
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition ${
                activeTab === 'orders'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShoppingBag size={20} />
              Pesanan
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'products' && <AddProduct accessToken={accessToken} />}
        {activeTab === 'payments' && <PaymentMethods accessToken={accessToken} />}
        {activeTab === 'orders' && <OwnerOrders accessToken={accessToken} />}
      </div>
    </div>
  );
}
