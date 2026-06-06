import { useState, useEffect } from 'react';
import { Check, QrCode, Banknote, X, Image as ImageIcon } from 'lucide-react';
import { API_URL } from '../../../utils/api';

interface PaymentMethodsProps {
  accessToken: string;
}

interface PaymentMethod {
  type: 'cod' | 'qris';
  qrisFileName?: string;
  qrisUrl?: string;
}

export function PaymentMethods({ accessToken }: PaymentMethodsProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [enableCOD, setEnableCOD] = useState(false);
  const [enableQRIS, setEnableQRIS] = useState(false);
  const [qrisFile, setQrisFile] = useState<File | null>(null);
  const [qrisPreview, setQrisPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(
        `${API_URL}/payment-methods`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();
      if (response.ok) {
        setMethods(data.methods || []);
        setEnableCOD(data.methods?.some((m: any) => m.type === 'cod') || false);

        const qrisMethod = data.methods?.find((m: any) => m.type === 'qris');
        setEnableQRIS(!!qrisMethod);
        if (qrisMethod?.qrisUrl) {
          setQrisPreview(qrisMethod.qrisUrl);
        }
      }
    } catch (err) {
      console.error('Error fetching payment methods:', err);
    }
  };

  const handleQrisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrisFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrisPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const paymentMethods: PaymentMethod[] = [];

      if (enableCOD) {
        paymentMethods.push({ type: 'cod' });
      }

      if (enableQRIS) {
        if (!qrisFile && !methods.find(m => m.type === 'qris')?.qrisFileName) {
          throw new Error('Silakan upload QR Code QRIS');
        }

        let qrisFileName = methods.find(m => m.type === 'qris')?.qrisFileName;

        // Upload new QRIS if file selected
        if (qrisFile) {
          const formData = new FormData();
          formData.append('file', qrisFile);

          const uploadResponse = await fetch(
            `${API_URL}/upload/qris`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`
              },
              body: formData
            }
          );

          const uploadData = await uploadResponse.json();

          if (!uploadResponse.ok) {
            throw new Error(uploadData.error || 'Upload failed');
          }

          qrisFileName = uploadData.fileName;
        }

        paymentMethods.push({
          type: 'qris',
          qrisFileName
        });
      }

      // Save payment methods
      const response = await fetch(
        `${API_URL}/payment-methods`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ methods: paymentMethods })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save payment methods');
      }

      setSuccess('Metode pembayaran berhasil disimpan!');
      setQrisFile(null);
      fetchPaymentMethods();
    } catch (err: any) {
      console.error('Error saving payment methods:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Metode Pembayaran</h2>

      <div className="bg-white rounded-xl shadow-md p-6">
        <p className="text-gray-600 mb-6">
          Pilih metode pembayaran yang tersedia untuk pelanggan
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* COD Option */}
          <div className={`border-2 rounded-xl p-6 cursor-pointer transition ${
            enableCOD ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`} onClick={() => setEnableCOD(!enableCOD)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${enableCOD ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <Banknote size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Cash on Delivery (COD)</h3>
                  <p className="text-sm text-gray-600">Bayar saat barang diterima</p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                enableCOD ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
              }`}>
                {enableCOD && <Check size={16} className="text-white" />}
              </div>
            </div>
          </div>

          {/* QRIS Option */}
          <div className={`border-2 rounded-xl p-6 transition ${
            enableQRIS ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setEnableQRIS(!enableQRIS)}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${enableQRIS ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <QrCode size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">QRIS</h3>
                  <p className="text-sm text-gray-600">Transfer via QR Code</p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                enableQRIS ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
              }`}>
                {enableQRIS && <Check size={16} className="text-white" />}
              </div>
            </div>

            {enableQRIS && (
              <div className="mt-4 pt-4 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload QR Code QRIS
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {qrisPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={qrisPreview}
                        alt="QRIS Preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQrisFile(null);
                          setQrisPreview('');
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <ImageIcon size={48} className="text-gray-400 mb-3" />
                        <span className="text-sm text-gray-600">Klik untuk upload QR Code</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrisChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading || (!enableCOD && !enableQRIS)}
          className="w-full mt-8 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Menyimpan...' : 'Simpan Metode Pembayaran'}
        </button>
      </div>
    </div>
  );
}
