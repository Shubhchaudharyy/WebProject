/* Flipkart-style price breakdown */
const PAYMENT_OFFERS = [
  "Extra 10% Up to ₹35 Off on UPI",
  "Flat ₹50 off on ShopVerse Pay Later",
  "₹50 Cashback on BHIM Payments App",
  "5% cashback on Axis Bank Debit Card",
  "5% off up to ₹100 on ShopVerse Credit Card"
];

function calculateBill(cart, options = {}) {
  const useCoins = options.useSuperCoins !== false;
  let mrpTotal = 0;
  let sellingTotal = 0;

  cart.forEach((item) => {
    const mrp = item.mrp || item.price * 1.4;
    mrpTotal += mrp * item.qty;
    sellingTotal += item.price * item.qty;
  });

  const extraDiscount = Math.round(mrpTotal - sellingTotal);
  const specialPrice = sellingTotal;
  const couponDiscount = cart.length > 0 ? Math.min(Math.round(sellingTotal * 0.13), 250) : 0;
  let total = Math.max(0, specialPrice - couponDiscount);
  const superCoins = cart.length > 0 ? 10 : 0;
  const totalWithCoins = useCoins ? Math.max(0, total - superCoins) : total;

  return {
    mrpTotal,
    sellingTotal,
    extraDiscount,
    specialPrice,
    couponDiscount,
    couponText: "Get extra 13% off upto ₹250 on " + cart.reduce((s, i) => s + i.qty, 0) + " item(s) (price inclusive of cashback/coupon)",
    total,
    superCoins,
    totalWithCoins,
    useCoins
  };
}

function renderPriceDetails(containerId, bill, onClose) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const closeBtn =
    onClose === false
      ? ""
      : `<button type="button" class="price-close" onclick="${onClose || "history.back()"}">×</button>`;

  el.innerHTML = `
    <div class="price-details-panel">
      <div class="price-details-header">
        ${closeBtn}
        <h3>Price Details</h3>
      </div>
      <div class="price-rows">
        <div class="price-row"><span>MRP</span><span class="muted">₹${bill.mrpTotal.toLocaleString("en-IN")}</span></div>
        <div class="price-row"><span>Selling Price</span><span>₹${bill.sellingTotal.toLocaleString("en-IN")}</span></div>
        <div class="price-row"><span>Extra Discount</span><span class="save">- ₹${bill.extraDiscount.toLocaleString("en-IN")}</span></div>
        <div class="price-row"><span>Special Price</span><span>₹${bill.specialPrice.toLocaleString("en-IN")}</span></div>
        <div class="price-row coupon-row">
          <span class="coupon-desc">${bill.couponText}</span>
          <span class="save">- ₹${bill.couponDiscount.toLocaleString("en-IN")}</span>
        </div>
      </div>
      <div class="price-divider"></div>
      <div class="price-row total-row">
        <span>Total</span>
        <span id="bill-total-display">₹${(bill.useCoins ? bill.totalWithCoins : bill.total).toLocaleString("en-IN")}</span>
      </div>
      <div class="supercoins-block">
        <h4>Pay Using ShopCoins</h4>
        <p>Use ShopCoins at Order Summary and get this order at <strong>₹${bill.totalWithCoins.toLocaleString("en-IN")}</strong> + 🪙 ${bill.superCoins}</p>
        <label class="coin-toggle">
          <input type="checkbox" id="use-supercoins" ${bill.useCoins ? "checked" : ""}>
          Apply ShopCoins (save ₹${bill.superCoins})
        </label>
      </div>
      <div class="offers-block">
        <h4>Save more with these offers</h4>
        <ul class="offers-list">
          ${PAYMENT_OFFERS.map((o) => `<li><span class="offer-icon">🏷️</span>${o}</li>`).join("")}
        </ul>
      </div>
    </div>`;
}
