/**
 * Import agents from JSON to Supabase
 * Run this once to populate the database
 * 
 * Set environment variables before running:
 * VITE_SUPABASE_URL=https://your-project.supabase.co
 * VITE_SUPABASE_ANON_KEY=your_anon_key_here
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

async function importAgents() {
    console.log('📥 Starting agent import...');
    
    // Load agent data
    const response = await fetch('../all-agents-with-reviews.json');
    const rawAgents = await response.json();
    console.log(`📋 Loaded ${rawAgents.length} agents from JSON`);
    
    // Transform to Supabase format
    const agents = rawAgents.map(agent => ({
        name: agent.name,
        location: agent.location,
        bazaraki_url: agent.url,
        listing_count: agent.ads || 0,
        google_rating: agent.google_rating || null,
        google_reviews_count: agent.google_review_count || 0,
        // Extract a sample review if available
        sample_review: agent.google_reviews && agent.google_reviews.length > 0 
            ? agent.google_reviews[0] 
            : null
    }));
    
    console.log('🔄 Inserting agents into Supabase...');
    
    // Insert in batches of 50
    const batchSize = 50;
    let inserted = 0;
    let errors = [];
    
    for (let i = 0; i < agents.length; i += batchSize) {
        const batch = agents.slice(i, i + batchSize);
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/agents`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(batch)
        });
        
        if (response.ok) {
            inserted += batch.length;
            console.log(`✅ Inserted ${inserted}/${agents.length} agents`);
        } else {
            const error = await response.text();
            errors.push({ batch: i, error });
            console.error(`❌ Error at batch ${i}:`, error);
        }
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Inserted: ${inserted} agents`);
    console.log(`   ❌ Errors: ${errors.length} batches`);
    
    if (errors.length > 0) {
        console.log('\n❌ Error details:', errors);
    }
    
    return { inserted, errors };
}

// Run if in browser
if (typeof window !== 'undefined') {
    window.importAgents = importAgents;
}
