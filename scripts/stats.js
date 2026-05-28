// stats.js - Analyze player data from JSON files

let menData = [];
let womenData = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadAllData();
    displayStats();
    setupMobileMenu();
});

// Load both JSON files
async function loadAllData() {
    try {
        document.getElementById('loadingMessage').style.display = 'block';
        
        // Load men's data from JSON
        try {
            const menResponse = await fetch('/json/mens.json');
            if (menResponse.ok) {
                const menJson = await menResponse.json();
                menData = convertJSONToArray(menJson);
                console.log(`Loaded ${menData.length} men's players`);
            } else {
                console.warn('Men\'s data file not found');
            }
        } catch (error) {
            console.warn('Error loading men\'s data:', error);
        }
        
        // Load women's data from JSON
        try {
            const womenResponse = await fetch('/json/womens.json');
            if (womenResponse.ok) {
                const womenJson = await womenResponse.json();
                womenData = convertJSONToArray(womenJson);
                console.log(`Loaded ${womenData.length} women's players`);
            } else {
                console.warn('Women\'s data file not found');
            }
        } catch (error) {
            console.warn('Error loading women\'s data:', error);
        }
        
        document.getElementById('loadingMessage').style.display = 'none';
        
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('loadingMessage').innerHTML = 'Error loading database file.';
    }
}

