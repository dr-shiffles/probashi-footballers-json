// Global variables
let playersData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 8;
let positionOptions = new Set();
let birthYearOptions = new Set();
let countryOptions = new Set();

// DOM Elements
const tableBody = document.getElementById('tableBody');
const nameFilter = document.getElementById('nameFilter');
const positionFilter = document.getElementById('positionFilter');
const birthYearFilter = document.getElementById('birthYearFilter');
const countryFilter = document.getElementById('countryFilter');
const ntFilter = document.getElementById('ntFilter');
const resetFiltersBtn = document.getElementById('resetFilters');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const rowCount = document.getElementById('rowCount');
const lastUpdate = document.getElementById('lastUpdate');

// Load data from JSON instead of CSV
async function loadJSONData(jsonFilename = 'mens.json') {
    try {
        const response = await fetch(`/json/${jsonFilename}`);
        if (!response.ok) {
            throw new Error(`Failed to load ${jsonFilename}: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Convert JSON objects back to array format to maintain compatibility
        playersData = data.map(player => [
            player["Given Names(s)"] || player["Given Names"] || '',
            player["Last Name"] || '',
            player.Positions || '',
            player["Birth Year"] || '',
            player["Birth Date"] || '',
            player.Age || '',
            player.Birthplace || '',
            player.Citizenship || '',
            player["Club Name"] || '',
            player.Country || '',
            player.Tier || '',
            player.Notes || '',
            player.NT || '',
            player["NT Tier"] || '',
            player.Caps || '',
            player.Goals || '',
            player["Last Update"] || '',
            player["Sorting String"] || ''
        ]);
        
        // Sort by sorting string column (last column in data)
        playersData.sort((a, b) => {
            const sortA = a[a.length - 1] || '';
            const sortB = b[b.length - 1] || '';
            
            const isUnattachedA = sortA.startsWith('~~~');
            const isUnattachedB = sortB.startsWith('~~~');
            
            if (isUnattachedA === isUnattachedB) {
                return sortA.localeCompare(sortB);
            }
            
            return isUnattachedA ? 1 : -1;
        });
        
        // Extract filter options
        extractFilterOptions();
        
        // Populate filter dropdowns
        populateFilterDropdowns();
        
        // Initialize filtered data
        filteredData = [...playersData];
        
        // Update the table
        updateTable();
        
        // Update last update date
        updateLastUpdateDate();
        
    } catch (error) {
        console.error('Error loading JSON:', error);
        alert('Data file not found. Please ensure the website is properly deployed.');
        playersData = [];
        filteredData = [];
        updateTable();
    }
}

// Parse CSV function - NO LONGER NEEDED for loading, but keep for reference
// Keeping parseCSV function removed since we're using JSON

// Extract unique values for filter dropdowns
function extractFilterOptions() {
    positionOptions.clear();
    birthYearOptions.clear();
    countryOptions.clear();
    
    playersData.forEach(player => {
        if (player[2] && player[2] !== "??" && player[2] !== "Unknown") {
            const positions = player[2].split(',').map(p => p.trim());
            positions.forEach(p => {
                if (p && p !== "??") positionOptions.add(p);
            });
        }
        
        if (player[3] && player[3] !== "Unknown" && player[3] !== "??") {
            birthYearOptions.add(player[3]);
        }
        
        if (player[9]) {
            countryOptions.add(player[9]);
        }
    });
}

// Populate filter dropdowns with options
function populateFilterDropdowns() {
    positionFilter.innerHTML = '<option value="">All Positions</option>';
    birthYearFilter.innerHTML = '<option value="">All Years</option>';
    countryFilter.innerHTML = '<option value="">All Countries</option>';
    
    const sortedPositions = Array.from(positionOptions).sort();
    sortedPositions.forEach(position => {
        const option = document.createElement('option');
        option.value = position;
        option.textContent = position;
        positionFilter.appendChild(option);
    });
    
    const sortedYears = Array.from(birthYearOptions).sort((a, b) => b - a);
    sortedYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        birthYearFilter.appendChild(option);
    });
    
    const sortedCountries = Array.from(countryOptions).sort();
    sortedCountries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countryFilter.appendChild(option);
    });
}

// Helper function to determine NT category
function getNTCategory(ntValue) {
    if (!ntValue || ntValue === '-' || ntValue === '') {
        return 'none';
    }
    if (ntValue.toUpperCase().includes('BAN')) {
        return 'bangladesh';
    }
    return 'others';
}

// Apply filters to the data
function applyFilters() {
    const nameFilterValue = nameFilter.value.toLowerCase();
    const positionFilterValue = positionFilter.value;
    const birthYearFilterValue = birthYearFilter.value;
    const countryFilterValue = countryFilter.value;
    const ntFilterValue = ntFilter ? ntFilter.value : 'all';
    
    filteredData = playersData.filter(player => {
        const fullName = (player[0] + ' ' + player[1]).toLowerCase();
        if (nameFilterValue && !fullName.includes(nameFilterValue)) {
            return false;
        }
        
        if (positionFilterValue && player[2]) {
            const positions = player[2].split(',').map(p => p.trim());
            if (!positions.includes(positionFilterValue)) {
                return false;
            }
        }
        
        if (birthYearFilterValue && player[3] !== birthYearFilterValue) {
            return false;
        }
        
        if (countryFilterValue && player[9] !== countryFilterValue) {
            return false;
        }
        
        if (ntFilterValue && ntFilterValue !== 'all') {
            const ntValue = player[12];
            const ntCategory = getNTCategory(ntValue);
            if (ntCategory !== ntFilterValue) {
                return false;
            }
        }
        
        return true;
    });
    
    currentPage = 1;
    updateTable();
}

// Set up event listeners
function setupEventListeners() {
    nameFilter.addEventListener('input', applyFilters);
    positionFilter.addEventListener('change', applyFilters);
    birthYearFilter.addEventListener('change', applyFilters);
    countryFilter.addEventListener('change', applyFilters);
    if (ntFilter) {
        ntFilter.addEventListener('change', applyFilters);
    }
    
    resetFiltersBtn.addEventListener('click', () => {
        nameFilter.value = '';
        positionFilter.value = '';
        birthYearFilter.value = '';
        countryFilter.value = '';
        if (ntFilter) {
            ntFilter.value = 'all';
        }
        applyFilters();
    });
    
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateTable();
        }
    });
    
    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updateTable();
        }
    });
}

// Update the table with current filtered data
function updateTable() {
    tableBody.innerHTML = '';
    
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, filteredData.length);
    const pageData = filteredData.slice(startIndex, endIndex);
    
    pageData.forEach(player => {
        const row = document.createElement('tr');
        
        for (let i = 0; i < player.length - 1; i++) {
            const cell = document.createElement('td');
            let value = player[i] || '-';
            if (value === '??' || value === 'Unknown' || value === '') {
                value = '-';
            }
            cell.textContent = value;
            row.appendChild(cell);
        }
        
        tableBody.appendChild(row);
    });
    
    updatePagination();
    
    if (filteredData.length > 0) {
        rowCount.textContent = `Showing ${startIndex + 1}-${endIndex} of ${filteredData.length} players`;
    } else {
        rowCount.textContent = 'No players found';
    }
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
    
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
    
    if (filteredData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="17" style="text-align: center; padding: 20px; color: #666;">No players found matching your filters</td></tr>`;
        rowCount.textContent = `Showing 0 of 0 players`;
    }
}

// Update the last update date from data
function updateLastUpdateDate() {
    let latestDate = null;
    
    playersData.forEach(player => {
        const updateDate = player[16];
        if (updateDate && updateDate !== "Status Unknown" && updateDate !== "-") {
            if (updateDate.includes('/')) {
                const dateParts = updateDate.split('/');
                if (dateParts.length === 3) {
                    const year = dateParts[2].length === 2 ? '20' + dateParts[2] : dateParts[2];
                    const date = new Date(year, dateParts[0] - 1, dateParts[1]);
                    if (!isNaN(date) && (!latestDate || date > latestDate)) {
                        latestDate = date;
                    }
                }
            }
        }
    });
    
    if (latestDate) {
        const formattedDate = latestDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        lastUpdate.textContent = formattedDate;
    } else {
        lastUpdate.textContent = "December 2025";
    }
}
