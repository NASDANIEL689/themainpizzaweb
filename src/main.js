import './style.css';
import { supabase } from './supabase.js';

let cart = [];
let selectedRating = 0;

function groupCartItems(items) {
  const grouped = {};
  items.forEach((item) => {
    const key = `${item.name}__${item.size}__${item.price}`;
    if (!grouped[key]) {
      grouped[key] = {
        name: item.name,
        size: item.size,
        price: item.price,
        quantity: 0
      };
    }
    grouped[key].quantity += 1;
  });
  return Object.values(grouped).map((item) => ({
    ...item,
    total: item.price * item.quantity
  }));
}

async function submitOrderToSupabase({ items, customerName, customerPhone, branch, orderType, address }) {
  const orderItems = groupCartItems(items).map((item) => ({
    item_name: item.name,
    quantity: item.quantity,
    unit_price: item.price,
    notes: item.size ? `Size: ${item.size}` : null
  }));

  const mappedOrderType = orderType === 'pickup' ? 'takeaway' : 'online';
  const notes = [
    branch ? `Branch: ${branch}` : '',
    orderType === 'delivery' && address ? `Address: ${address}` : '',
    'Order Source: Website'
  ]
    .filter(Boolean)
    .join(' | ');

  const { data, error } = await supabase.rpc('create_public_order', {
    items: orderItems,
    customer_name: customerName,
    customer_phone: customerPhone,
    order_type: mappedOrderType,
    notes: notes || null
  });

  if (error) throw error;
  const order = Array.isArray(data) ? data[0] : data;
  if (!order || !order.order_id) {
    throw new Error('Order could not be created. Please check Supabase configuration.');
  }

  return order;
}

document.addEventListener('DOMContentLoaded', () => {
  initializeSizeSelectors();
  initializeCart();
  initializeStarRating();
  initializeFAQ();
  loadReviews();
  initializeReviewForm();
  initializeSmoothScroll();
  initializeNavbarScroll();
  initializeMobileNav();

  if (window.innerWidth < 768) {
    document.body.addEventListener('touchmove', () => {}, { passive: true });
  }
});

function initializeSizeSelectors() {
  const sizeButtons = document.querySelectorAll('.size-btn');

  sizeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const pizzaName = this.dataset.pizza;
      const parentCard = this.closest('.menu-card');
      const cardButtons = parentCard.querySelectorAll('.size-btn');

      cardButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      const price = this.dataset.price;
      const size = this.dataset.size;
      const formattedSize = this.textContent;

      const priceDisplay = parentCard.querySelector('.price-amount');
      const addToCartBtn = parentCard.querySelector('.add-to-cart');

      priceDisplay.textContent = price;

      addToCartBtn.dataset.price = price;
      addToCartBtn.dataset.size = formattedSize;
    });
  });
}

function initializeCart() {
  const cartBtn = document.getElementById('cartBtn');
  const cartModal = document.getElementById('cartModal');
  const closeCart = document.getElementById('closeCart');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const addToCartButtons = document.querySelectorAll('.add-to-cart');

  cartBtn.addEventListener('click', () => {
    cartModal.classList.add('show');
    updateCartDisplay();
    document.body.style.overflow = 'hidden';
  });

  closeCart.addEventListener('click', () => {
    cartModal.classList.remove('show');
    document.body.style.overflow = '';
  });

  cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) {
      cartModal.classList.remove('show');
      document.body.style.overflow = '';
    }
  });

  checkoutBtn.addEventListener('click', () => {
    openCheckout();
  });

  addToCartButtons.forEach(button => {
    button.addEventListener('click', function() {
      const name = this.dataset.name;
      const price = parseInt(this.dataset.price);
      const size = this.dataset.size;

      addToCart({ name, price, size });

      this.textContent = 'Added!';
      this.style.background = '#4CAF50';

      setTimeout(() => {
        this.textContent = 'Add to Cart';
        this.style.background = '';
      }, 1000);
    });
  });
}

function addToCart(item) {
  cart.push(item);
  updateCartCount();
}

function updateCartCount() {
  const cartCount = document.querySelector('.cart-count');
  cartCount.textContent = cart.length;
}

