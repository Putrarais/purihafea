import { useState } from 'react';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { API_URL } from '../../../utils/api';

interface CustomerCheckoutProps {
  shopId: string;
  cart: any[];
  paymentMethods: any[];
  onBack: () => void;
  onSuccess: () => void;
}

export function CustomerCheckout({ shopId, cart, paymentMethods, onBack, onSuccess }: CustomerCheckoutProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handlePaymentProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!name || !address || !selectedPayment) {
        throw new Error('Silakan lengkapi semua data');
      }

      if (selectedPayment === 'qris' && !paymentProofFile) {
        throw new Error('Silakan upload bukti pembayaran untuk QRIS');
      }

      let paymentProofFileName = undefined;

      // Upload payment proof if needed
      if (paymentProofFile) {
        const formData = new FormData();
        formData.append('file', paymentProofFile);

        const uploadResponse = await fetch(
          `${API_URL}/upload/payment-proof`,
          {
            method: 'POST',
            headers: {},
            body: formData
          }
        );

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Upload failed');
        }

        paymentProofFileName = uploadData.fileName;
      }

      // Create order
      const orderData = {
        shopId,
        customerName: name,
        address,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        paymentMethod: selectedPayment,
        paymentProofFileName
      };

      const response = await fetch(
        `${API_URL}/orders`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      onSuccess();
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const qrisMethod = paymentMethods.find(m => m.type === 'qris');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft size={20} />
            Kembali
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Ringkasan Pesanan</h2>
            <div className="space-y-3">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
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
              <div className="pt-3 border-t flex justify-between items-center">
                <p className="text-lg font-semibold text-gray-900">Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  Rp {getTotalAmount().toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Informasi Pembeli</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nama Anda"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat Lengkap
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jalan, Kelurahan, Kecamatan, Kota, Kode Pos"
                  rows={3}
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Metode Pembayaran</h2>

            <div className="space-y-3">
              {paymentMethods.map((method, idx) => (
                <div key={idx}>
                  <label
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedPayment === method.type
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.type}
                      checked={selectedPayment === method.type}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="w-5 h-5 text-blue-600"
                      required
                    />
                    <span className="font-medium text-gray-900 uppercase">
                      {method.type === 'cod' ? 'Cash on Delivery (COD)' : method.type}
                    </span>
                  </label>

                  {method.type === 'qris' && selectedPayment === 'qris' && method.qrisUrl && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        Scan QR Code berikut untuk pembayaran:
                      </p>
                      <img
                        src={method.qrisUrl}
                        alt="QRIS Code"
                        className="max-w-xs mx-auto rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment Proof Upload for QRIS */}
          {selectedPayment === 'qris' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Bukti Pembayaran</h2>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {paymentProofPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={paymentProofPreview}
                      alt="Payment Proof"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentProofFile(null);
                        setPaymentProofPreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Upload size={48} className="text-gray-400 mb-3" />
                      <span className="text-sm text-gray-600 mb-1">Upload bukti transfer</span>
                      <span className="text-xs text-gray-500">PNG, JPG hingga 10MB</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePaymentProofChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Memproses Pesanan...' : 'Pesan Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
}
