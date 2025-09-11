import React, { useState } from 'react'

const ContentCard = ({ content, onRate, onComment }) => {
  const [imageError, setImageError] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [showCommentForm, setShowCommentForm] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  const handleRate = (newRating) => {
    setRating(newRating)
    if (onRate) {
      onRate(content.id, newRating)
    }
  }

  const handleComment = () => {
    if (comment.trim() && onComment) {
      onComment(content.id, comment)
      setComment('')
      setShowCommentForm(false)
    }
  }

  const getTypeColor = (type) => {
    const colors = {
      technology: 'bg-blue-100 text-blue-800',
      trend: 'bg-green-100 text-green-800',
      inspiration: 'bg-purple-100 text-purple-800',
      innovation: 'bg-orange-100 text-orange-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getTimeHorizonColor = (horizon) => {
    const colors = {
      short: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      long: 'bg-green-100 text-green-800'
    }
    return colors[horizon] || 'bg-gray-100 text-gray-800'
  }

  const renderStars = (rating, interactive = false) => {
    return [...Array(5)].map((_, i) => (
      <span
        key={i}
        className={`cursor-pointer text-lg ${
          i < rating ? 'text-yellow-400' : 'text-gray-300'
        } ${interactive ? 'hover:text-yellow-400' : ''}`}
        onClick={interactive ? () => handleRate(i + 1) : undefined}
      >
        ★
      </span>
    ))
  }

  return (
    <div className="content-card card-hover">
      {/* Image Section */}
      <div className="mb-4">
        {!imageError && content.image_url ? (
          <img
            src={content.image_url}
            alt={content.title}
            className="content-image"
            onError={handleImageError}
          />
        ) : (
          <div className="content-image">
            <div className="text-center">
              <div className="text-2xl mb-2">🏢</div>
              <div>Bild nicht verfügbar</div>
            </div>
          </div>
        )}
      </div>

      {/* Content Header */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(content.content_type)}`}>
          {content.content_type}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTimeHorizonColor(content.time_horizon)}`}>
          {content.time_horizon} term
        </span>
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {content.industry}
        </span>
      </div>

      {/* Title and Description */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {content.title}
      </h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {content.short_description}
      </p>

      {/* Creator and Date */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <span>by {content.creator_username}</span>
        <span>{new Date(content.created_at).toLocaleDateString('de-DE')}</span>
      </div>

      {/* Rating Display */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex">
          {renderStars(Math.round(content.average_rating || 0))}
        </div>
        <span className="text-sm text-gray-600">
          {content.average_rating?.toFixed(1) || '0.0'} ({content.rating_count || 0})
        </span>
      </div>

      {/* Interactive Rating */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Ihre Bewertung:</div>
        <div className="flex">
          {renderStars(rating, true)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowCommentForm(!showCommentForm)}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          💬 Kommentar ({content.comment_count || 0})
        </button>
        
        <button className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors">
          👁️ Details
        </button>
        
        <button className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors">
          👍 Like
        </button>
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ihr Kommentar..."
            className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
            rows="3"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleComment}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              Senden
            </button>
            <button
              onClick={() => setShowCommentForm(false)}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContentCard

