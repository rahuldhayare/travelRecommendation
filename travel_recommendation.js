// Travel Recommendation Website JavaScript

// Global variable to store fetched data
let travelData = null;

// Function to fetch travel data from API
async function fetchTravelData() {
    try {
        const response = await fetch('travel_recommendation_api.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        travelData = await response.json();
        console.log('Travel data loaded successfully:', travelData);
        return travelData;
    } catch (error) {
        console.error('Error fetching travel data:', error);
        return null;
    }
}

// Function to show different pages
function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show the selected page
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }
    
    // Update navbar for about page (hide search bar)
    const navbar = document.querySelector('.navbar');
    const navbarRight = navbar.querySelector('.navbar-right');
    
    if (pageId === 'about') {
        // Hide search bar for about page
        if (navbarRight) {
            navbarRight.style.display = 'none';
        }
    } else if (pageId === 'contact') {
        // Hide search bar for contact page
        if (navbarRight) {
            navbarRight.style.display = 'none';
        }
    } else {
        // Show search bar for other pages
        if (navbarRight) {
            navbarRight.style.display = 'flex';
        }
    }
}

// Search functionality
async function searchRecommendations() {
    const searchInput = document.getElementById('searchBar');
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (searchTerm === '') {
        alert('Please enter a search term');
        return;
    }
    
    // Ensure data is loaded
    if (!travelData) {
        await fetchTravelData();
    }
    
    if (!travelData) {
        alert('Unable to load travel data. Please try again later.');
        return;
    }
    
    console.log('Searching for:', searchTerm);
    
    // Search for recommendations
    const results = searchInData(searchTerm);
    
    // Log search results for debugging
    console.log('Searching for:', searchTerm);
    console.log('Found results:', results.length);
    console.log('Results details:', results);
    
    if (results.length > 0) {
        displayResults(results);
    } else {
        displayNoResults(searchTerm);
    }
}

// Function to search in the travel data
function searchInData(searchTerm) {
    const results = [];
    
    // Normalize search term - convert to lowercase and trim
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    
    // Define keyword mappings for different categories
    const keywordMappings = {
        countries: ['country', 'countries', 'nation', 'nations'],
        cities: ['city', 'cities', 'town', 'towns', 'destination', 'destinations'],
        temples: ['temple', 'temples', 'shrine', 'shrines', 'monument', 'monuments', 'heritage'],
        beaches: ['beach', 'beaches', 'coast', 'coastal', 'shore', 'shores', 'seaside', 'waterfront']
    };
    
    // Check if search term matches any category keywords
    const matchesCategory = (category) => {
        return keywordMappings[category].some(keyword => 
            normalizedSearchTerm.includes(keyword) || keyword.includes(normalizedSearchTerm)
        );
    };
    
    // Check if search term matches specific location names or descriptions
    const matchesText = (text) => {
        if (!text) return false;
        const normalizedText = text.toLowerCase();
        
        // Exact match or partial match
        return normalizedText.includes(normalizedSearchTerm) || 
               normalizedSearchTerm.includes(normalizedText) ||
               // Handle plural/singular variations
               matchesWithVariations(normalizedText, normalizedSearchTerm);
    };
    
    // Function to handle word variations (plural/singular)
    const matchesWithVariations = (text, searchTerm) => {
        // Remove common suffixes for better matching
        const removeSuffixes = (word) => {
            return word.replace(/(s|es|ies)$/, '').replace(/ies$/, 'y');
        };
        
        const textWords = text.split(' ').map(removeSuffixes);
        const searchWords = searchTerm.split(' ').map(removeSuffixes);
        
        return searchWords.some(searchWord => 
            textWords.some(textWord => 
                textWord.includes(searchWord) || searchWord.includes(textWord)
            )
        );
    };
    
    // Search in countries and cities
    if (travelData.countries && (matchesCategory('countries') || matchesCategory('cities') || !isExactCategorySearch(normalizedSearchTerm))) {
        travelData.countries.forEach(country => {
            // Check if country name matches
            if (matchesText(country.name) || matchesCategory('countries')) {
                // Add all cities from this country if searching for countries
                country.cities.forEach(city => {
                    // Avoid duplicates by checking if specific city also matches
                    if (matchesCategory('countries') || matchesText(country.name) || matchesText(city.name) || matchesText(city.description)) {
                        results.push({
                            type: 'city',
                            name: city.name,
                            description: city.description,
                            imageUrl: city.imageUrl,
                            country: country.name
                        });
                    }
                });
            } else {
                // Check individual cities
                country.cities.forEach(city => {
                    if (matchesText(city.name) || matchesText(city.description)) {
                        results.push({
                            type: 'city',
                            name: city.name,
                            description: city.description,
                            imageUrl: city.imageUrl,
                            country: country.name
                        });
                    }
                });
            }
        });
    }
    
    // Search in temples
    if (travelData.temples && (matchesCategory('temples') || !isExactCategorySearch(normalizedSearchTerm))) {
        travelData.temples.forEach(temple => {
            if (matchesCategory('temples') || matchesText(temple.name) || matchesText(temple.description)) {
                results.push({
                    type: 'temple',
                    name: temple.name,
                    description: temple.description,
                    imageUrl: temple.imageUrl
                });
            }
        });
    }
    
    // Search in beaches
    if (travelData.beaches && (matchesCategory('beaches') || !isExactCategorySearch(normalizedSearchTerm))) {
        travelData.beaches.forEach(beach => {
            if (matchesCategory('beaches') || matchesText(beach.name) || matchesText(beach.description)) {
                results.push({
                    type: 'beach',
                    name: beach.name,
                    description: beach.description,
                    imageUrl: beach.imageUrl
                });
            }
        });
    }
    
    // Remove duplicates based on name
    const uniqueResults = results.filter((item, index, self) => 
        index === self.findIndex(t => t.name === item.name)
    );
    
    return uniqueResults;
}

