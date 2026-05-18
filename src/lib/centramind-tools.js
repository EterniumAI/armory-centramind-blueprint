// src/lib/centramind-tools.js
// Centramind agent tool definitions (OpenAI tool-calling format) and dispatcher.
// Consumed by the Chat tab agent (W8.A.3) as the `tools` array.

// --- Tool Definitions ---

export const TOOLS = [
  // Pages + accounts (read)
  {
    type: 'function',
    function: {
      name: 'list_pages',
      description: 'List connected Facebook pages and linked Instagram business accounts.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_ad_accounts',
      description: 'List connected Meta ad accounts.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },

  // Content (write)
  {
    type: 'function',
    function: {
      name: 'compose_post',
      description: 'Publish or schedule a text/image post to Facebook or Instagram.',
      parameters: {
        type: 'object',
        properties: {
          page_ids: { type: 'array', items: { type: 'string' }, description: 'Page IDs to post to.' },
          message: { type: 'string', description: 'Post caption text.' },
          image_url: { type: 'string', description: 'Optional image URL.' },
          scheduled_at: { type: 'string', description: 'ISO 8601 timestamp to schedule. Omit for immediate.' },
          instagram: { type: 'boolean', description: 'If true, post to linked IG account.' },
        },
        required: ['page_ids', 'message'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compose_reel',
      description: 'Publish or schedule a Reel to Facebook or Instagram.',
      parameters: {
        type: 'object',
        properties: {
          page_ids: { type: 'array', items: { type: 'string' }, description: 'Page IDs.' },
          video_url: { type: 'string', description: 'Video URL for the reel.' },
          caption: { type: 'string', description: 'Reel caption.' },
          thumbnail_url: { type: 'string', description: 'Optional thumbnail URL.' },
          scheduled_at: { type: 'string', description: 'ISO 8601 schedule time.' },
          instagram: { type: 'boolean', description: 'If true, post to IG.' },
        },
        required: ['page_ids', 'video_url', 'caption'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compose_story',
      description: 'Publish an Instagram Story (image or video).',
      parameters: {
        type: 'object',
        properties: {
          page_id: { type: 'string', description: 'Page ID with linked IG account.' },
          media_url: { type: 'string', description: 'Media URL (image or video).' },
          media_type: { type: 'string', enum: ['image', 'video'], description: 'Type of media.' },
        },
        required: ['page_id', 'media_url', 'media_type'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compose_carousel',
      description: 'Publish or schedule an Instagram carousel post.',
      parameters: {
        type: 'object',
        properties: {
          page_id: { type: 'string', description: 'Page ID with linked IG account.' },
          caption: { type: 'string', description: 'Carousel caption.' },
          children: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                image_url: { type: 'string' },
                alt_text: { type: 'string' },
              },
              required: ['image_url'],
            },
            description: 'Array of carousel items.',
          },
          scheduled_at: { type: 'string', description: 'ISO 8601 schedule time.' },
        },
        required: ['page_id', 'caption', 'children'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_scheduled_posts',
      description: 'List scheduled or published posts for a page.',
      parameters: {
        type: 'object',
        properties: {
          page_id: { type: 'string', description: 'Filter by page ID.' },
          status: { type: 'string', description: 'Filter by status (scheduled, published).' },
          limit: { type: 'number', description: 'Max results to return.' },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_scheduled_post',
      description: 'Cancel a scheduled post by ID.',
      parameters: {
        type: 'object',
        properties: {
          post_id: { type: 'string', description: 'The scheduled post ID to cancel.' },
        },
        required: ['post_id'],
        additionalProperties: false,
      },
    },
  },

  // Ads (read)
  {
    type: 'function',
    function: {
      name: 'list_campaigns',
      description: 'List ad campaigns for an ad account.',
      parameters: {
        type: 'object',
        properties: {
          ad_account_id: { type: 'string', description: 'Ad account ID.' },
          status: { type: 'string', description: 'Filter by status.' },
        },
        required: ['ad_account_id'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_ad_sets',
      description: 'List ad sets within a campaign.',
      parameters: {
        type: 'object',
        properties: {
          campaign_id: { type: 'string', description: 'Campaign ID.' },
          status: { type: 'string', description: 'Filter by status.' },
        },
        required: ['campaign_id'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_ads',
      description: 'List ads within an ad set.',
      parameters: {
        type: 'object',
        properties: {
          ad_set_id: { type: 'string', description: 'Ad set ID.' },
          status: { type: 'string', description: 'Filter by status.' },
        },
        required: ['ad_set_id'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_ad_insights',
      description: 'Get performance insights for an ad, ad set, or campaign.',
      parameters: {
        type: 'object',
        properties: {
          level: { type: 'string', enum: ['ad', 'adset', 'campaign'], description: 'Reporting level.' },
          id: { type: 'string', description: 'Entity ID at the specified level.' },
          date_preset: { type: 'string', description: 'Date range preset (e.g. last_7d, last_30d).' },
        },
        required: ['level', 'id'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_ad_account_insights',
      description: 'Get aggregated insights for an entire ad account.',
      parameters: {
        type: 'object',
        properties: {
          ad_account_id: { type: 'string', description: 'Ad account ID.' },
          date_preset: { type: 'string', description: 'Date range preset.' },
        },
        required: ['ad_account_id'],
        additionalProperties: false,
      },
    },
  },

  // Ads (write)
  {
    type: 'function',
    function: {
      name: 'pause_ad',
      description: 'Pause a running ad.',
      parameters: {
        type: 'object',
        properties: {
          ad_id: { type: 'string', description: 'Ad ID to pause.' },
        },
        required: ['ad_id'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resume_ad',
      description: 'Resume a paused ad.',
      parameters: {
        type: 'object',
        properties: {
          ad_id: { type: 'string', description: 'Ad ID to resume.' },
        },
        required: ['ad_id'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'archive_ad',
      description: 'Archive (retire) an ad permanently.',
      parameters: {
        type: 'object',
        properties: {
          ad_id: { type: 'string', description: 'Ad ID to archive.' },
        },
        required: ['ad_id'],
        additionalProperties: false,
      },
    },
  },

  // AI assistance
  {
    type: 'function',
    function: {
      name: 'suggest_ad_copy',
      description: 'Generate AI ad copy suggestions for a product and audience.',
      parameters: {
        type: 'object',
        properties: {
          brand: { type: 'string', description: 'Brand name.' },
          product: { type: 'string', description: 'Product or offer.' },
          audience: { type: 'string', description: 'Target audience description.' },
          objective: { type: 'string', description: 'Campaign objective.' },
        },
        required: ['brand', 'product', 'audience', 'objective'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_organic_caption',
      description: 'Generate AI caption suggestions for an organic social post.',
      parameters: {
        type: 'object',
        properties: {
          platform: { type: 'string', description: 'Target platform (facebook, instagram).' },
          topic: { type: 'string', description: 'Post topic or brief.' },
          brand_voice_notes: { type: 'string', description: 'Optional brand voice guidance.' },
        },
        required: ['platform', 'topic'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'research_audience',
      description: 'Generate AI audience segment research for a brand and product.',
      parameters: {
        type: 'object',
        properties: {
          brand: { type: 'string', description: 'Brand name.' },
          product: { type: 'string', description: 'Product or offer.' },
          market: { type: 'string', description: 'Target market geography.' },
          prior_segments: { type: 'string', description: 'Prior segments tried (context).' },
        },
        required: ['brand', 'product'],
        additionalProperties: false,
      },
    },
  },

  // Workspace meta
  {
    type: 'function',
    function: {
      name: 'get_active_tenant',
      description: 'Get the current workspace tenant configuration.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate_to_tab',
      description: 'Request navigation to a specific dashboard tab.',
      parameters: {
        type: 'object',
        properties: {
          tab_id: { type: 'string', description: 'Target tab identifier.' },
          sub_tab: { type: 'string', description: 'Optional sub-tab within the target tab.' },
        },
        required: ['tab_id'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_credit_balance',
      description: 'Get the current workspace credit balance.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
];

// --- Dispatcher ---

const API_META = '/api/meta';
const API_WORKSPACE = '/api/workspace';

const HANDLERS = {
  // Pages + accounts
  async list_pages(_args, ctx) {
    return get(`${API_META}/pages`, {}, ctx);
  },

  async list_ad_accounts(_args, ctx) {
    return get(`${API_META}/ads/accounts`, {}, ctx);
  },

  // Content
  async compose_post(args, ctx) {
    const endpoint = args.scheduled_at ? `${API_META}/schedule` : `${API_META}/post`;
    return post(endpoint, args, ctx);
  },

  async compose_reel(args, ctx) {
    return post(`${API_META}/reel`, args, ctx);
  },

  async compose_story(args, ctx) {
    return post(`${API_META}/story`, args, ctx);
  },

  async compose_carousel(args, ctx) {
    return post(`${API_META}/carousel`, args, ctx);
  },

  async list_scheduled_posts(args, ctx) {
    const params = {};
    if (args.page_id) params.page_id = args.page_id;
    if (args.status) params.status = args.status;
    if (args.limit) params.limit = String(args.limit);
    return get(`${API_META}/posts`, params, ctx);
  },

  async cancel_scheduled_post(args, ctx) {
    return del(`${API_META}/posts/${args.post_id}`, ctx);
  },

  // Ads (read)
  async list_campaigns(args, ctx) {
    const params = { ad_account_id: args.ad_account_id };
    if (args.status) params.status = args.status;
    return get(`${API_META}/ads/campaigns`, params, ctx);
  },

  async list_ad_sets(args, ctx) {
    const params = { campaign_id: args.campaign_id };
    if (args.status) params.status = args.status;
    return get(`${API_META}/ads/adsets`, params, ctx);
  },

  async list_ads(args, ctx) {
    const params = { ad_set_id: args.ad_set_id };
    if (args.status) params.status = args.status;
    return get(`${API_META}/ads/ads`, params, ctx);
  },

  async get_ad_insights(args, ctx) {
    const params = {};
    if (args.date_preset) params.date_preset = args.date_preset;
    return get(`${API_META}/ads/insights/${args.level}/${args.id}`, params, ctx);
  },

  async get_ad_account_insights(args, ctx) {
    const params = { ad_account_id: args.ad_account_id };
    if (args.date_preset) params.date_preset = args.date_preset;
    return get(`${API_META}/ads/insights/account/${args.ad_account_id}`, params, ctx);
  },

  // Ads (write)
  async pause_ad(args, ctx) {
    return post(`${API_META}/ads/ad/${args.ad_id}/pause`, {}, ctx);
  },

  async resume_ad(args, ctx) {
    return post(`${API_META}/ads/ad/${args.ad_id}/resume`, {}, ctx);
  },

  async archive_ad(args, ctx) {
    return post(`${API_META}/ads/ad/${args.ad_id}/archive`, {}, ctx);
  },

  // AI assistance
  async suggest_ad_copy(args, ctx) {
    return post(`${API_WORKSPACE}/ai/suggest`, {
      template: 'nadia.meta.ad_copy',
      brand: args.brand,
      product: args.product,
      audience: args.audience,
      objective: args.objective,
    }, ctx);
  },

  async suggest_organic_caption(args, ctx) {
    return post(`${API_WORKSPACE}/ai/suggest`, {
      template: 'nadia.meta.organic_post',
      platform: args.platform,
      topic: args.topic,
      brand_voice_notes: args.brand_voice_notes || '',
    }, ctx);
  },

  async research_audience(args, ctx) {
    return post(`${API_WORKSPACE}/ai/audience-research`, {
      brand_name: args.brand,
      product_or_offer: args.product,
      market_geography: args.market || '',
      prior_segments_tried: args.prior_segments || '',
    }, ctx);
  },

  // Workspace meta
  async get_active_tenant(_args, _ctx) {
    // Reads from local state; no network call needed
    const state = await import('../../state/projects.json', { with: { type: 'json' } }).catch(() => null);
    return state?.default || { tenant: 'unknown' };
  },

  async navigate_to_tab(args, _ctx) {
    // Navigation is handled client-side in W8.A.3; return structured intent
    return {
      action: 'navigation_requested',
      tab_id: args.tab_id,
      sub_tab: args.sub_tab || null,
    };
  },

  async get_credit_balance(_args, ctx) {
    return get(`${API_WORKSPACE}/balance`, {}, ctx);
  },
};

export async function dispatch(toolName, args, ctx) {
  const handler = HANDLERS[toolName];
  if (!handler) {
    return { error: `unknown_tool: ${toolName}` };
  }
  try {
    const result = await handler(args, ctx || {});
    return { result };
  } catch (err) {
    return { error: err.message || String(err) };
  }
}

// --- Internal HTTP helpers ---

function buildUrl(path, params) {
  const qs = new URLSearchParams(params).toString();
  return qs ? `${path}?${qs}` : path;
}

async function get(path, params, ctx) {
  const url = buildUrl(path, params);
  const fetchFn = ctx?.fetch || globalThis.fetch;
  const res = await fetchFn(url, {
    method: 'GET',
    signal: ctx?.signal,
  });
  return res.json();
}

async function post(path, body, ctx) {
  const fetchFn = ctx?.fetch || globalThis.fetch;
  const res = await fetchFn(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: ctx?.signal,
  });
  return res.json();
}

async function del(path, ctx) {
  const fetchFn = ctx?.fetch || globalThis.fetch;
  const res = await fetchFn(path, {
    method: 'DELETE',
    signal: ctx?.signal,
  });
  return res.json();
}
