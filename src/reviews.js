import './style.css';
import { supabase } from './supabase.js';

const reviewsList = document.getElementById('reviewsPageList');
const ratingFilter = document.getElementById('ratingFilter');

const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const renderReviews = (reviews) => {
  if (!reviews || reviews.length === 0) {
    reviewsList.innerHTML = '<p class="loading">No reviews found for this rating.</p>';
    return;
  }

  let html = '';
  reviews.forEach((review) => {
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const date = new Date(review.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
};

const loadReviews = async (ratingValue = 'all') => {
  reviewsList.innerHTML = '<p class="loading">Loading reviews...</p>';

  let query = supabase
    .from('reviews')
    .select('*')
    .order('rating', { ascending: false })
    .order('created_at', { ascending: false });

  if (ratingValue !== 'all') {
    query = query.eq('rating', parseInt(ratingValue, 10));
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error loading reviews:', error);
    reviewsList.innerHTML = '<p class="loading">Unable to load reviews. Please try again later.</p>';
    return;
  }

  renderReviews(data);
};

ratingFilter?.addEventListener('change', (event) => {
  const value = event.target.value;
  loadReviews(value);
});

loadReviews();
