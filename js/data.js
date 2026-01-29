/**
 * Agent data loader for AgentScore
 * Loads data from collected-agents.json and enhances with mock ratings
 */

// Cache for loaded agents
let agentCache = null;

/**
 * Load agent data from JSON file
 * In production, this would be an API call
 */
async function loadAgentData() {
    if (agentCache) {
        return agentCache;
    }

    try {
        const response = await fetch('../collected-agents.json');
        const rawAgents = await response.json();
        
        // Enhance agents with mock ratings and review counts
        agentCache = rawAgents.map(agent => enhanceAgent(agent));
        
        return agentCache;
    } catch (error) {
        console.error('Error loading agent data:', error);
        // Return fallback data if fetch fails
        return getFallbackData();
    }
}

/**
 * Enhance raw agent data with ratings and additional info
 */
function enhanceAgent(agent) {
    // Generate consistent rating based on name (so it's repeatable)
    const nameHash = hashString(agent.name);
    const baseRating = 3.5 + (nameHash % 15) / 10; // 3.5 to 5.0
    const rating = Math.round(baseRating * 10) / 10;
    
    // Generate review count based on ads count and rating
    const reviewBase = Math.min(agent.ads, 200);
    const reviewCount = Math.floor(reviewBase * (0.3 + (rating - 3.5) * 0.2));
    
    return {
        ...agent,
        rating: rating,
        reviewCount: Math.max(reviewCount, 3), // At least 3 reviews
        services: generateServices(nameHash),
        tags: generateTags(nameHash, agent.location)
    };
}

/**
 * Generate a simple hash from a string
 */
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

/**
 * Generate services based on hash
 */
function generateServices(hash) {
    const allServices = ['Sales', 'Rentals', 'Commercial', 'Property Management', 'Investment'];
    const services = ['Sales']; // Always include Sales
    
    if (hash % 2 === 0) services.push('Rentals');
    if (hash % 3 === 0) services.push('Commercial');
    if (hash % 5 === 0) services.push('Property Management');
    if (hash % 7 === 0) services.push('Investment');
    
    return services;
}

/**
 * Generate tags based on hash and location
 */
function generateTags(hash, location) {
    const tags = [];
    
    if (hash % 3 === 0) tags.push('Expat Friendly');
    if (hash % 4 === 0) tags.push('Luxury Properties');
    if (hash % 5 === 0) tags.push('New Builds');
    if (location === 'Limassol' && hash % 2 === 0) tags.push('Beachfront');
    if (location === 'Paphos' && hash % 3 === 0) tags.push('Retirement Specialist');
    
    return tags;
}

/**
 * Fallback data if JSON fails to load
 */
function getFallbackData() {
    return [
        {
            name: "Kalogirou Real Estate",
            url: "https://www.bazaraki.com/c/kalogirourealestate/",
            location: "Larnaca",
            ads: 1491,
            rating: 4.8,
            reviewCount: 389,
            services: ['Sales', 'Rentals'],
            tags: ['Expat Friendly']
        },
        {
            name: "CENTURY 21",
            url: "https://www.bazaraki.com/c/century21/",
            location: "Limassol",
            ads: 932,
            rating: 4.6,
            reviewCount: 245,
            services: ['Sales', 'Rentals', 'Commercial'],
            tags: ['Luxury Properties']
        },
        {
            name: "Cyprus Sothebys International Realty",
            url: "https://www.bazaraki.com/c/sothebys/",
            location: "Paphos",
            ads: 916,
            rating: 4.9,
            reviewCount: 156,
            services: ['Sales', 'Investment'],
            tags: ['Luxury Properties', 'Expat Friendly']
        }
    ];
}

/**
 * Get agents by city
 */
function getAgentsByCity(city) {
    return agentCache ? agentCache.filter(a => a.location === city) : [];
}

/**
 * Get agent by name
 */
function getAgentByName(name) {
    return agentCache ? agentCache.find(a => a.name === name) : null;
}

/**
 * Get city statistics
 */
function getCityStats() {
    if (!agentCache) return {};
    
    const stats = {};
    agentCache.forEach(agent => {
        if (!stats[agent.location]) {
            stats[agent.location] = {
                count: 0,
                totalRating: 0,
                totalReviews: 0
            };
        }
        stats[agent.location].count++;
        stats[agent.location].totalRating += agent.rating;
        stats[agent.location].totalReviews += agent.reviewCount;
    });
    
    // Calculate averages
    Object.keys(stats).forEach(city => {
        stats[city].avgRating = (stats[city].totalRating / stats[city].count).toFixed(1);
    });
    
    return stats;
}
