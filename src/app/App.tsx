import { useState } from 'react';
import { OwnerLogin } from './components/OwnerLogin';
import { OwnerRegister } from './components/OwnerRegister';
import { OwnerDashboard } from './components/OwnerDashboard';
import { CustomerStorefront } from './components/CustomerStorefront';
import { CustomerCheckout } from './components/CustomerCheckout';
import { ThankYou } from './components/ThankYou';

type Page = 'owner-login' | 'owner-register' | 'owner-dashboard' | 'customer-shop' | 'customer-checkout' | 'thank-you';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get('shop');
    const pathMatch = window.location.pathname.match(/\/shop\/([a-zA-Z0-9]+)/);

    if (shopParam || pathMatch) {
      return 'customer-shop';
    }
    return 'owner-login';
  });

  const [accessToken, setAccessToken] = useState<string>('');
  const [owner, setOwner] = useState<any>(null);
  const [shopId, setShopId] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get('shop');
    const pathMatch = window.location.pathname.match(/\/shop\/([a-zA-Z0-9]+)/);
    return shopParam || (pathMatch ? pathMatch[1] : '');
  });
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const handleLoginSuccess = (token: string, ownerData: any) => {
    setAccessToken(token);
    setOwner(ownerData);
    setCurrentPage('owner-dashboard');
  };

  const handleRegisterSuccess = (newShopId: string) => {
    alert(`Akun berhasil dibuat! Silakan login dengan email dan password Anda.`);
    setCurrentPage('owner-login');
  };

  const handleLogout = () => {
    setAccessToken('');
    setOwner(null);
    setCurrentPage('owner-login');
  };

  const handleCheckout = (cartItems: any[], methods: any[]) => {
    setCart(cartItems);
    setPaymentMethods(methods);
    setCurrentPage('customer-checkout');
  };

  const handleOrderSuccess = () => {
    setCart([]);
    setPaymentMethods([]);
    setCurrentPage('thank-you');
  };

  const handleBackToShop = () => {
    setCurrentPage('customer-shop');
  };

  const handleBackFromCheckout = () => {
    setCurrentPage('customer-shop');
  };

  return (
    <>
      {currentPage === 'owner-login' && (
        <OwnerLogin
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setCurrentPage('owner-register')}
        />
      )}

      {currentPage === 'owner-register' && (
        <OwnerRegister
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setCurrentPage('owner-login')}
        />
      )}

      {currentPage === 'owner-dashboard' && (
        <OwnerDashboard
          accessToken={accessToken}
          owner={owner}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'customer-shop' && (
        <CustomerStorefront
          shopId={shopId}
          onCheckout={handleCheckout}
        />
      )}

      {currentPage === 'customer-checkout' && (
        <CustomerCheckout
          shopId={shopId}
          cart={cart}
          paymentMethods={paymentMethods}
          onBack={handleBackFromCheckout}
          onSuccess={handleOrderSuccess}
        />
      )}

      {currentPage === 'thank-you' && (
        <ThankYou onBackToShop={handleBackToShop} />
      )}
    </>
  );
}

export default App;
