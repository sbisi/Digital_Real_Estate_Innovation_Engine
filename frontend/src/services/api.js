// Updated API Service for Production Backend
// File: frontend/src/services/api.js

const API_BASE_URL = import.meta.env.PROD 
  ? 'https://rei-backend-mtcr.onrender.com/api'  // Your live backend URL
  : 'http://localhost:5000/api'  // Local development

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
    console.log('API Service initialized with base URL:', this.baseURL)
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      console.log('Making API request to:', url)
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('API response received:', data)
      return data
    } catch (error) {
      console.error('API request failed:', error)
      // Return demo data as fallback
      return this.getDemoData(endpoint)
    }
  }

  // Fallback demo data
  getDemoData(endpoint) {
    const demoData = {
      '/contents': [
        {
          id: 1,
          title: "Smart Building IoT Integration",
          short_description: "Internet of Things sensors and devices for intelligent building management and energy optimization.",
          content_type: "technology",
          industry: "Real Estate",
          time_horizon: "short",
          image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
          creator_username: "tech_expert",
          created_at: "2024-01-15T10:00:00Z",
          average_rating: 4.2,
          rating_count: 15,
          comment_count: 8,
          status: "approved"
        },
        {
          id: 2,
          title: "Sustainable Urban Development",
          short_description: "Growing trend towards eco-friendly and sustainable urban planning and development practices.",
          content_type: "trend",
          industry: "Real Estate",
          time_horizon: "long",
          image_url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop",
          creator_username: "sustainability_pro",
          created_at: "2024-01-14T14:30:00Z",
          average_rating: 4.7,
          rating_count: 23,
          comment_count: 12,
          status: "approved"
        }
      ],
      '/trends': [
        {
          id: 1,
          name: "Smart Building IoT",
          priority_score: 4.2,
          impact_score: 4.5,
          relevance_score: 4.0,
          urgency_score: 3.8,
          feasibility_score: 4.1,
          risk_score: 2.3,
          phase: "Growth"
        }
      ]
    }
    
    return demoData[endpoint] || []
  }

  // Content endpoints
  async getContents() {
    return this.request('/contents')
  }

  async createContent(contentData) {
    return this.request('/contents', {
      method: 'POST',
      body: JSON.stringify(contentData),
    })
  }

  async rateContent(contentId, rating) {
    return this.request(`/contents/${contentId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    })
  }

  async addComment(contentId, comment) {
    return this.request(`/contents/${contentId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    })
  }

  // Trend endpoints
  async getTrends() {
    return this.request('/trends')
  }

  async createTrend(trendData) {
    return this.request('/trends', {
      method: 'POST',
      body: JSON.stringify(trendData),
    })
  }

  // Analytics endpoints
  async getAnalytics() {
    return this.request('/analytics')
  }

  async getCorrelations() {
    return this.request('/analytics/correlations')
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`)
      return await response.json()
    } catch (error) {
      console.error('Health check failed:', error)
      return { status: 'error', message: 'Backend not reachable' }
    }
  }
}

export default new ApiService()