// Helper function to check if search is for a specific category only
function isExactCategorySearch(searchTerm) {
    const categoryKeywords = ['temple', 'temples', 'beach', 'beaches', 'country', 'countries', 'city', 'cities'];
    return categoryKeywords.includes(searchTerm);
}

// Function to display search results
function displayResults(results) {
    // Get results container
    let resultsContainer = document.getElementById('searchResults');
    
    // Clear previous results
    resultsContainer.innerHTML = '';
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-results';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = clearResults;
    resultsContainer.appendChild(closeBtn);
    
    // Create results header
    const header = document.createElement('h2');
    header.textContent = `Found ${results.length} recommendation${results.length !== 1 ? 's' : ''}`;
    header.style.cssText = `
        color: #fff; 
        margin-bottom: 20px; 
        font-size: 1.8rem; 
        text-align: center;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    `;
    resultsContainer.appendChild(header);
    
    // Group results by type for better organization
    const groupedResults = {
        beach: results.filter(r => r.type === 'beach'),
        temple: results.filter(r => r.type === 'temple'),
        city: results.filter(r => r.type === 'city')
    };
    
    // Create results grid
    const resultsGrid = document.createElement('div');
    resultsGrid.className = 'results-grid';
    
    // Display results in order: beaches, temples, then cities
    ['beach', 'temple', 'city'].forEach(type => {
        if (groupedResults[type].length > 0) {
            groupedResults[type].forEach(result => {
                const resultCard = createResultCard(result);
                resultsGrid.appendChild(resultCard);
            });
        }
    });
    
    resultsContainer.appendChild(resultsGrid);
    
    // Show results panel and adjust main content
    resultsContainer.classList.add('show');
    document.querySelector('.main-content').classList.add('search-active');
}

// Function to display no results message
function displayNoResults(searchTerm) {
    let resultsContainer = document.getElementById('searchResults');
    
    // Clear previous results
    resultsContainer.innerHTML = '';
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-results';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = clearResults;
    resultsContainer.appendChild(closeBtn);
    
    const noResultsDiv = document.createElement('div');
    noResultsDiv.innerHTML = `
        <div class="no-results">
            <h2>No Results Found</h2>
            <p>
                Sorry, we couldn't find any recommendations for "${searchTerm}". 
                Try searching with different keywords or variations.
            </p>
            <div style="margin-top: 15px; color: #ccc; font-size: 0.8rem;">
                <p><strong>Try searching for:</strong></p>
                <ul style="list-style: none; padding: 0; text-align: left;">
                    <li>• <strong>Countries:</strong> Australia, Japan, Brazil</li>
                    <li>• <strong>Cities:</strong> Sydney, Tokyo, Rio</li>
                    <li>• <strong>Temples:</strong> temple, Angkor Wat, Taj Mahal</li>
                    <li>• <strong>Beaches:</strong> beach, Bora Bora, Copacabana</li>
                </ul>
            </div>
        </div>
    `;
    
    resultsContainer.appendChild(noResultsDiv);
    
    // Show results panel and adjust main content
    resultsContainer.classList.add('show');
    document.querySelector('.main-content').classList.add('search-active');
}

