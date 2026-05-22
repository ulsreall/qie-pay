import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkConnection } from '../utils/contract';
import { useEmailWallet } from '../utils/email-wallet';

export default function StorefrontRedirect() {
  const navigate = useNavigate();
  const { emailWallet } = useEmailWallet();

  useEffect(() => {
    (async () => {
      // Try email wallet first
      if (emailWallet?.address) {
        navigate(`/store/${emailWallet.address}`, { replace: true });
        return;
      }
      // Try extension wallet
      try {
        const conn = await checkConnection();
        if (conn?.address && !conn.isDemo) {
          navigate(`/store/${conn.address}`, { replace: true });
          return;
        }
      } catch {}
      // No wallet — go to connect
      navigate('/create', { replace: true });
    })();
  }, [emailWallet, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#09090B]">
      <p className="text-sm text-[#52525B]">Loading storefront...</p>
    </div>
  );
}