// Convert JSON objects back to array format for compatibility
function convertJSONToArray(jsonData) {
    return jsonData.map(player => [
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
}

// Extract country from player data (column index 9)
function getPlayerCountry(player) {
    return player[9] || 'Unknown';
}

// Extract club name from player data (column index 8)
function getPlayerClub(player) {
    return player[8] || '';
}

// Extract NT from player data (column index 12)
function getPlayerNT(player) {
    return player[12] || '';
}

// Extract position from player data (column index 2)
function getPlayerPositions(player) {
    const positionField = player[2] || '';
    return positionField.split(',').map(pos => pos.trim()).filter(pos => pos && pos !== '??' && pos !== 'Unknown');
}

// Position categories mapping
const positionCategories = {
    'Forwards': ['ST', 'CF', 'FW'],
    'Midfielders': ['LM', 'CM', 'CAM', 'CDM', 'RM', 'MF'],
    'Defenders': ['LB', 'CB', 'RB', 'DF'],
    'Wingers': ['LW', 'RW', 'LWB', 'RWB'],
    'Goalkeepers': ['GK']
};

// Categorize position
function categorizePosition(position) {
    if (!position) return 'Unknown';
    
    const positionUpper = position.toUpperCase().trim();
    
    for (const [category, positions] of Object.entries(positionCategories)) {
        for (const pos of positions) {
            if (positionUpper === pos || positionUpper.includes(pos)) {
                return category;
            }
        }
    }
    
    return 'Other';
}

// Calculate statistics
function calculateStats(data) {
    const stats = {
        total: data.length,
        countries: new Set(),
        positions: {
            'Forwards': 0,
            'Midfielders': 0,
            'Wingers': 0,
            'Defenders': 0,
            'Goalkeepers': 0,
            'Other': 0,
            'Unknown': 0
        },
        clubStatus: {
            'With Club': 0,
            'Without Club': 0
        },
        ntCallups: {
            'Bangladesh': 0,
            'Other Countries': 0,
            'No NT': 0
        }
    };
    
    data.forEach(player => {
        // Count countries
        const country = getPlayerCountry(player);
        if (country && country !== '-') {
            stats.countries.add(country);
        }
        
        // Club Status
        const club = getPlayerClub(player);
        if (club === 'Unattached') {
            stats.clubStatus['Without Club']++;
        } else if (club && club !== '-' && club !== '') {
            stats.clubStatus['With Club']++;
        } else {
            stats.clubStatus['Without Club']++;
        }
        
        // NT Callups
        const nt = getPlayerNT(player);
        if (nt === 'BAN') {
            stats.ntCallups['Bangladesh']++;
        } else if (nt && nt !== '-' && nt !== '') {
            stats.ntCallups['Other Countries']++;
        } else {
            stats.ntCallups['No NT']++;
        }
        
        // Get all positions
        const positions = getPlayerPositions(player);
        
        if (positions.length === 0) {
            stats.positions['Unknown']++;
        } else {
            const countedCategories = new Set();
            
            positions.forEach(position => {
                const category = categorizePosition(position);
                if (category !== 'Unknown' && category !== 'Other') {
                    countedCategories.add(category);
                }
            });
            
            if (countedCategories.size > 0) {
                countedCategories.forEach(category => {
                    stats.positions[category] = (stats.positions[category] || 0) + 1;
                });
            } else {
                stats.positions['Other']++;
            }
        }
    });
    
    return stats;
}

// Update last updated timestamp
function updateLastUpdateDate() {
    const allData = [...menData, ...womenData];
    let latestDate = null;
    
    allData.forEach(player => {
        const updateDate = player[16];
        if (updateDate && updateDate !== "Status Unknown" && updateDate !== "-") {
            const dateStr = updateDate.trim();
            
            if (dateStr.includes('/')) {
                const dateParts = dateStr.split('/');
                if (dateParts.length === 3) {
                    let year = dateParts[2];
                    if (year.length === 2) {
                        year = '20' + year;
                    }
                    const date = new Date(year, dateParts[0] - 1, dateParts[1]);
                    if (!isNaN(date) && (!latestDate || date > latestDate)) {
                        latestDate = date;
                    }
                }
            } else if (dateStr.includes('-')) {
                const dateParts = dateStr.split('-');
                if (dateParts.length === 3) {
                    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                    if (!isNaN(date) && (!latestDate || date > latestDate)) {
                        latestDate = date;
                    }
                }
            }
        }
    });
    
    if (latestDate) {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        document.getElementById('statsUpdated').textContent = latestDate.toLocaleDateString('en-US', options);
    } else {
        document.getElementById('statsUpdated').textContent = 'December 2025';
    }
}

// Display statistics
function displayStats() {
    const menStats = calculateStats(menData);
    const womenStats = calculateStats(womenData);
    
    // Update summary cards
    document.getElementById('totalMen').textContent = menStats.total.toLocaleString();
    document.getElementById('totalWomen').textContent = womenStats.total.toLocaleString();
    
    document.getElementById('menCountries').textContent = menStats.countries.size.toLocaleString();
    document.getElementById('womenCountries').textContent = womenStats.countries.size.toLocaleString();
    
    document.getElementById('menWithClub').textContent = menStats.clubStatus['With Club'].toLocaleString();
    document.getElementById('menWithoutClub').textContent = menStats.clubStatus['Without Club'].toLocaleString();
    document.getElementById('womenWithClub').textContent = womenStats.clubStatus['With Club'].toLocaleString();
    document.getElementById('womenWithoutClub').textContent = womenStats.clubStatus['Without Club'].toLocaleString();
    
    document.getElementById('menNTBangladesh').textContent = menStats.ntCallups['Bangladesh'].toLocaleString();
    document.getElementById('menNTOther').textContent = menStats.ntCallups['Other Countries'].toLocaleString();
    document.getElementById('menNTNone').textContent = menStats.ntCallups['No NT'].toLocaleString();
    document.getElementById('womenNTBangladesh').textContent = womenStats.ntCallups['Bangladesh'].toLocaleString();
    document.getElementById('womenNTOther').textContent = womenStats.ntCallups['Other Countries'].toLocaleString();
    document.getElementById('womenNTNone').textContent = womenStats.ntCallups['No NT'].toLocaleString();
    
    const positionRows = {
        'Forwards': 'forwardsRow',
        'Wingers': 'wingersRow',
        'Midfielders': 'midfieldersRow',
        'Defenders': 'defendersRow',
        'Goalkeepers': 'goalkeepersRow',
        'Other': 'otherRow'
    };
    
    for (const [position, rowId] of Object.entries(positionRows)) {
        const menCount = menStats.positions[position] || 0;
        const womenCount = womenStats.positions[position] || 0;
        
        document.getElementById(`${rowId}Men`).textContent = menCount.toLocaleString();
        document.getElementById(`${rowId}Women`).textContent = womenCount.toLocaleString();
    }
    
    updateLastUpdateDate();
}

// Setup mobile menu
function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });
}
