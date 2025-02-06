/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/anchor-is-valid */

import React, { useState, useEffect } from 'react';
import { getMoviePoster } from './services/tmdb';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [topRated, setTopRated] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [moviePosters, setMoviePosters] = useState({});
  const [clusterRecommendations, setClusterRecommendations] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRecommendations([]);

    try {
      const response = await fetch('http://localhost:5001/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'omit',
        body: JSON.stringify({ 
          username,
          source: 'letterboxd'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error');
      }
      
      const data = await response.json();
      console.log('Response:', data);
      
      setRecommendations(data.recommendations || []);
      setUserStats(data.user_stats || {});
      setTopRated(data.top_rated_movies || []);
    } catch (err) {
      console.error('Error:', err);
      setError(`Error retrieving recommendations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch movie posters
  const fetchMoviePosters = async (movies) => {
    console.log('Fetching posters for movies:', movies);
    const posters = {...moviePosters}; // Preserve existing posters
    for (const movie of movies) {
      if (!posters[movie.title]) { // Only fetch if we don't have it already
        console.log('Fetching poster for:', movie.title, 'year:', movie.year);
        const posterUrl = await getMoviePoster(movie.title, movie.year || '');
        console.log('Got poster URL:', posterUrl);
        posters[movie.title] = posterUrl;
      }
    }
    setMoviePosters(posters);
  };

  // Combined useEffect for both top rated and recommended movies
  useEffect(() => {
    const fetchAllPosters = async () => {
      const allMovies = [...topRated, ...recommendations, ...clusterRecommendations];
      if (allMovies.length > 0) {
        await fetchMoviePosters(allMovies);
      }
    };
    
    fetchAllPosters();
  }, [topRated, recommendations, clusterRecommendations]); // Added clusterRecommendations

  // Modify the getClusterRecommendations function
  const getClusterRecommendations = async (movieId) => {
    console.log('Getting cluster recommendations for:', movieId);
    try {
      setLoading(true); // Add loading state
      const response = await fetch(`http://localhost:5001/recommendations/${movieId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get cluster recommendations');
      }
      
      const data = await response.json();
      console.log('Cluster recommendations response:', data);
      
      if (data.recommendations && Array.isArray(data.recommendations)) {
        setClusterRecommendations(data.recommendations);
        
        // Fetch posters for new recommendations
        await fetchMoviePosters(data.recommendations);
      } else {
        console.error('Invalid recommendations format:', data);
        setError('Invalid recommendations format received');
      }
    } catch (err) {
      console.error('Error getting cluster recommendations:', err);
      setError(`Error getting similar movies: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Modify the handleMovieClick function
  const handleMovieClick = (movieId, e) => {
    e.preventDefault(); // Prevent default link behavior
    console.log('Clicked movie with ID:', movieId);
    if (!movieId) {
      console.error('No movie ID provided');
      return;
    }
    setClusterRecommendations([]); // Clear previous recommendations
    getClusterRecommendations(movieId);
  };

  // Modify the movie list rendering to include click handler
  const renderMovieList = (movies, title) => (
    <div className="movies-section">
      <h2>{title}</h2>
      <ul className="movie-list">
        {movies.map((movie, index) => (
          <li key={index} className="movie-item">
            <a href="#" onClick={(e) => handleMovieClick(movie.slug, e)}>
              <img 
                className="movie-poster" 
                src={moviePosters[movie.title] || '/placeholder-poster.jpg'} 
                alt={movie.title}
                onError={(e) => { e.target.src = '/placeholder-poster.jpg'; }}
              />
            </a>
            <div className="movie-info">
              <div className="movie-title">
                <a href="#" onClick={(e) => handleMovieClick(movie.slug, e)}>
                  {movie.title}
                </a>
              </div>
              <div className="movie-rating">
                {movie.rating ? `${movie.rating} ★` : 
                 movie.similarity ? `${movie.similarity.toFixed(1)}% match` : ''}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="App">
      <div className="header">
        <h1>Movie Recommendation Engine</h1>
        <p>Discover your next favorite movie based on your Letterboxd ratings</p>
      </div>

      <div className="search-form">
        <form onSubmit={handleSubmit}>
          <label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your Letterboxd username"
              required
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Finding Movies...' : 'Get Recommendations'}
          </button>
        </form>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* {userStats && (
        <div className="stats-section">
          <h2>Your Movie Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <p>Total Reviews</p>
              <strong>{userStats.total_reviews}</strong>
            </div>
            <div className="stat-card">
              <p>Training Reviews</p>
              <strong>{userStats.training_reviews}</strong>
            </div>
            <div className="stat-card">
              <p>Test Reviews</p>
              <strong>{userStats.test_reviews}</strong>
            </div>
          </div>
        </div>
      )} */}
      
      {topRated.length > 0 && renderMovieList(topRated, 'Your Top Rated Movies')}
      {recommendations.length > 0 && renderMovieList(recommendations, 'Recommended Movies')}
      {clusterRecommendations.length > 0 && renderMovieList(clusterRecommendations, 'Similar Movies (Cluster-Based)')}
      {loading && <div className="loading">Loading...</div>}
    </div>
  );
}

export default App;