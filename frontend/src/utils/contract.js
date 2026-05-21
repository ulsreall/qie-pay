     1|import { ethers } from 'ethers';
     2|import { CONTRACT_ADDRESS, QIEPAY_ABI, CHAIN_ID, CHAIN_ID_HEX, CHAIN_NAME, RPC_URL } from './constants';
     3|import {
     4|  DEMO_ADDRESS,
     5|  DEMO_PAYMENTS,
     6|  DEMO_EARNINGS,
     7|  DEMO_BALANCE,
     8|} from './demoData';
     9|
    10|// Get provider (read-only)
    11|export function getProvider() {
    12|  if (typeof window !== 'undefined' && window.ethereum) {
    13|    return new ethers.BrowserProvider(window.ethereum);
    14|  }
    15|  return new ethers.JsonRpcProvider(RPC_URL);
    16|}
    17|
    18|// Get signer (requires wallet)
    19|export async function getSigner() {
    20|  if (!window.ethereum) {
    21|    throw new Error('Wallet not found. Please install QIE Wallet or MetaMask.');
    22|  }
    23|  const provider = new ethers.BrowserProvider(window.ethereum);
    24|  return provider.getSigner();
    25|}
    26|
    27|// Get contract with signer (for writes)
    28|export async function getContract() {
    29|  const signer = await getSigner();
    30|  return new ethers.Contract(CONTRACT_ADDRESS, QIEPAY_ABI, signer);
    31|}
    32|
    33|// Get contract with provider (for reads)
    34|export function getReadContract() {
    35|  const provider = getProvider();
    36|  return new ethers.Contract(CONTRACT_ADDRESS, QIEPAY_ABI, provider);
    37|}
    38|
    39|// Connect wallet
    40|export async function connectWallet() {
    41|  if (!window.ethereum) {
    42|    throw new Error('Wallet not found. Please install QIE Wallet or MetaMask.');
    43|  }
    44|
    45|  const accounts = await window.ethereum.request({
    46|    method: 'eth_requestAccounts',
    47|  });
    48|
    49|  // Try to switch to QIE network
    50|  try {
    51|    await window.ethereum.request({
    52|      method: 'wallet_switchEthereumChain',
    53|      params: [{ chainId: CHAIN_ID_HEX }],
    54|    });
    55|  } catch (switchError) {
    56|    // Chain not added, try to add it
    57|    if (switchError.code === 4902) {
    58|      try {
    59|        await window.ethereum.request({
    60|          method: 'wallet_addEthereumChain',
    61|          params: [
    62|            {
    63|              chainId: CHAIN_ID_HEX,
    64|              chainName: CHAIN_NAME,
    65|              rpcUrls: [RPC_URL],
    66|              nativeCurrency: {
    67|                name: 'QIE',
    68|                symbol: 'QIE',
    69|                decimals: 18,
    70|              },
    71|            },
    72|          ],
    73|        });
    74|      } catch (addError) {
    75|        console.error('Failed to add QIE network:', addError);
    76|      }
    77|    }
    78|  }
    79|
    80|  const provider = new ethers.BrowserProvider(window.ethereum);
    81|  const signer = await provider.getSigner();
    82|  const address = await signer.getAddress();
    83|  const balance = await provider.getBalance(address);
    84|
    85|  return {
    86|    address,
    87|    balance: ethers.formatEther(balance),
    88|    provider,
    89|    signer,
    90|  };
    91|}
    92|
    93|// Get wallet balance
    94|export async function getBalance(address) {
    95|  const provider = getProvider();
    96|  const balance = await provider.getBalance(address);
    97|  return ethers.formatEther(balance);
    98|}
    99|
   100|// Register as merchant
   101|export async function registerMerchant() {
   102|  const contract = await getContract();
   103|  const tx = await contract.registerMerchant();
   104|  return tx.wait();
   105|}
   106|
   107|// Create payment
   108|export async function createPayment(description, orderId, amountInQIE) {
   109|  const amountWei = ethers.parseEther(amountInQIE.toString());
   110|
   111|  // Try direct approach for QIE Wallet compatibility
   112|  if (window.ethereum) {
   113|    try {
   114|      const provider = new ethers.BrowserProvider(window.ethereum);
   115|      const signer = await provider.getSigner();
   116|      const address = await signer.getAddress();
   117|
   118|      // Encode function call manually
   119|      const iface = new ethers.Interface(QIEPAY_ABI);
   120|      const data = iface.encodeFunctionData('createPayment', [description, orderId, amountWei]);
   121|
   125|
   126|      // Send raw transaction via wallet
   127|      const txHash = await window.ethereum.request({
   128|        method: 'eth_sendTransaction',
   129|        params: [{
   130|          from: address,
   131|          to: CONTRACT_ADDRESS,
   132|          data: data,
   133|        }],
   134|      });
   135|
   137|
   138|      // Wait for receipt
   139|      const receipt = await provider.waitForTransaction(txHash);
   141|
   142|      // Parse event
   143|      const contract = new ethers.Contract(CONTRACT_ADDRESS, QIEPAY_ABI, provider);
   144|      for (const log of receipt.logs) {
   145|        try {
   146|          const parsed = contract.interface.parseLog(log);
   147|          if (parsed && parsed.name === 'PaymentCreated') {
   148|            return {
   149|              paymentId: parsed.args.paymentId.toString(),
   150|              receipt,
   151|            };
   152|          }
   153|        } catch {
   154|          continue;
   155|        }
   156|      }
   157|
   158|      return { paymentId: null, receipt };
   159|    } catch (err) {
   160|      console.error('Create payment error:', err);
   161|      throw err;
   162|    }
   163|  }
   164|
   165|  // Fallback to ethers.js
   166|  const contract = await getContract();
   167|  const tx = await contract.createPayment(description, orderId, amountWei);
   168|  const receipt = await tx.wait();
   169|
   170|  const event = receipt.logs.find((log) => {
   171|    try {
   172|      const parsed = contract.interface.parseLog(log);
   173|      return parsed.name === 'PaymentCreated';
   174|    } catch {
   175|      return false;
   176|    }
   177|  });
   178|
   179|  if (event) {
   180|    const parsed = contract.interface.parseLog(event);
   181|    return {
   182|      paymentId: parsed.args.paymentId.toString(),
   183|      receipt,
   184|    };
   185|  }
   186|
   187|  return { paymentId: null, receipt };
   188|}
   189|
   190|// Pay for a payment
   191|// Pay for a payment
   192|export async function payForPayment(paymentId, amountInQIE) {
   193|  const value = ethers.parseEther(amountInQIE.toString());
   194|
   195|  // Direct approach for QIE Wallet compatibility
   196|  if (window.ethereum) {
   197|    const provider = new ethers.BrowserProvider(window.ethereum);
   198|    const signer = await provider.getSigner();
   199|    const address = await signer.getAddress();
   200|
   201|    const iface = new ethers.Interface(QIEPAY_ABI);
   202|    const data = iface.encodeFunctionData('pay', [BigInt(paymentId)]);
   203|
   206|
   207|    const txHash = await window.ethereum.request({
   208|      method: 'eth_sendTransaction',
   209|      params: [{
   210|        from: address,
   211|        to: CONTRACT_ADDRESS,
   212|        data: data,
   213|        value: '0x' + value.toString(16),
   214|      }],
   215|    });
   216|
   218|    return await provider.waitForTransaction(txHash);
   219|  }
   220|
   221|  // Fallback
   222|  const contract = await getContract();
   223|  const tx = await contract.pay(paymentId, { value });
   224|  return tx.wait();
   225|}
   226|
   227|// Helper: send contract transaction via eth_sendTransaction
   228|async function sendContractTx(functionName, args = [], txOverrides = {}) {
   229|  if (window.ethereum) {
   230|    const provider = new ethers.BrowserProvider(window.ethereum);
   231|    const signer = await provider.getSigner();
   232|    const address = await signer.getAddress();
   233|
   234|    const iface = new ethers.Interface(QIEPAY_ABI);
   235|    const data = iface.encodeFunctionData(functionName, args);
   236|
   237|    const params = {
   238|      from: address,
   239|      to: CONTRACT_ADDRESS,
   240|      data: data,
   241|      ...txOverrides,
   242|    };
   243|
   244|    const txHash = await window.ethereum.request({
   245|      method: 'eth_sendTransaction',
   246|      params: [params],
   247|    });
   248|
   249|    return await provider.waitForTransaction(txHash);
   250|  }
   251|
   252|  // Fallback
   253|  const contract = await getContract();
   254|  const tx = await contract[functionName](...args, txOverrides);
   255|  return tx.wait();
   256|}
   257|
   258|// Settle payment (merchant)
   259|export async function settlePayment(paymentId) {
   260|  return sendContractTx('settlePayment', [BigInt(paymentId)]);
   261|}
   262|
   263|// Refund payment
   264|export async function refundPayment(paymentId) {
   265|  return sendContractTx('refundPayment', [BigInt(paymentId)]);
   266|}
   267|
   268|// Cancel payment
   269|export async function cancelPayment(paymentId) {
   270|  return sendContractTx('cancelPayment', [BigInt(paymentId)]);
   271|}
   272|
   273|// Get payment details
   274|export async function getPayment(paymentId) {
   275|  // Check demo payments first
   276|  const demoPayment = DEMO_PAYMENTS.find((p) => p.id === paymentId || p.id === String(paymentId));
   277|  if (demoPayment) return { ...demoPayment };
   278|
   279|  const contract = getReadContract();
   280|  const payment = await contract.getPayment(paymentId);
   281|  return formatPayment(payment);
   282|}
   283|
   284|// Get merchant payments
   285|export async function getMerchantPayments(merchantAddress) {
   286|  // If requesting demo address payments, return demo data
   287|  if (merchantAddress === DEMO_ADDRESS) {
   288|    return [...DEMO_PAYMENTS];
   289|  }
   290|
   291|  const contract = getReadContract();
   292|  const paymentIds = await contract.getMerchantPayments(merchantAddress);
   293|
   294|  const payments = await Promise.all(
   295|    paymentIds.map(async (id) => {
   296|      try {
   297|        return await getPayment(id.toString());
   298|      } catch {
   299|        return null;
   300|      }
   301|    })
   302|  );
   303|
   304|  return payments.filter(Boolean);
   305|}
   306|
   307|// Get merchant earnings
   308|export async function getMerchantEarnings(merchantAddress) {
   309|  if (merchantAddress === DEMO_ADDRESS) {
   310|    return DEMO_EARNINGS;
   311|  }
   312|
   313|  const contract = getReadContract();
   314|  const earnings = await contract.getMerchantEarnings(merchantAddress);
   315|  return ethers.formatEther(earnings);
   316|}
   317|
   318|// Check if address is registered merchant
   319|export async function isMerchant(address) {
   320|  if (address === DEMO_ADDRESS) {
   321|    return true;
   322|  }
   323|
   324|  const contract = getReadContract();
   325|  return contract.merchants(address);
   326|}
   327|
   328|// Check if merchant is registered, register if not
   329|export async function ensureMerchant() {
   330|  const signer = await getSigner();
   331|  const address = await signer.getAddress();
   332|  const registered = await isMerchant(address);
   333|
   334|  if (!registered) {
   335|    const receipt = await registerMerchant();
   336|    return { registered: true, isNew: true, receipt };
   337|  }
   338|
   339|  return { registered: true, isNew: false };
   340|}
   341|
   342|// Format payment struct from contract
   343|function formatPayment(payment) {
   344|  return {
   345|    id: payment.id.toString(),
   346|    merchant: payment.merchant,
   347|    customer: payment.customer,
   348|    amount: ethers.formatEther(payment.amount),
   349|    fee: ethers.formatEther(payment.fee),
   350|    createdAt: Number(payment.createdAt),
   351|    settledAt: Number(payment.settledAt),
   352|    description: payment.description,
   353|    orderId: payment.orderId,
   354|    status: Number(payment.status),
   355|  };
   356|}
   357|
   358|// Listen for account changes
   359|export function onAccountChange(callback) {
   360|  if (window.ethereum) {
   361|    window.ethereum.on('accountsChanged', callback);
   362|    window.ethereum.on('chainChanged', () => window.location.reload());
   363|  }
   364|}
   365|
   366|// Check if wallet is connected
   367|// Returns real wallet data if available, otherwise returns demo data for demo mode
   368|export async function checkConnection() {
   369|  if (!window.ethereum) {
   370|    // No wallet provider → enter demo mode
   371|    return {
   372|      address: DEMO_ADDRESS,
   373|      balance: DEMO_BALANCE,
   374|      isDemo: true,
   375|    };
   376|  }
   377|
   378|  try {
   379|    const accounts = await window.ethereum.request({
   380|      method: 'eth_accounts',
   381|    });
   382|    if (accounts.length === 0) {
   383|      // Wallet installed but no account connected → demo mode
   384|      return {
   385|        address: DEMO_ADDRESS,
   386|        balance: DEMO_BALANCE,
   387|        isDemo: true,
   388|      };
   389|    }
   390|
   391|    const provider = new ethers.BrowserProvider(window.ethereum);
   392|    const balance = await provider.getBalance(accounts[0]);
   393|
   394|    return {
   395|      address: accounts[0],
   396|      balance: ethers.formatEther(balance),
   397|      isDemo: false,
   398|    };
   399|  } catch {
   400|    return {
   401|      address: DEMO_ADDRESS,
   402|      balance: DEMO_BALANCE,
   403|      isDemo: true,
   404|    };
   405|  }
   406|}
   407|