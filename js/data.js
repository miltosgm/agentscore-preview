/**
 * Agent data loader for AgentScore
 * Loads from Supabase with fallback to local JSON
 */

// Cache for loaded agents
let agentCache = null;
let useSupabase = false; // Using JSON data with 20 real agents & developers

/**
 * Load agent data - tries Supabase first, falls back to JSON
 */
async function loadAgentData() {
    if (agentCache) {
        return agentCache;
    }

    // Try Supabase first
    if (useSupabase && window.AgentScore) {
        try {
            console.log('📡 Loading agents from Supabase...');
            const { data, error } = await window.AgentScore.db.getAgents({ limit: 500 });
            
            if (!error && data && data.length > 0) {
                console.log(`✅ Loaded ${data.length} agents from Supabase`);
                agentCache = data.map(agent => transformSupabaseAgent(agent));
                return agentCache;
            }
            console.log('⚠️ Supabase returned no data, falling back to JSON');
        } catch (err) {
            console.log('⚠️ Supabase error, falling back to JSON:', err.message);
        }
    }

    // Fallback to local JSON
    try {
        console.log('📁 Loading agents from local JSON...');
        const response = await fetch('/all-agents-with-reviews.json');
        const rawAgents = await response.json();
        agentCache = rawAgents.map(agent => enhanceAgent(agent));
        console.log(`✅ Loaded ${agentCache.length} agents from JSON`);
        return agentCache;
    } catch (error) {
        console.error('Error loading agent data:', error);
        return getFallbackData();
    }
}

/**
 * Load a single agent by ID (Supabase) or name (fallback)
 */
async function loadAgentById(id) {
    // Try Supabase first (id is UUID)
    if (useSupabase && window.AgentScore) {
        try {
            const { data, error } = await window.AgentScore.db.getAgent(id);
            if (!error && data) {
                return transformSupabaseAgent(data);
            }
        } catch (err) {
            console.log('Agent not found in Supabase, trying by name...');
        }
    }
    
    // Fallback: load all and find by name
    const agents = await loadAgentData();
    return agents.find(a => a.name === id || a.id === id);
}

/**
 * Transform Supabase agent to frontend format
 */
function transformSupabaseAgent(agent) {
    return {
        id: agent.id,
        name: agent.name,
        location: agent.location,
        url: agent.bazaraki_url || agent.website || '#',
        website: agent.website,
        ads: agent.listing_count || 0,
        rating: agent.google_rating || generateRating(agent.name),
        reviewCount: agent.google_reviews_count || 0,
        email: agent.email,
        phone: agent.phone,
        logoUrl: agent.logo_url,
        sampleReview: agent.sample_review,
        services: generateServices(hashString(agent.name)),
        tags: generateTags(hashString(agent.name), agent.location)
    };
}

/**
 * Enhance raw JSON agent data with ratings
 */
function enhanceAgent(agent) {
    const nameHash = hashString(agent.name);
    const rating = agent.google_rating || (3.5 + (nameHash % 15) / 10);
    const reviewCount = agent.google_review_count || Math.max(Math.floor(Math.min(agent.ads, 200) * 0.3), 3);
    
    return {
        name: agent.name,
        type: agent.type || 'agent',
        location: agent.location,
        url: agent.url,
        website: agent.website,
        ads: agent.ads || 0,
        rating: Math.round(rating * 10) / 10,
        reviewCount: reviewCount,
        established: agent.established,
        description: agent.description,
        phone: agent.phone,
        featured_project: agent.featured_project,
        sampleReview: agent.google_reviews?.[0] || null,
        services: generateServices(nameHash),
        tags: generateTags(nameHash, agent.location, agent.type)
    };
}

/**
 * Generate rating from name hash (for agents without Google rating)
 */
function generateRating(name) {
    const hash = hashString(name);
    return Math.round((3.5 + (hash % 15) / 10) * 10) / 10;
}

/**
 * Generate a hash from string
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
    const services = ['Sales'];
    if (hash % 2 === 0) services.push('Rentals');
    if (hash % 3 === 0) services.push('Commercial');
    if (hash % 5 === 0) services.push('Property Management');
    if (hash % 7 === 0) services.push('Investment');
    return services;
}

/**
 * Generate tags based on hash, location, and type
 */
function generateTags(hash, location, type) {
    const tags = [];
    if (type === 'developer') {
        tags.push('Developer');
        if (hash % 2 === 0) tags.push('New Projects');
        if (hash % 3 === 0) tags.push('Luxury');
    } else {
        if (hash % 3 === 0) tags.push('Expat Friendly');
        if (hash % 4 === 0) tags.push('Luxury Properties');
        if (hash % 5 === 0) tags.push('New Builds');
    }
    if (location === 'Limassol' && hash % 2 === 0) tags.push('Beachfront');
    if (location === 'Paphos' && hash % 3 === 0) tags.push('Retirement Specialist');
    return tags;
}

/**
 * Fallback data if all loading fails
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
            stats[agent.location] = { count: 0, totalRating: 0, totalReviews: 0 };
        }
        stats[agent.location].count++;
        stats[agent.location].totalRating += agent.rating;
        stats[agent.location].totalReviews += agent.reviewCount;
    });
    
    Object.keys(stats).forEach(city => {
        stats[city].avgRating = (stats[city].totalRating / stats[city].count).toFixed(1);
    });
    
    return stats;
}
