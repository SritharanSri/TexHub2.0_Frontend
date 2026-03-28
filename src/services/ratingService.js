import api from './api'

const RATINGS_KEY = 'texhub_ratings'
const loadRatings = () => JSON.parse(localStorage.getItem(RATINGS_KEY) || '[]')
const saveRatings = (data) => localStorage.setItem(RATINGS_KEY, JSON.stringify(data))

export const ratingService = {
  create:      (orderId, data)    => api.post(`/orders/${orderId}/ratings`, data),
  getByTailor: (tailorId, params) => api.get(`/tailors/${tailorId}/ratings`, { params }),

  // Demo-only: get aggregated stats for a tailor by name
  getTailorStats(tailorName) {
    const reviews = loadRatings().filter(r => r.tailorName === tailorName)
    const count = reviews.length
    const avgRating = count > 0 ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / count : 4.9
    return { rating: Math.round(avgRating * 10) / 10, count, reviews }
  },

  // Demo-only: apply late penalty (reduce rating)
  applyLatePenalty(tailorName, orderId) {
    const ratings = loadRatings()
    ratings.push({ tailorName, orderId, rating: 0, type: 'penalty', date: new Date().toISOString() })
    saveRatings(ratings)
  },
}
