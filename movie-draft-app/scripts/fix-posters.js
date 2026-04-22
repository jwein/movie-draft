/**
 * Helper script to fix posters for movies that have multiple versions
 * 
 * This script provides direct TMDB links to the correct films
 */

const corrections = [
  {
    title: "Oldboy",
    correctYear: 2003,
    director: "Park Chan-wook",
    tmdbSearch: "https://www.themoviedb.org/search/movie?query=Oldboy%202003",
    note: "Korean film, not the 2013 remake"
  },
  {
    title: "True Stories",
    correctYear: 1986,
    director: "David Byrne",
    tmdbSearch: "https://www.themoviedb.org/search/movie?query=True%20Stories%201986",
    note: "David Byrne's 1986 film"
  },
  {
    title: "The Heartbreak Kid",
    correctYear: 1972,
    director: "Elaine May",
    tmdbSearch: "https://www.themoviedb.org/search/movie?query=The%20Heartbreak%20Kid%201972",
    note: "1972 Elaine May film, not the 2007 remake"
  },
  {
    title: "Let the Sunshine In",
    correctYear: 2017,
    director: "Claire Denis",
    tmdbSearch: "https://www.themoviedb.org/search/movie?query=Let%20the%20Sunshine%20In%202017",
    note: "2017 Claire Denis film"
  },
  {
    title: "Night Moves",
    correctYear: 1975,
    director: "Arthur Penn",
    tmdbSearch: "https://www.themoviedb.org/search/movie?query=Night%20Moves%201975",
    note: "1975 Gene Hackman film, not the 2013 film"
  },
  {
    title: "French Connection",
    correctYear: 1971,
    director: "William Friedkin",
    tmdbSearch: "https://www.themoviedb.org/search/movie?query=The%20French%20Connection%201971",
    note: "1971 Gene Hackman film"
  },
  {
    title: "Mangrove",
    correctYear: 2020,
    director: "Steve McQueen",
    tmdbSearch: "https://www.themoviedb.org/search/movie?query=Mangrove%202020",
    note: "2020 Steve McQueen film (Small Axe series)"
  },
  {
    title: "Memories of Murder",
    correctYear: 2003,
    director: "Bong Joon-ho",
    tmdbSearch: "https://www.themoviedb.org/search/movie?query=Memories%20of%20Murder%202003",
    note: "2003 Bong Joon-ho Korean film"
  },
  {
    title: "40 Year Old Version",
    correctYear: 2020,
    director: "Radha Blank",
    tmdbSearch: "https://www.themoviedb.org/search/movie?query=40%20Year%20Old%20Version%202020",
    note: "2020 Radha Blank film"
  }
];

console.log('🎬 Movies that need poster corrections:\n');

corrections.forEach((movie, index) => {
  console.log(`${index + 1}. ${movie.title} (${movie.correctYear})`);
  console.log(`   Director: ${movie.director}`);
  console.log(`   Note: ${movie.note}`);
  console.log(`   🔗 ${movie.tmdbSearch}\n`);
});

console.log('\n📝 Instructions:');
console.log('1. Click each link above');
console.log('2. Find the correct movie (check year and director)');
console.log('3. Right-click the poster → Copy Image Address');
console.log('4. Run: node scripts/add-poster.js "Movie Title" "poster_url"');
console.log('\n💡 Tip: You can copy/paste the command below for each movie:\n');

corrections.forEach(movie => {
  console.log(`node scripts/add-poster.js "${movie.title}" "paste_url_here"`);
});

