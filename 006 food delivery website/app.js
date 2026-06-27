const hamburger = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");

hamburger.addEventListener("click", () => {
  mobileMenu.classList.toggle("mobile-menu-active");
});

var swiper = new Swiper(".mySwiper", {
  loop: true,
  navigation: {
    nextEl: "#next",
    prevEl: "#prev",
  },
});

//  ELEMENTS 
const cartIcon = document.querySelector(".cart-icon");
const cartTab = document.querySelector(".cart-tab");
const closebtn = document.querySelector(".close-btn");
const cardList = document.querySelector(".card-list"); 

const cartListEl = document.querySelector(".cart-list"); 
const cartTotalEl = document.querySelector(".cart-total"); 
const cartBadgeEl = document.querySelector(".cart-value"); 

// open/close cart
cartIcon.addEventListener("click", (e) => {
  e.preventDefault();
  cartTab.classList.add("cart-tab-active");
});
closebtn.addEventListener("click", (e) => {
  e.preventDefault();
  cartTab.classList.remove("cart-tab-active");
});


let productList = [];
let cart = {}; 


const parsePriceToNumber = (val) =>
  typeof val === "number" ? val : parseFloat(String(val).replace(/[^0-9.]/g, ""));

const formatCurrency = (num) => `$${Number(num || 0).toFixed(2)}`;

const saveCart = () => localStorage.setItem("cart", JSON.stringify(cart));
const loadCart = () => {
  try {
    const raw = localStorage.getItem("cart");
    cart = raw ? JSON.parse(raw) : {};
  } catch {
    cart = {};
  }
};

const getCartItems = () => Object.values(cart);

const updateCartBadge = () => {
  const count = getCartItems().reduce((sum, item) => sum + item.qty, 0);
  cartBadgeEl.textContent = String(count);
};

// RENDER PRODUCTS 
const showCards = () => {
  cardList.innerHTML = ""; // clear
  productList.forEach((product) => {
    const orderCard = document.createElement("div");
    orderCard.classList.add("order-card");

    orderCard.innerHTML = `
      <div class="card-img">
        <img src="${product.image}" alt="${product.name}" />
      </div>
      <h4>${product.name}</h4>
      <h4 class="price">${formatCurrency(product.price)}</h4>
      <a href="#" class="btn add-to-cart" data-id="${product.id}">Add to Cart</a>
    `;

    cardList.appendChild(orderCard);
  });
};


cardList.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-to-cart");
  if (!btn) return;
  e.preventDefault();

  const id = Number(btn.dataset.id);
  const product = productList.find((p) => p.id === id);
  if (!product) return;

  addToCart(product);
  cartTab.classList.add("cart-tab-active"); 
});

// CART RENDER 
const renderCart = () => {
  cartListEl.innerHTML = "";
  let total = 0;

  getCartItems().forEach((item) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    cartListEl.insertAdjacentHTML(
      "beforeend",
      `
      <div class="item" data-id="${item.id}">
        <div class="item-image">
          <img src="${item.image}" alt="${item.name}">
        </div>
        <div>
          <h4>${item.name}</h4>
          <h4 class="item-total">${formatCurrency(itemTotal)}</h4>
        </div>
        <div class="flex">
          <a href="#" class="quantity-btn" data-action="minus" data-id="${item.id}">
            <i class="fa-solid fa-minus"></i>
          </a>
          <h4 class="quantity-value">${item.qty}</h4>
          <a href="#" class="quantity-btn" data-action="plus" data-id="${item.id}">
            <i class="fa-solid fa-plus"></i>
          </a>
        </div>
      </div>
      `
    );
  });

  cartTotalEl.textContent = formatCurrency(total);
  updateCartBadge();
};


cartListEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".quantity-btn");
  if (!btn) return;
  e.preventDefault();

  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;

  if (action === "plus") changeQty(id, 1);
  if (action === "minus") changeQty(id, -1);
});

// CART ACTIONS 
const addToCart = (product) => {
  const id = product.id;
  if (cart[id]) {
    cart[id].qty += 1;
  } else {
    cart[id] = { ...product, qty: 1 };
  }
  saveCart();
  renderCart();
};

const changeQty = (id, delta) => {
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];
  saveCart();
  renderCart();
};

//  INIT 
const initApp = () => {
  loadCart();           
  renderCart();        

  fetch("products.json")
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      return response.json();
    })
    .then((data) => {
      const rawList = Array.isArray(data) ? data : data.products;
      productList = (rawList || []).map((p) => ({
        id: p.id,
        name: p.name,
        price: parsePriceToNumber(p.price),
        image: p.image,
      }));
      showCards();
    })
    .catch((err) => console.error("Error loading products.json:", err));
};

initApp();
