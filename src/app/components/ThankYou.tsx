import { CheckCircle } from 'lucide-react';

interface ThankYouProps {
  onBackToShop: () => void;
}

export function ThankYou({ onBackToShop }: ThankYouProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terima Kasih!</h1>
          <p className="text-gray-600">Pesanan Anda telah berhasil dikirim</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <p className="text-sm text-gray-700 leading-relaxed">
            Pesanan Anda sedang diproses oleh penjual. Anda akan dihubungi segera untuk konfirmasi dan pengiriman.
          </p>
        </div>

        <button
          onClick={onBackToShop}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Kembali ke Toko
        </button>
      </div>
    </div>
  );
}