// Function to create individual result card
function createResultCard(result) {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    // Use placeholder image if imageUrl contains placeholder text
    const imageUrl = result.imageUrl.includes('enter_your_image') ? 
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80' : 
        result.imageUrl;
    
    // Get current time for this destination
    const timeInfo = getCurrentTime(result);
    const timeDisplay = formatTimeForDisplay(timeInfo);
    
    card.innerHTML = `
        <div class="result-image">
            <img src="${imageUrl}" alt="${result.name}" onerror="this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80'">
            <div class="result-type">${result.type}</div>
        </div>
        <div class="result-content">
            <h3 class="result-title">${result.name}</h3>
            <p class="result-description">${result.description}</p>
            ${result.country ? `<div class="result-country">📍 ${result.country}</div>` : ''}
            <div class="result-time">${timeDisplay}</div>
            <button class="visit-btn" onclick="visitDestination('${result.name}')">Visit</button>
        </div>
    `;
    
    return card;
}

// Function to handle visit destination
function visitDestination(destinationName) {
    alert(`Booking your trip to ${destinationName}! This feature will be available soon.`);
}

// Function to get country time zone based on destination
function getCountryTimeZone(countryName, cityName) {
    const timeZones = {
        'Australia': {
            'Sydney, Australia': 'Australia/Sydney',
            'Melbourne, Australia': 'Australia/Melbourne',
            default: 'Australia/Sydney'
        },
        'Japan': {
            'Tokyo, Japan': 'Asia/Tokyo',
            'Kyoto, Japan': 'Asia/Tokyo',
            default: 'Asia/Tokyo'
        },
        'Brazil': {
            'Rio de Janeiro, Brazil': 'America/Sao_Paulo',
            'São Paulo, Brazil': 'America/Sao_Paulo',
            default: 'America/Sao_Paulo'
        },
        'Cambodia': 'Asia/Phnom_Penh',
        'India': 'Asia/Kolkata',
        'French Polynesia': 'Pacific/Tahiti'
    };
    
    // Handle cities with country-specific time zones
    if (timeZones[countryName] && typeof timeZones[countryName] === 'object') {
        return timeZones[countryName][cityName] || timeZones[countryName].default;
    }
    
    // Handle countries with single time zone
    return timeZones[countryName] || 'UTC';
}

// Function to get current time for a destination
function getCurrentTime(destination) {
    try {
        let timeZone;
        let locationName;
        
        // Determine time zone based on destination type and name
        if (destination.country) {
            // For cities
            timeZone = getCountryTimeZone(destination.country, destination.name);
            locationName = destination.country;
        } else {
            // For temples and beaches, extract country from name
            if (destination.name.includes('Cambodia')) {
                timeZone = 'Asia/Phnom_Penh';
                locationName = 'Cambodia';
            } else if (destination.name.includes('India')) {
                timeZone = 'Asia/Kolkata';
                locationName = 'India';
            } else if (destination.name.includes('French Polynesia')) {
                timeZone = 'Pacific/Tahiti';
                locationName = 'French Polynesia';
            } else if (destination.name.includes('Brazil')) {
                timeZone = 'America/Sao_Paulo';
                locationName = 'Brazil';
            } else {
                timeZone = 'UTC';
                locationName = 'UTC';
            }
        }
        
        const options = {
            timeZone: timeZone,
            hour12: true,
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        };
        
        const currentTime = new Date().toLocaleString('en-US', options);
        console.log(`Current time in ${locationName}:`, currentTime);
        
        return {
            time: currentTime,
            location: locationName,
            timeZone: timeZone
        };
    } catch (error) {
        console.error('Error getting time for destination:', error);
        return {
            time: 'Time unavailable',
            location: 'Unknown',
            timeZone: 'UTC'
        };
    }
}

