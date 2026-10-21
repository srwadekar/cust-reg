import { Agent } from '../types/agent';
import { supabase } from '../lib/supabaseClient';

const LOCAL_STORAGE_KEY = 'sf_agents_data';

export const DEFAULT_SEED_AGENTS: Agent[] = [
  {
    id: 101,
    name: 'रामेश्वर पाटील',
    centerName: 'पाटील महा-ई-सेवा केंद्र',
    center_name: 'पाटील महा-ई-सेवा केंद्र',
    mobile: '9822334455',
    village: 'वीरगाव',
    notes: 'नियमित एजंट (सटाणा रोड)'
  },
  {
    id: 102,
    name: 'योगेश अहिरे',
    centerName: 'अहिरे डिजिटल सेवा केंद्र',
    center_name: 'अहिरे डिजिटल सेवा केंद्र',
    mobile: '9860112233',
    village: 'देवळा',
    notes: 'दाखले व पॅन कार्ड पार्टनर'
  },
  {
    id: 103,
    name: 'सचिन सोनवणे',
    centerName: 'सोनवणे ऑनलाइन सर्व्हिसेस',
    center_name: 'सोनवणे ऑनलाइन सर्व्हिसेस',
    mobile: '9765443322',
    village: 'ताहाराबाद',
    notes: 'शिष्यवृत्ती व रेशन कार्ड'
  }
];

export const agentService = {
  /**
   * Fetch all agents from Supabase with LocalStorage fallback
   */
  async getAgents(): Promise<Agent[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: Agent[] = data.map((item) => ({
            id: item.id,
            name: item.name,
            centerName: item.center_name || item.centerName || '',
            center_name: item.center_name || item.centerName || '',
            mobile: item.mobile || '',
            village: item.village || '',
            notes: item.notes || '',
            createdAt: item.created_at || item.createdAt || null,
            created_at: item.created_at || item.createdAt || null
          }));
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Supabase fetch agents warning:', err);
    }

    // LocalStorage fallback
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error parsing local agents:', e);
      }
    }

    // Default Seed
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_SEED_AGENTS));
    return DEFAULT_SEED_AGENTS;
  },

  /**
   * Add a new agent to Cloud and LocalStorage
   */
  async addAgent(agentData: Omit<Agent, 'id'>): Promise<Agent> {
    const newAgent: Agent = {
      ...agentData,
      id: Date.now(),
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    try {
      if (supabase) {
        await supabase.from('agents').upsert({
          id: newAgent.id,
          name: newAgent.name,
          center_name: newAgent.centerName || newAgent.center_name || '',
          mobile: newAgent.mobile || '',
          village: newAgent.village || '',
          notes: newAgent.notes || ''
        });
      }
    } catch (err) {
      console.warn('Supabase add agent error:', err);
    }

    const current = await this.getAgents();
    const updated = [newAgent, ...current];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return newAgent;
  },

  /**
   * Update existing agent
   */
  async updateAgent(id: number | string, agentData: Partial<Agent>): Promise<boolean> {
    try {
      if (supabase) {
        await supabase
          .from('agents')
          .update({
            name: agentData.name,
            center_name: agentData.centerName || agentData.center_name,
            mobile: agentData.mobile,
            village: agentData.village,
            notes: agentData.notes
          })
          .eq('id', id);
      }
    } catch (err) {
      console.warn('Supabase update agent error:', err);
    }

    const current = await this.getAgents();
    const idx = current.findIndex((a) => String(a.id) === String(id));
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...agentData };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
      return true;
    }
    return false;
  },

  /**
   * Delete agent by id
   */
  async deleteAgent(id: number | string): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from('agents').delete().eq('id', id);
      }
    } catch (err) {
      console.warn('Supabase delete agent error:', err);
    }

    const current = await this.getAgents();
    const updated = current.filter((a) => String(a.id) !== String(id));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return true;
  }
};
