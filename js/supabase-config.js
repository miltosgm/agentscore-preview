// Supabase Configuration for AgentScore
const SUPABASE_URL = 'https://sqjvwnuqbvnfvftvgzdz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LxH-UyL1WE8Y8BOthTQkaA_IOfpdMZ7';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth helper functions
const auth = {
  // Get current user
  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Sign up with email
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  // Sign in with email
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign in with magic link
  async signInWithMagicLink(email) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Listen to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database helper functions
const db = {
  // Get all agents
  async getAgents({ location, search, limit = 50, offset = 0 } = {}) {
    let query = supabase
      .from('agents')
      .select('*')
      .order('listing_count', { ascending: false })
      .range(offset, offset + limit - 1);

    if (location) {
      query = query.eq('location', location);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;
    return { data, error };
  },

  // Get single agent
  async getAgent(id) {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  // Get reviews for an agent
  async getReviews(agentId) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        user:auth.users(email)
      `)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // Create a review
  async createReview({ agentId, rating, title, content }) {
    const user = await auth.getUser();
    if (!user) {
      return { error: { message: 'Must be logged in to create a review' } };
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        agent_id: agentId,
        user_id: user.id,
        rating,
        title,
        content,
      })
      .select()
      .single();
    return { data, error };
  },

  // Update a review
  async updateReview(reviewId, { rating, title, content }) {
    const { data, error } = await supabase
      .from('reviews')
      .update({ rating, title, content, updated_at: new Date().toISOString() })
      .eq('id', reviewId)
      .select()
      .single();
    return { data, error };
  },

  // Delete a review
  async deleteReview(reviewId) {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);
    return { error };
  },

  // Get agent stats (average rating, review count)
  async getAgentStats(agentId) {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('agent_id', agentId);

    if (error) return { error };

    const count = data.length;
    const average = count > 0 
      ? data.reduce((sum, r) => sum + r.rating, 0) / count 
      : 0;

    return { 
      data: { 
        reviewCount: count, 
        averageRating: Math.round(average * 10) / 10 
      } 
    };
  }
};

// Export for use in other scripts
window.AgentScore = { supabase, auth, db };