function updateCartDisplay() {
  const cartItems = document.getElementById('cartItems');
  const cartFooter = document.getElementById('cartFooter');

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
    cartFooter.style.display = 'none';
    return;
  }

  let total = 0;
  let html = '';

  cart.forEach((item, index) => {
    total += item.price;
    html += `
      <div class="cart-item">
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>${item.size}</p>
        </div>
        <div class="cart-item-actions">
          <span class="cart-item-price">P${item.price}</span>
          <button class="cart-item-remove" data-index="${index}" aria-label="Remove item">&times;</button>
        </div>
      </div>
    `;
  });

  cartItems.innerHTML = html;

  cartItems.querySelectorAll('.cart-item-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index, 10);
      if (Number.isNaN(index)) return;
      cart.splice(index, 1);
      updateCartCount();
      updateCartDisplay();
    });
  });

  const totalAmount = cartFooter.querySelector('.total-amount');
  totalAmount.textContent = `P${total}`;

  cartFooter.style.display = 'block';
}

function initializeStarRating() {
  const stars = document.querySelectorAll('.star');
  const ratingInput = document.getElementById('rating');

  stars.forEach((star, index) => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.rating);
      ratingInput.value = selectedRating;
      updateStarDisplay();
    });

    star.addEventListener('touchstart', () => {
      const rating = parseInt(star.dataset.rating);
      highlightStars(rating);
    });
  });

  document.getElementById('starRating').addEventListener('touchend', () => {
    updateStarDisplay();
  });
}

function highlightStars(rating) {
  const stars = document.querySelectorAll('.star');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

function updateStarDisplay() {
  highlightStars(selectedRating);
}

function initializeFAQ() {
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const faqItem = question.parentElement;
      const isActive = faqItem.classList.contains('active');

      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
      });

      if (!isActive) {
        faqItem.classList.add('active');
      }
    });
  });
}

async function loadReviews() {
  const reviewsList = document.getElementById('reviewsList');

  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!reviews || reviews.length === 0) {
      reviewsList.innerHTML = '<p class="loading">No reviews yet. Be the first to share your experience!</p>';
      return;
    }

    let html = '';
    reviews.forEach(review => {
      const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
      const date = new Date(review.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      html += `
        <div class="review-item">
          <div class="review-header">
            <span class="reviewer-name">${escapeHtml(review.customer_name)}</span>
            <span class="review-rating">${stars}</span>
          </div>
          <div class="review-date">${date}</div>
          ${review.comment ? `<p class="review-comment">${escapeHtml(review.comment)}</p>` : ''}
        </div>
      `;
    });

    reviewsList.innerHTML = html;
  } catch (error) {
    console.error('Error loading reviews:', error);
    reviewsList.innerHTML = '<p class="loading">Unable to load reviews. Please try again later.</p>';
  }
}

function initializeReviewForm() {
  const reviewForm = document.getElementById('reviewForm');

  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitButton = reviewForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Submitting...';
    submitButton.disabled = true;

    const customerName = document.getElementById('customerName').value;
    const rating = parseInt(document.getElementById('rating').value);
    const comment = document.getElementById('comment').value;

    if (rating === 0) {
      alert('Please select a rating');
      submitButton.textContent = originalText;
      submitButton.disabled = false;
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([
          {
            customer_name: customerName,
            rating: rating,
            comment: comment || null
          }
        ]);

      if (error) throw error;

      reviewForm.reset();
      selectedRating = 0;
      updateStarDisplay();

      submitButton.textContent = 'Review Submitted!';
      submitButton.style.background = '#4CAF50';

      setTimeout(() => {
        submitButton.textContent = originalText;
        submitButton.style.background = '';
        submitButton.disabled = false;
      }, 2000);

      await loadReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  });
}

function initializeSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        const navbarHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = targetElement.offsetTop - navbarHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

function initializeNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const handleScroll = () => {
    if (window.scrollY > 8) {
      navbar.classList.add('is-sticky');
    } else {
      navbar.classList.remove('is-sticky');
    }
  };

  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });
}

function initializeMobileNav() {
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const navbar = document.querySelector('.navbar');
  if (!navToggle || !navLinks || !navbar) return;

  const closeMenu = () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => closeMenu());
  });

  window.addEventListener(
    'resize',
    () => {
      if (window.innerWidth > 768) {
        closeMenu();
      }
    },
    { passive: true }
  );
}

