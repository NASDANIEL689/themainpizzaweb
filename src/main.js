import './style.css';
import { supabase } from './supabase.js';

let cart = [];
let selectedRating = 0;

document.addEventListener('DOMContentLoaded', () => {
  initializeSizeSelectors();
  initializeCart();
  initializeStarRating();
  initializeFAQ();
  loadReviews();
  initializeReviewForm();
  initializeSmoothScroll();

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
        <span class="cart-item-price">P${item.price}</span>
      </div>
    `;
  });

  cartItems.innerHTML = html;

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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