// Function to format time display for UI
function formatTimeForDisplay(timeInfo) {
    return `🕐 Local time in ${timeInfo.location}: ${timeInfo.time}`;
}

// Reset/Clear functionality
function clearResults() {
    const searchInput = document.getElementById('searchBar');
    const resultsContainer = document.getElementById('searchResults');
    
    // Clear the search input field
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus(); // Focus back to search input for better UX
    }
    
    // Hide search results panel and reset main content
    if (resultsContainer) {
        resultsContainer.classList.remove('show');
        resultsContainer.innerHTML = ''; // Clear the content completely
    }
    
    // Reset main content layout
    document.querySelector('.main-content').classList.remove('search-active');
    
    // Ensure we're back to the home page view
    showPage('home');
    
    console.log('Search cleared - input cleared, results hidden, returned to home page');
}

// Book Now functionality
function bookNow() {
    alert('Booking functionality coming soon!');
}

// Contact form validation
function validateContactForm() {
    let isValid = true;
    
    // Get form elements
    const name = document.getElementById('contactName');
    const email = document.getElementById('contactEmail');
    const message = document.getElementById('contactMessage');
    
    // Get error elements
    const nameError = document.getElementById('nameError');
    const emailError = document.getElementById('emailError');
    const messageError = document.getElementById('messageError');
    
    // Clear previous errors
    clearErrors();
    
    // Validate name
    if (!name.value.trim()) {
        showError(name, nameError, 'Name is required');
        isValid = false;
    } else if (name.value.trim().length < 2) {
        showError(name, nameError, 'Name must be at least 2 characters');
        isValid = false;
    }
    
    // Validate email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim()) {
        showError(email, emailError, 'Email is required');
        isValid = false;
    } else if (!emailPattern.test(email.value.trim())) {
        showError(email, emailError, 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate message
    if (!message.value.trim()) {
        showError(message, messageError, 'Message is required');
        isValid = false;
    } else if (message.value.trim().length < 10) {
        showError(message, messageError, 'Message must be at least 10 characters');
        isValid = false;
    }
    
    return isValid;
}

// Show error message
function showError(field, errorElement, message) {
    field.classList.add('error');
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

// Clear all errors
function clearErrors() {
    const fields = ['contactName', 'contactEmail', 'contactMessage'];
    const errors = ['nameError', 'emailError', 'messageError'];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.classList.remove('error');
    });
    
    errors.forEach(errorId => {
        const error = document.getElementById(errorId);
        if (error) {
            error.classList.remove('show');
            error.textContent = '';
        }
    });
}

// Handle contact form submission
function handleContactSubmit(event) {
    event.preventDefault();
    
    if (validateContactForm()) {
        // Show success modal
        showModal();
        
        // Reset form
        document.getElementById('contactForm').reset();
        clearErrors();
    }
}

// Show modal
function showModal() {
    const modal = document.getElementById('submitModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('submitModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Initialize page on load
document.addEventListener('DOMContentLoaded', async function() {
    // Load travel data first
    await fetchTravelData();
    
    // Show home page by default
    showPage('home');
    
    // Add event listeners
    const searchBtn = document.getElementById('searchBtn');
    const resetBtn = document.getElementById('resetBtn');
    const bookBtn = document.querySelector('.home-btn');
    const contactForm = document.getElementById('contactForm');
    const closeModalBtn = document.querySelector('.close-modal');
    const modal = document.getElementById('submitModal');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', searchRecommendations);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', clearResults);
    }
    
    if (bookBtn) {
        bookBtn.addEventListener('click', bookNow);
    }
    
    // Contact form event listeners
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });
    }
    
    // Add Enter key support for search (but only trigger search on button click as per requirements)
    const searchInput = document.getElementById('searchBar');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                // Trigger the search button click instead of direct search
                const searchBtn = document.getElementById('searchBtn');
                if (searchBtn) {
                    searchBtn.click();
                }
            }
        });
    }
});