function openCheckout() {
  if (cart.length === 0) {
    alert('Your cart is empty. Add a pizza before checking out.');
    return;
  }

  const checkoutModal = document.getElementById('checkoutModal');
  const checkoutSummary = document.getElementById('checkoutSummary');
  const closeCheckout = document.getElementById('closeCheckout');
  const checkoutForm = document.getElementById('checkoutForm');
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  const orderTypeInputs = checkoutForm?.querySelectorAll('input[name="orderType"]');
  const branchSelect = document.getElementById('branchSelect');
  const addressGroup = document.getElementById('addressGroup');
  const addressInput = document.getElementById('customerAddress');

  if (!checkoutModal || !checkoutSummary || !closeCheckout || !checkoutForm || !placeOrderBtn) return;

  renderCheckoutSummary(checkoutSummary);

  checkoutModal.classList.add('show');
  document.body.style.overflow = 'hidden';

  const closeModal = () => {
    checkoutModal.classList.remove('show');
    document.body.style.overflow = '';
  };

  closeCheckout.onclick = closeModal;
  checkoutModal.onclick = (e) => {
    if (e.target === checkoutModal) closeModal();
  };

  const syncAddressRequirement = () => {
    const selected = checkoutForm.querySelector('input[name="orderType"]:checked');
    const isDelivery = selected?.value === 'delivery';
    if (addressGroup) {
      addressGroup.style.display = isDelivery ? 'block' : 'none';
    }
    if (addressInput) {
      addressInput.required = isDelivery;
      if (!isDelivery) {
        addressInput.value = '';
      }
    }
  };

  orderTypeInputs?.forEach(input => {
    input.addEventListener('change', syncAddressRequirement);
  });

  syncAddressRequirement();

  checkoutForm.onsubmit = async (e) => {
    e.preventDefault();
    placeOrderBtn.textContent = 'Placing order...';
    placeOrderBtn.disabled = true;

    const name = checkoutForm.customerFullName.value.trim();
    const phone = checkoutForm.customerPhone.value.trim();
    const branch = branchSelect ? branchSelect.value : '';
    const orderType = checkoutForm.querySelector('input[name="orderType"]:checked')?.value || 'delivery';
    const address = checkoutForm.customerAddress.value.trim();

    if (!name || !phone || !branch) {
      alert('Please fill in your name, phone, and branch.');
      placeOrderBtn.textContent = 'Place Order';
      placeOrderBtn.disabled = false;
      return;
    }

    if (orderType === 'delivery' && !address) {
      alert('Please enter a delivery address.');
      placeOrderBtn.textContent = 'Place Order';
      placeOrderBtn.disabled = false;
      return;
    }

    try {
      const order = await submitOrderToSupabase({
        items: cart,
        customerName: name,
        customerPhone: phone,
        branch,
        orderType,
        address
      });

      alert(`Order ${order.order_number || ''} placed for ${orderType === 'delivery' ? 'delivery' : 'pickup'} at ${branch}! We will contact you shortly to confirm.`);
      checkoutForm.reset();
      cart = [];
      updateCartCount();
      updateCartDisplay();
      closeModal();
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      placeOrderBtn.textContent = 'Place Order';
      placeOrderBtn.disabled = false;
    }
  };
}

function renderCheckoutSummary(container) {
  if (!container) return;

  let total = 0;
  let summary = '';
  const branchSelect = document.getElementById('branchSelect');
  const orderTypeSelected = document.querySelector('input[name="orderType"]:checked');

  cart.forEach(item => {
    total += item.price;
    summary += `
      <div class="checkout-line">
        <div>
          <strong>${item.name}</strong>
          <div class="muted">${item.size}</div>
        </div>
        <span>P${item.price}</span>
      </div>
    `;
  });

  summary += `
    <div class="checkout-line">
      <div><strong>Order Type</strong></div>
      <span>${orderTypeSelected ? orderTypeSelected.value : 'delivery'}</span>
    </div>
    <div class="checkout-line">
      <div><strong>Branch</strong></div>
      <span>${branchSelect && branchSelect.value ? branchSelect.value : 'Select branch'}</span>
    </div>
    <div class="checkout-total">
      <span>Total</span>
      <strong>P${total}</strong>
    </div>
  `;

  container.innerHTML = summary;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
