const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_API_KEY) {
  console.error('TMDB API key is not set. Please check your .env file.');
}

export const searchMovie = async (title, year) => {
  if (!TMDB_API_KEY) {
    console.error('Cannot fetch movie data without an API key');
    return null;
  }

  try {
    console.log(`Searching for movie: ${title} (${year})`);
    let url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
    
    // Add year to query if available
    if (year) {
      url += `&year=${year}`;
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      console.log(`Found poster for "${title}" (${year})`);
      return data.results[0];
    }
    console.log(`No results found for "${title}" (${year})`);
    return null;
  } catch (error) {
    console.error('Error fetching movie poster:', error);
    return null;
  }
};

export const getMoviePoster = async (title, year) => {
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${process.env.REACT_APP_TMDB_ACCESS_TOKEN}`
    }
  };

  try {
    // First try with exact year match
    const searchParams = new URLSearchParams({
      query: title,
      include_adult: 'false',
      language: 'en-US',
      page: '1'
    });
    
    if (year) {
      searchParams.append('primary_release_year', year);
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?${searchParams.toString()}`,
      options
    );
    
    if (!response.ok) {
      throw new Error('TMDB API request failed');
    }
    
    const data = await response.json();
    console.log('Search results for:', title, year, data.results);
    
    // If we find an exact match with the year
    if (data.results && data.results.length > 0) {
      const movie = data.results[0];
      if (movie.poster_path) {
        return `https://image.tmdb.org/t/p/w780${movie.poster_path}`;
      }
    }
    
    // If no results with exact year, try without year constraint
    if (year) {
      const fallbackParams = new URLSearchParams({
        query: title,
        include_adult: 'false',
        language: 'en-US',
        page: '1'
      });

      const fallbackResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?${fallbackParams.toString()}`,
        options
      );
      
      if (!fallbackResponse.ok) {
        throw new Error('TMDB API fallback request failed');
      }
      
      const fallbackData = await fallbackResponse.json();
      console.log('Fallback search results for:', title, fallbackData.results);
      
      if (fallbackData.results && fallbackData.results.length > 0) {
        const movie = fallbackData.results[0];
        if (movie.poster_path) {
          return `https://image.tmdb.org/t/p/w780${movie.poster_path}`;
        }
      }
    }
    
    return '/placeholder-poster.jpg';
  } catch (error) {
    console.error('Error fetching movie poster:', error, 'for movie:', title, 'year:', year);
    return '/placeholder-poster.jpg';
  }
}; 